import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import type { NostrEvent } from '@nostrify/nostrify';

export function useReactions(eventId: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  // Query reactions for this event
  const { data: reactions, isLoading } = useQuery({
    queryKey: ['reactions', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [7], // NIP-25 reactions
          '#e': [eventId],
          limit: 500,
        }
      ], { signal });
      
      return events;
    },
    enabled: !!eventId,
  });

  // Process reactions
  const likeReactions = reactions?.filter(r => r.content === '+' || r.content === '❤️' || r.content === '🤙') || [];
  const userLiked = likeReactions.some(r => r.pubkey === user?.pubkey);
  const likeCount = likeReactions.length;

  // Mutation to toggle like
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not logged in');
      
      if (userLiked) {
        // Unlike: publish a deletion event
        const userReaction = likeReactions.find(r => r.pubkey === user.pubkey);
        if (userReaction) {
          publishEvent({
            kind: 5, // Deletion event
            content: 'Unliked',
            tags: [
              ['e', userReaction.id],
            ],
          });
        }
      } else {
        // Like: publish a reaction
        publishEvent({
          kind: 7, // NIP-25 reaction
          content: '+',
          tags: [
            ['e', eventId],
            ['k', '21'], // or '22' for short videos, but we'll use generic approach
          ],
        });
      }
    },
    onSuccess: () => {
      // Optimistically update the cache
      queryClient.setQueryData(['reactions', eventId], (old: NostrEvent[] | undefined) => {
        if (!old) return [];
        
        if (userLiked) {
          // Remove user's like
          return old.filter(r => !(r.pubkey === user?.pubkey && (r.content === '+' || r.content === '❤️' || r.content === '🤙')));
        } else {
          // Add user's like
          const newReaction = {
            id: `temp-${Date.now()}`,
            pubkey: user!.pubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 7,
            content: '+',
            tags: [['e', eventId]],
            sig: '',
          };
          return [...old, newReaction];
        }
      });
      
      // Refetch after a delay to get the real data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['reactions', eventId] });
      }, 1000);
    },
  });

  return {
    likeCount,
    userLiked,
    isLoading,
    toggleLike: toggleLike.mutate,
    isToggling: toggleLike.isPending,
  };
}