import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export function useFollowerCount(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['follower-count', pubkey],
    queryFn: async (c) => {
      if (!pubkey) return 0;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Query for kind 3 (contact list) events that include this pubkey in their p tags
      // This represents users who follow the target pubkey
      const events = await nostr.query([
        {
          kinds: [3],
          '#p': [pubkey],
          limit: 1000 // Get a reasonable sample to count followers
        }
      ], { signal });
      
      // Count unique followers (unique pubkeys that have this user in their contact list)
      const uniqueFollowers = new Set(events.map(event => event.pubkey));
      
      return uniqueFollowers.size;
    },
    enabled: !!pubkey,
    // Cache for 5 minutes since follower counts don't change frequently
    staleTime: 5 * 60 * 1000,
  });
}