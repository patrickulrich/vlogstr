import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import NotFound from './NotFound';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  let decoded: { type: string } | null = null;
  let shouldRenderNotFound = false;

  if (!identifier) {
    shouldRenderNotFound = true;
  } else {
    try {
      decoded = nip19.decode(identifier);
    } catch {
      shouldRenderNotFound = true;
    }
  }

  // Always call hooks before any early returns
  const type = decoded?.type || 'content';
  useSEO({
    title: `${type === 'npub' || type === 'nprofile' ? 'Profile' : 
           type === 'note' ? 'Note' : 
           type === 'nevent' ? 'Event' : 
           type === 'naddr' ? 'Content' : 'View'} - Vlogstr`,
    description: `View ${type === 'npub' || type === 'nprofile' ? 'user profile' : 
                      type === 'note' ? 'note' : 
                      type === 'nevent' ? 'event' : 
                      type === 'naddr' ? 'addressable content' : 'content'} on the Nostr network via Vlogstr.`,
    keywords: [
      'nostr', 'vlogstr', type, 'decentralized', 'blockchain',
      'social network', 'protocol', 'nip19'
    ],
  });

  if (shouldRenderNotFound || !decoded) {
    return <NotFound />;
  }

  switch (type) {
    case 'npub':
    case 'nprofile':
      // AI agent should implement profile view here
      return <div>Profile placeholder</div>;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr':
      // AI agent should implement addressable event view here
      return <div>Addressable event placeholder</div>;

    default:
      return <NotFound />;
  }
} 