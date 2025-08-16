import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { Send, MessageCircle } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NostrEvent;
}

function CommentItem({ comment }: { comment: NostrEvent }) {
  const author = useAuthor(comment.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(comment.pubkey);
  const profileImage = metadata?.picture;

  return (
    <div className="flex space-x-3 py-3">
      <Avatar className="h-8 w-8">
        {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
        <AvatarFallback className="text-xs">{displayName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true })}
          </p>
        </div>
        <p className="text-sm text-foreground">{comment.content}</p>
      </div>
    </div>
  );
}

function useComments(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['comments', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [1, 1111],
          '#e': [eventId],
          limit: 100,
        }
      ], { signal });
      
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    enabled: !!eventId,
  });
}

export function CommentModal({ open, onOpenChange, event }: CommentModalProps) {
  const { user, metadata } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const { data: comments, isLoading } = useComments(event.id);
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const userDisplayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const userProfileImage = metadata?.picture;

  // Mutation for posting comments with optimistic updates
  const postComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('User not logged in');
      
      publishEvent({
        kind: 1111,
        content: content.trim(),
        tags: [
          ['e', event.id, '', 'reply'],
          ['p', event.pubkey],
        ],
      });
    },
    onMutate: async (content: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['comments', event.id] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<NostrEvent[]>(['comments', event.id]);

      // Optimistically update to the new value
      if (user) {
        const optimisticComment: NostrEvent = {
          id: `temp-${Date.now()}`,
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000),
          kind: 1111,
          content: content.trim(),
          tags: [
            ['e', event.id, '', 'reply'],
            ['p', event.pubkey],
          ],
          sig: '',
        };

        queryClient.setQueryData<NostrEvent[]>(['comments', event.id], (old) => {
          if (!old) return [optimisticComment];
          return [...old, optimisticComment];
        });
      }

      // Return a context object with the snapshotted value
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['comments', event.id], context?.previousComments);
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['comments', event.id] });
      }, 1000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim()) return;

    postComment.mutate(commentText);
    setCommentText('');
  };

  const videoTitle = event.tags.find(([name]) => name === 'title')?.[1] || 'Video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{videoTitle}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
            </div>
          )}
        </ScrollArea>

        {user ? (
          <form onSubmit={handleSubmit} className="flex-shrink-0 pt-4 border-t">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {userProfileImage && <AvatarImage src={userProfileImage} alt={userDisplayName} />}
                <AvatarFallback className="text-xs">{userDisplayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {commentText.length}/500
                  </span>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!commentText.trim() || postComment.isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {postComment.isPending ? 'Sending...' : 'Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex-shrink-0 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Log in to join the conversation
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}