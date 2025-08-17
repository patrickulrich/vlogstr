import { useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";
import { NostrSigner } from '@nostrify/nostrify';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  timeout?: number;
}

interface BlobDescriptor {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
}

// Calculate SHA-256 hash of a file
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadToBlossom(
  file: File, 
  signer: NostrSigner,
  options?: UploadOptions
): Promise<string[][]> {
  const server = 'https://blossom.primal.net';
  const timeout = options?.timeout || 300000; // 5 minutes default
  
  // Calculate the file hash first
  console.log('Calculating file hash...');
  const sha256 = await calculateSHA256(file);
  console.log('File SHA-256:', sha256);
  
  // Create Blossom authorization event (kind 24242)
  const authEvent = await signer.signEvent({
    kind: 24242,
    content: `Upload ${file.name}`,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', 'upload'],
      ['x', sha256],
      ['expiration', Math.floor(Date.now() / 1000 + 3600).toString()], // 1 hour expiration
    ],
  });
  
  const authHeader = btoa(JSON.stringify(authEvent));
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Set timeout
    xhr.timeout = timeout;
    
    // Progress handler
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        options.onProgress(progress);
        console.log(`Upload progress: ${progress}% (${(event.loaded / 1024 / 1024).toFixed(2)}MB / ${(event.total / 1024 / 1024).toFixed(2)}MB)`);
      }
    };
    
    // Success handler
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const descriptor: BlobDescriptor = JSON.parse(xhr.responseText);
          console.log('Blossom blob descriptor:', descriptor);
          
          if (descriptor.url && descriptor.sha256) {
            // Verify the hash matches
            if (descriptor.sha256 !== sha256) {
              console.warn('Server returned different hash:', descriptor.sha256, 'expected:', sha256);
            }
            
            // Generate NIP-94 compatible tags
            const tags: string[][] = [
              ['url', descriptor.url],
              ['x', descriptor.sha256],
              ['size', descriptor.size.toString()],
              ['m', descriptor.type || file.type || 'application/octet-stream'],
            ];
            
            // Add service tag for Blossom
            tags.push(['service', 'blossom']);
            
            resolve(tags);
          } else {
            reject(new Error('Invalid blob descriptor from Blossom server'));
          }
        } catch (error) {
          console.error('Failed to parse Blossom response:', xhr.responseText);
          reject(new Error(`Failed to parse server response: ${error}`));
        }
      } else if (xhr.status === 413) {
        reject(new Error('File too large for server limits'));
      } else if (xhr.status === 400) {
        reject(new Error('Invalid request - file may be corrupted'));
      } else if (xhr.status === 401 || xhr.status === 403) {
        reject(new Error('Authorization failed - please try logging in again'));
      } else {
        console.error('Blossom upload failed:', xhr.status, xhr.statusText, xhr.responseText);
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    // Error handler
    xhr.onerror = () => {
      console.error('Network error during upload');
      reject(new Error('Network error during upload. Please check your connection and try again.'));
    };
    
    // Timeout handler
    xhr.ontimeout = () => {
      console.error(`Upload timed out after ${timeout / 1000} seconds`);
      reject(new Error(`Upload timed out after ${timeout / 1000} seconds. The file may be too large or the connection too slow.`));
    };
    
    // Abort handler
    xhr.onabort = () => {
      console.error('Upload was aborted');
      reject(new Error('Upload was cancelled'));
    };
    
    // Send request using PUT method per BUD-02
    xhr.open('PUT', `${server}/upload`);
    xhr.setRequestHeader('Authorization', `Nostr ${authHeader}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    
    console.log(`Starting Blossom upload to ${server}:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type || 'application/octet-stream',
      sha256: sha256,
      timeout: `${timeout / 1000} seconds`
    });
    
    // Send the raw file data, not FormData
    xhr.send(file);
  });
}

export function useUploadFileWithProgress(options?: UploadOptions) {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      const tags = await uploadToBlossom(file, user.signer, options);
      return tags;
    },
  });
}