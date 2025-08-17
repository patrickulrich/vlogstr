import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFileWithProgress } from '@/hooks/useUploadFileWithProgress';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Video, Image, Loader2, CheckCircle2, AlertCircle, Heart, MessageCircle, Users, PlayCircle, ChevronDown, Plus, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { MentionInput } from '@/components/MentionInput';

const Dashboard = () => {
  useSeoMeta({
    title: 'Creator Dashboard - Vlogstr',
    description: 'Upload and manage your vlogs on the Nostr network',
  });

  const { user } = useCurrentUser();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { toast } = useToast();
  // Hook for video upload with progress
  const { mutateAsync: uploadVideoWithProgress } = useUploadFileWithProgress({
    onProgress: (progress) => {
      setVideoUploadProgress(progress);
      console.log(`Video upload progress: ${progress}%`);
    },
    timeout: 600000, // 10 minutes for video files
  });
  
  // Hook for thumbnail upload with progress
  const { mutateAsync: uploadThumbnailWithProgress } = useUploadFileWithProgress({
    onProgress: (progress) => {
      setThumbnailUploadProgress(progress);
      console.log(`Thumbnail upload progress: ${progress}%`);
    },
    timeout: 60000, // 1 minute for thumbnails
  });
  
  // Fallback upload without progress for auto-generated thumbnails
  const { mutateAsync: uploadFile } = useUploadFile();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'21' | '22'>('21');
  // Removed unused uploadProgress - now using individual progress states
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Upload state tracking
  const [videoUploadStatus, setVideoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [thumbnailUploadStatus, setThumbnailUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [uploadedVideoData, setUploadedVideoData] = useState<{url: string, tags: string[][], duration?: number} | null>(null);
  const [uploadedThumbnailData, setUploadedThumbnailData] = useState<{url: string, tags: string[][]} | null>(null);
  
  // Advanced NIP-71 features
  const [contentWarning, setContentWarning] = useState('');
  const [hasContentWarning, setHasContentWarning] = useState(false);
  const [participants, setParticipants] = useState<Array<{pubkey: string, relay?: string}>>([]);
  const [referenceLinks, setReferenceLinks] = useState<string[]>(['']);
  const [segments, setSegments] = useState<Array<{start: string, end: string, title: string, thumbnail?: string}>>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);


  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setVideoFile(e.target.files[0]);
      setVideoUrl('');
      setVideoUploadStatus('idle');
      setUploadedVideoData(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setThumbnailFile(e.target.files[0]);
      setThumbnailUrl('');
      setThumbnailUploadStatus('idle');
      setUploadedThumbnailData(null);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = async () => {
    if (!videoFile || !user) return;
    
    try {
      setVideoUploadStatus('uploading');
      setVideoUploadProgress(0);
      
      console.log('Starting video upload:', videoFile.name, 'Size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Get video duration first
      const duration = await getVideoDuration(videoFile);
      console.log('Video duration:', duration, 'seconds');
      
      // Upload the video with progress tracking
      console.log('Uploading to Blossom server...');
      const uploadedTags = await uploadVideoWithProgress(videoFile);
      console.log('Video uploaded successfully. Tags:', uploadedTags);
      
      const videoUrl = uploadedTags[0][1];
      // Hash and dimensions are available in uploadedTags if needed later
      
      setUploadedVideoData({
        url: videoUrl,
        tags: uploadedTags,
        duration
      });
      
      setVideoUploadProgress(100);
      setVideoUploadStatus('success');
      
      toast({
        title: 'Video uploaded!',
        description: 'Your video has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Video upload failed:', error);
      setVideoUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setVideoUploadProgress(0);
    }
  };

  const handleThumbnailUpload = async () => {
    if (!thumbnailFile || !user) return;
    
    try {
      setThumbnailUploadStatus('uploading');
      setThumbnailUploadProgress(0);
      
      console.log('Starting thumbnail upload:', thumbnailFile.name, 'Size:', (thumbnailFile.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Upload thumbnail with progress tracking
      const uploadedTags = await uploadThumbnailWithProgress(thumbnailFile);
      console.log('Thumbnail uploaded successfully. Tags:', uploadedTags);
      
      setUploadedThumbnailData({
        url: uploadedTags[0][1],
        tags: uploadedTags
      });
      
      setThumbnailUploadProgress(100);
      setThumbnailUploadStatus('success');
      
      toast({
        title: 'Thumbnail uploaded!',
        description: 'Your thumbnail has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      setThumbnailUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload thumbnail',
        variant: 'destructive',
      });
    } finally {
      setThumbnailUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload vlogs',
        variant: 'destructive',
      });
      return;
    }

    // Check if we have either uploaded video or URL
    const hasVideo = uploadedVideoData || videoUrl;
    if (!title || !hasVideo) {
      toast({
        title: 'Error',
        description: 'Please provide a title and upload/provide a video',
        variant: 'destructive',
      });
      return;
    }

    // Check if video needs to be uploaded first
    if (videoFile && !uploadedVideoData) {
      toast({
        title: 'Please upload video first',
        description: 'Click the Upload button next to the video file',
        variant: 'destructive',
      });
      return;
    }

    if (thumbnailFile && !uploadedThumbnailData) {
      toast({
        title: 'Please upload thumbnail first',
        description: 'Click the Upload button next to the thumbnail file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Publishing video event...');

      const finalVideoUrl = uploadedVideoData?.url || videoUrl;
      let finalThumbnailUrl = uploadedThumbnailData?.url || thumbnailUrl;
      const videoDuration = uploadedVideoData?.duration || 0;
      let videoHash = '';
      let videoMimeType = 'video/mp4';
      let videoDimensions = '';

      // Extract metadata from uploaded video tags
      if (uploadedVideoData) {
        const hashTag = uploadedVideoData.tags.find(tag => tag[0] === 'x');
        if (hashTag) videoHash = hashTag[1];
        
        const dimTag = uploadedVideoData.tags.find(tag => tag[0] === 'dim');
        if (dimTag) videoDimensions = dimTag[1];
        
        if (videoFile) {
          videoMimeType = videoFile.type || 'video/mp4';
        }
      }

      // Auto-generate thumbnail if needed and no thumbnail provided
      if (!finalThumbnailUrl && finalVideoUrl) {
        console.log('Auto-generating thumbnail from video...');
        try {
          const video = document.createElement('video');
          video.src = finalVideoUrl;
          video.crossOrigin = 'anonymous';
          await new Promise((resolve, _reject) => {
            video.onloadeddata = resolve;
            video.onerror = _reject;
            setTimeout(() => _reject(new Error('Video load timeout')), 10000);
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          await new Promise<void>((resolve, _reject) => {
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  console.log('Uploading auto-generated thumbnail...');
                  const thumbnailTags = await uploadFile(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
                  finalThumbnailUrl = thumbnailTags[0][1];
                  console.log('Auto-generated thumbnail uploaded:', finalThumbnailUrl);
                  resolve();
                } catch (err) {
                  console.error('Failed to upload auto-generated thumbnail:', err);
                  resolve(); // Continue without thumbnail
                }
              } else {
                resolve();
              }
            }, 'image/jpeg', 0.8);
          });
        } catch (err) {
          console.error('Failed to auto-generate thumbnail:', err);
          // Continue without thumbnail
        }
      }

      console.log('Creating event tags...');

      const tags: string[][] = [
        ['title', title],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
      ];

      if (videoDuration > 0) {
        tags.push(['duration', videoDuration.toString()]);
      }

      // Add alt tag for accessibility
      if (description) {
        tags.push(['alt', description.substring(0, 200)]); // First 200 chars as alt text
      }

      // Advanced NIP-71 features
      if (hasContentWarning && contentWarning.trim()) {
        tags.push(['content-warning', contentWarning.trim()]);
      }

      // Add participants
      participants.forEach(participant => {
        if (participant.pubkey.trim()) {
          if (participant.relay?.trim()) {
            tags.push(['p', participant.pubkey.trim(), participant.relay.trim()]);
          } else {
            tags.push(['p', participant.pubkey.trim()]);
          }
        }
      });

      // Add reference links
      referenceLinks.forEach(link => {
        if (link.trim()) {
          tags.push(['r', link.trim()]);
        }
      });

      // Add segments/chapters
      segments.forEach(segment => {
        if (segment.start && segment.end && segment.title) {
          if (segment.thumbnail?.trim()) {
            tags.push(['segment', segment.start, segment.end, segment.title, segment.thumbnail]);
          } else {
            tags.push(['segment', segment.start, segment.end, segment.title]);
          }
        }
      });

      const imetaTag = ['imeta'];
      if (videoDimensions) imetaTag.push(`dim ${videoDimensions}`);
      imetaTag.push(`url ${finalVideoUrl}`);
      if (videoHash) imetaTag.push(`x ${videoHash}`);
      imetaTag.push(`m ${videoMimeType}`);
      if (finalThumbnailUrl) imetaTag.push(`image ${finalThumbnailUrl}`);
      imetaTag.push('service blossom');
      
      tags.push(imetaTag);

      const hashtags = description.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach(tag => {
          tags.push(['t', tag.slice(1).toLowerCase()]);
        });
      }

      console.log('Publishing event with tags:', tags);
      publishEvent({
        kind: parseInt(videoType),
        content: description,
        tags,
      });

      toast({
        title: 'Success!',
        description: 'Your vlog has been published',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoUrl('');
      setThumbnailUrl('');
      setUploadedVideoData(null);
      setUploadedThumbnailData(null);
      setVideoUploadStatus('idle');
      setThumbnailUploadStatus('idle');
      
      // Reset advanced fields
      setContentWarning('');
      setHasContentWarning(false);
      setParticipants([]);
      setReferenceLinks(['']);
      setSegments([]);
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: 'Publish Failed',
        description: error instanceof Error ? error.message : 'Failed to publish vlog',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the creator dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Creator Dashboard</h1>
        <p className="text-muted-foreground">Upload and share your vlogs with the world</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                analytics?.totalVideos ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Published vlogs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                analytics?.totalLikes ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                analytics?.totalComments ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Community engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <Skeleton className="h-6 w-12" />
              ) : (
                analytics?.totalFollowers ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              People following you
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Upload New Vlog</CardTitle>
          <CardDescription className="text-muted-foreground">
            Share your video content on the Nostr network using Blossom servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter your vlog title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your vlog... (use #hashtags to categorize)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label>Video Type</Label>
              <RadioGroup value={videoType} onValueChange={(value) => setVideoType(value as '21' | '22')} disabled={isProcessing}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="21" id="normal" />
                  <Label htmlFor="normal">Normal Video (horizontal/long-form)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="22" id="short" />
                  <Label htmlFor="short">Short Video (vertical/stories/reels)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Video File *</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="video"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload video</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">MP4, WebM, MOV (MAX. 500MB)</p>
                    </div>
                    <input
                      id="video"
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoChange}
                      disabled={isProcessing}
                    />
                  </label>
                </div>
                {videoFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                        {videoUploadStatus === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : videoUploadStatus === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Video className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-xs">{videoFile.name}</span>
                        <span className="text-muted-foreground">
                          ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleVideoUpload}
                        disabled={videoUploadStatus === 'uploading' || videoUploadStatus === 'success' || !user}
                        variant={videoUploadStatus === 'success' ? 'secondary' : 'default'}
                      >
                        {videoUploadStatus === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : videoUploadStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Uploaded
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {videoUploadStatus === 'uploading' && videoUploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Uploading video...</span>
                          <span>{videoUploadProgress}%</span>
                        </div>
                        <Progress value={videoUploadProgress} className="h-2" />
                      </div>
                    )}
                    {uploadedVideoData && (
                      <div className="text-xs text-muted-foreground">
                        Duration: {uploadedVideoData.duration}s • URL: {uploadedVideoData.url.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                )}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or provide URL</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setUploadedVideoData(null); // Clear uploaded data when URL changes
                    }}
                    disabled={isProcessing || !!videoFile}
                    className="flex-1"
                  />
                  {videoUrl && !videoFile && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 self-center" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="thumbnail"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <Image className="w-6 h-6 mb-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Upload thumbnail</span>
                      </p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP (MAX. 10MB)</p>
                    </div>
                    <input
                      id="thumbnail"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      disabled={isProcessing}
                    />
                  </label>
                </div>
                {thumbnailFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                        {thumbnailUploadStatus === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : thumbnailUploadStatus === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate max-w-xs">{thumbnailFile.name}</span>
                        <span className="text-muted-foreground">
                          ({(thumbnailFile.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleThumbnailUpload}
                        disabled={thumbnailUploadStatus === 'uploading' || thumbnailUploadStatus === 'success' || !user}
                        variant={thumbnailUploadStatus === 'success' ? 'secondary' : 'default'}
                      >
                        {thumbnailUploadStatus === 'uploading' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : thumbnailUploadStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Uploaded
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {thumbnailUploadStatus === 'uploading' && thumbnailUploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Uploading thumbnail...</span>
                          <span>{thumbnailUploadProgress}%</span>
                        </div>
                        <Progress value={thumbnailUploadProgress} className="h-2" />
                      </div>
                    )}
                    {uploadedThumbnailData && (
                      <div className="text-xs text-muted-foreground">
                        URL: {uploadedThumbnailData.url.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                )}
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com/thumbnail.jpg (optional URL)"
                    value={thumbnailUrl}
                    onChange={(e) => {
                      setThumbnailUrl(e.target.value);
                      setUploadedThumbnailData(null); // Clear uploaded data when URL changes
                    }}
                    disabled={isProcessing || !!thumbnailFile}
                    className="flex-1"
                  />
                  {thumbnailUrl && !thumbnailFile && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 self-center" />
                  )}
                </div>
              </div>
            </div>

            {/* Advanced NIP-71 Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Advanced Options (NIP-71)</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                  {isAdvancedOpen ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>
              
              {isAdvancedOpen && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20 mt-4">
                  {/* Content Warning */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="content-warning" 
                        checked={hasContentWarning}
                        onCheckedChange={(checked) => setHasContentWarning(checked === true)}
                      />
                      <Label htmlFor="content-warning">Contains mature/NSFW content</Label>
                    </div>
                    {hasContentWarning && (
                      <Input
                        placeholder="Describe content warning (e.g., violence, nudity)"
                        value={contentWarning}
                        onChange={(e) => setContentWarning(e.target.value)}
                        disabled={isProcessing}
                      />
                    )}
                  </div>

                  {/* Participants */}
                  <div className="space-y-2">
                    <Label>Participants (People in the video)</Label>
                    <p className="text-sm text-muted-foreground">
                      Type @username to mention people you follow, or paste their npub/hex directly
                    </p>
                    {participants.map((participant, index) => (
                      <div key={index} className="flex space-x-2">
                        <MentionInput
                          placeholder="@username or paste npub/hex"
                          value={participant.pubkey}
                          onChange={(value) => {
                            const newParticipants = [...participants];
                            newParticipants[index].pubkey = value;
                            setParticipants(newParticipants);
                          }}
                          disabled={isProcessing}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Relay URL (optional)"
                          value={participant.relay || ''}
                          onChange={(e) => {
                            const newParticipants = [...participants];
                            newParticipants[index].relay = e.target.value;
                            setParticipants(newParticipants);
                          }}
                          disabled={isProcessing}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newParticipants = participants.filter((_, i) => i !== index);
                            setParticipants(newParticipants);
                          }}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setParticipants([...participants, { pubkey: '', relay: '' }])}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Participant
                    </Button>
                  </div>

                  {/* Reference Links */}
                  <div className="space-y-2">
                    <Label>Reference Links</Label>
                    {referenceLinks.map((link, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          placeholder="https://example.com/related-content"
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...referenceLinks];
                            newLinks[index] = e.target.value;
                            setReferenceLinks(newLinks);
                          }}
                          disabled={isProcessing}
                          className="flex-1"
                        />
                        {referenceLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newLinks = referenceLinks.filter((_, i) => i !== index);
                              setReferenceLinks(newLinks);
                            }}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setReferenceLinks([...referenceLinks, ''])}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Reference Link
                    </Button>
                  </div>

                  {/* Segments/Chapters */}
                  <div className="space-y-2">
                    <Label>Chapters/Segments (for longer videos)</Label>
                    {segments.map((segment, index) => (
                      <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <Input
                          placeholder="00:00:00"
                          value={segment.start}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index].start = e.target.value;
                            setSegments(newSegments);
                          }}
                          disabled={isProcessing}
                        />
                        <Input
                          placeholder="00:05:30"
                          value={segment.end}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index].end = e.target.value;
                            setSegments(newSegments);
                          }}
                          disabled={isProcessing}
                        />
                        <Input
                          placeholder="Chapter title"
                          value={segment.title}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index].title = e.target.value;
                            setSegments(newSegments);
                          }}
                          disabled={isProcessing}
                          className="md:col-span-2"
                        />
                        <Input
                          placeholder="Thumbnail URL (optional)"
                          value={segment.thumbnail || ''}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index].thumbnail = e.target.value;
                            setSegments(newSegments);
                          }}
                          disabled={isProcessing}
                          className="md:col-span-2"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newSegments = segments.filter((_, i) => i !== index);
                            setSegments(newSegments);
                          }}
                          disabled={isProcessing}
                          className="md:col-span-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSegments([...segments, { start: '', end: '', title: '', thumbnail: '' }])}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Chapter/Segment
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Show upload status summary */}
            {(uploadedVideoData || uploadedThumbnailData) && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Files uploaded successfully. Ready to publish your vlog!
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isProcessing || isPublishing || videoUploadStatus === 'uploading' || thumbnailUploadStatus === 'uploading'}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing to Nostr...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Publish Vlog to Nostr
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;