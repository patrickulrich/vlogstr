import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useComments } from '@/hooks/useComments';
import { usePostComment } from '@/hooks/usePostComment';
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


export function CommentModal({ open, onOpenChange, event }: CommentModalProps) {
  const { user, metadata } = useCurrentUser();
  const { data: commentsData, isLoading } = useComments(event);
  const { mutate: postComment, isPending } = usePostComment();
  const [commentText, setCommentText] = useState('');

  const userDisplayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const userProfileImage = metadata?.picture;

  // Get top-level comments from the NIP-22 compliant hook
  const comments = commentsData?.topLevelComments || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim()) return;

    postComment(
      { content: commentText.trim(), root: event },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
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
          <DialogDescription className="text-sm text-muted-foreground truncate">
            {videoTitle}
          </DialogDescription>
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
                    disabled={!commentText.trim() || isPending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isPending ? 'Sending...' : 'Comment'}
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