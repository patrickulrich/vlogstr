import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

export function useUserVideos() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const { toast } = useToast();

  const { data: videos, isLoading, refetch } = useQuery({
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

  const deleteVideo = async (event: NostrEvent) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete videos',
        variant: 'destructive',
      });
      return;
    }

    try {
      // NIP-09: Event Deletion - publish a kind 5 event that references the video to delete
      publishEvent({
        kind: 5, // Deletion event
        content: 'Video deleted by creator',
        tags: [
          ['e', event.id], // Reference to the event being deleted
          ['k', event.kind.toString()], // Kind of event being deleted
        ],
      });

      toast({
        title: 'Video Deleted',
        description: 'Your video has been marked for deletion. It may take time to propagate to all relays.',
      });

      // Refetch videos to update the list
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete video',
        variant: 'destructive',
      });
    }
  };

  return {
    videos: videos || [],
    isLoading,
    deleteVideo,
    refetch,
  };
}