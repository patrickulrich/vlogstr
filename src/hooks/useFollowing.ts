import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

interface FollowingUser {
  pubkey: string;
  displayName: string;
  name?: string;
  picture?: string;
}

export function useFollowing() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['following', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Get user's contact list (kind 3)
      const contactEvents = await nostr.query([
        {
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        }
      ], { signal });

      if (contactEvents.length === 0) return [];

      // Get the latest contact list
      const latestContacts = contactEvents.sort((a, b) => b.created_at - a.created_at)[0];
      
      // Extract pubkeys from p tags
      const followingPubkeys = latestContacts.tags
        .filter(([tagName]) => tagName === 'p')
        .map(([, pubkey]) => pubkey);

      if (followingPubkeys.length === 0) return [];

      // Fetch metadata for all following users
      const metadataEvents = await nostr.query([
        {
          kinds: [0],
          authors: followingPubkeys,
          limit: followingPubkeys.length,
        }
      ], { signal });

      // Create a map of pubkey to latest metadata
      const metadataMap = new Map<string, NostrEvent>();
      metadataEvents.forEach(event => {
        const existing = metadataMap.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          metadataMap.set(event.pubkey, event);
        }
      });

      // Build the following list with display names
      const following: FollowingUser[] = followingPubkeys.map(pubkey => {
        const metadataEvent = metadataMap.get(pubkey);
        let metadata;
        
        try {
          metadata = metadataEvent ? JSON.parse(metadataEvent.content) : {};
        } catch {
          metadata = {};
        }

        const displayName = metadata.display_name || metadata.name || pubkey.slice(0, 8) + '...';
        
        return {
          pubkey,
          displayName,
          name: metadata.name,
          picture: metadata.picture,
        };
      });

      // Sort by display name
      return following.sort((a, b) => a.displayName.localeCompare(b.displayName));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}