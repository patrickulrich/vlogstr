import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Share2, Copy, Check, Twitter, Facebook, Link, QrCode } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NostrEvent;
}

export function ShareModal({ open, onOpenChange, event }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const videoUrl = `${window.location.origin}/video/${event.id}`;
  const videoTitle = event.tags.find(([name]) => name === 'title')?.[1] || 'Check out this video';
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Video link has been copied to your clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${videoTitle}\n\n${videoUrl} #Vlogstr #Nostr`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(videoUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      onClick: handleCopyLink,
      description: 'Copy link to clipboard',
      color: 'text-blue-500',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: handleTwitterShare,
      description: 'Share on Twitter',
      color: 'text-blue-400',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: handleFacebookShare,
      description: 'Share on Facebook',
      color: 'text-blue-600',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Link className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{videoTitle}</p>
                  <p className="text-sm text-muted-foreground">Vlogstr Video</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Link Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex space-x-2">
              <Input 
                value={videoUrl} 
                readOnly 
                className="flex-1 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="gap-2 min-w-[80px]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share to</label>
            <div className="grid grid-cols-1 gap-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.name}
                    onClick={option.onClick}
                    variant="outline"
                    className="justify-start gap-3 h-12"
                  >
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <div className="text-left">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="space-y-3">
            <label className="text-sm font-medium">QR Code</label>
            <Card>
              <CardContent className="p-6 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  QR code generation coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}