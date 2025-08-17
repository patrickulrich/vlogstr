import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function useCreatorAnalytics() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  // Get user's videos
  const { data: userVideos } = useQuery({
    queryKey: ['user-videos', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        {
          kinds: [21, 22], // Video events
          authors: [user.pubkey],
          limit: 500, // Get all user's videos
        }
      ], { signal });
      
      // Sort by creation time, newest first
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!user,
  });

  // Get individual video analytics
  const { data: videoAnalytics } = useQuery({
    queryKey: ['video-analytics', user?.pubkey, userVideos],
    queryFn: async (c) => {
      if (!user || !userVideos || userVideos.length === 0) return [];
      
      const videoIds = userVideos.map(v => v.id);
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Get all reactions and comments for these videos
      const [reactions, comments] = await Promise.all([
        nostr.query([
          {
            kinds: [7], // NIP-25 reactions
            '#e': videoIds,
            limit: 2000,
          }
        ], { signal }),
        nostr.query([
          {
            kinds: [1, 1111], // Regular notes and NIP-22 comments
            '#e': videoIds,
            limit: 2000,
          }
        ], { signal })
      ]);

      // Calculate individual video analytics
      return userVideos.map(video => {
        const videoReactions = reactions.filter(r => 
          r.tags.some(tag => tag[0] === 'e' && tag[1] === video.id) &&
          (r.content === '+' || r.content === '❤️' || r.content === '🤙')
        );
        const videoComments = comments.filter(c => 
          c.tags.some(tag => tag[0] === 'e' && tag[1] === video.id)
        );

        const titleTag = video.tags.find(tag => tag[0] === 'title');
        const title = titleTag?.[1] || 'Untitled Video';
        
        return {
          video,
          title,
          likes: videoReactions.length,
          comments: videoComments.length,
        };
      });
    },
    enabled: !!user && !!userVideos && userVideos.length > 0,
  });

  // Get total likes (reactions) for user's videos
  const { data: totalLikes } = useQuery({
    queryKey: ['user-total-likes', user?.pubkey, userVideos],
    queryFn: async (c) => {
      if (!user || !userVideos || userVideos.length === 0) return 0;
      
      const videoIds = userVideos.map(v => v.id);
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const reactions = await nostr.query([
        {
          kinds: [7], // NIP-25 reactions
          '#e': videoIds,
          limit: 1000,
        }
      ], { signal });
      
      // Count unique likes (reactions with + content)
      const likes = reactions.filter(r => r.content === '+' || r.content === '❤️' || r.content === '🤙');
      return likes.length;
    },
    enabled: !!user && !!userVideos && userVideos.length > 0,
  });

  // Get total comments for user's videos
  const { data: totalComments } = useQuery({
    queryKey: ['user-total-comments', user?.pubkey, userVideos],
    queryFn: async (c) => {
      if (!user || !userVideos || userVideos.length === 0) return 0;
      
      const videoIds = userVideos.map(v => v.id);
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const comments = await nostr.query([
        {
          kinds: [1, 1111], // Regular notes and NIP-22 comments
          '#e': videoIds,
          limit: 1000,
        }
      ], { signal });
      
      return comments.length;
    },
    enabled: !!user && !!userVideos && userVideos.length > 0,
  });

  // Get follower count (people who follow this user)
  const { data: followerCount } = useQuery({
    queryKey: ['user-followers', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return 0;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Find contact lists that include this user
      const contactLists = await nostr.query([
        {
          kinds: [3], // Contact lists
          '#p': [user.pubkey],
          limit: 500,
        }
      ], { signal });
      
      // Count unique followers (unique pubkeys)
      const uniqueFollowers = new Set(contactLists.map(list => list.pubkey));
      return uniqueFollowers.size;
    },
    enabled: !!user,
  });

  return {
    totalVideos: userVideos?.length || 0,
    totalLikes: totalLikes || 0,
    totalComments: totalComments || 0,
    followerCount: followerCount || 0,
    videoAnalytics: videoAnalytics || [],
    isLoading: !userVideos || totalLikes === undefined || totalComments === undefined || followerCount === undefined,
  };
}