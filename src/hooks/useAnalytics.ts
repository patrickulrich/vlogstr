import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AnalyticsData {
  totalVideos: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
}

export function useAnalytics() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['analytics', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return null;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      
      // Get user's videos (kind 21 and 22)
      const videosQuery = nostr.query([
        {
          kinds: [21, 22],
          authors: [user.pubkey],
          limit: 1000,
        }
      ], { signal });

      // Get followers (people who have the user in their contact list)
      const followersQuery = nostr.query([
        {
          kinds: [3],
          '#p': [user.pubkey],
          limit: 1000,
        }
      ], { signal });

      // Wait for both queries to complete
      const [videos, followers] = await Promise.all([videosQuery, followersQuery]);

      // Get all event IDs from user's videos
      const videoIds = videos.map(v => v.id);

      let totalLikes = 0;
      let totalComments = 0;

      if (videoIds.length > 0) {
        // Get reactions (likes) for all videos
        const reactionsQuery = nostr.query([
          {
            kinds: [7], // NIP-25 reactions
            '#e': videoIds,
            limit: 1000,
          }
        ], { signal });

        // Get comments for all videos
        const commentsQuery = nostr.query([
          {
            kinds: [1, 1111], // Text notes and threaded comments
            '#e': videoIds,
            limit: 1000,
          }
        ], { signal });

        const [reactions, comments] = await Promise.all([reactionsQuery, commentsQuery]);

        // Count likes (reactions with "+" content)
        totalLikes = reactions.filter(r => r.content === '+').length;

        // Count comments (excluding user's own comments)
        totalComments = comments.filter(c => c.pubkey !== user.pubkey).length;
      }

      // Count unique followers
      const uniqueFollowers = new Set(followers.map(f => f.pubkey));
      const totalFollowers = uniqueFollowers.size;

      const analytics: AnalyticsData = {
        totalVideos: videos.length,
        totalLikes,
        totalComments,
        totalFollowers,
      };

      return analytics;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}