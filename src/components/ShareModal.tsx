import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useFollowing } from '@/hooks/useFollowing';
import { Share2, Copy, Check, MessageCircle, Send, Link2, FileVideo, Hash, ArrowLeft, Users, Search } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NostrEvent;
}

type ShareMode = 'main' | 'nostr' | 'dm';

export function ShareModal({ open, onOpenChange, event }: ShareModalProps) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const { data: following } = useFollowing();
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('main');
  const [nostrText, setNostrText] = useState('');
  const [dmRecipient, setDmRecipient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  const videoUrl = `${window.location.origin}/video/${event.id}`;
  const videoTitle = event.tags.find(([name]) => name === 'title')?.[1] || 'Check out this video';
  
  // Get video MP4 URL from imeta tags
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');
  const videoMp4Url = imetaTags[0]?.find((item) => item.startsWith('url'))?.split(' ')[1] || '';
  
  // Generate NIP-19 identifier for the video
  const videoNip19 = useMemo(() => {
    try {
      // For video events, use nevent format
      return 'nostr:' + nip19.neventEncode({
        id: event.id,
        author: event.pubkey,
        kind: event.kind,
      });
    } catch {
      return '';
    }
  }, [event]);
  
  // Filter following list based on search
  const filteredFollowing = useMemo(() => {
    if (!following || !searchQuery) return following || [];
    return following.filter(user => 
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [following, searchQuery]);
  
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
  
  const handleInsertLink = (type: 'vlogstr' | 'mp4' | 'nip19') => {
    let textToInsert = '';
    switch (type) {
      case 'vlogstr':
        textToInsert = videoUrl;
        break;
      case 'mp4':
        textToInsert = videoMp4Url;
        break;
      case 'nip19':
        textToInsert = videoNip19;
        break;
    }
    
    if (textToInsert) {
      setNostrText(prev => prev + (prev ? ' ' : '') + textToInsert);
    }
  };
  
  const handleShareToNostr = () => {
    if (!user || !nostrText.trim()) return;
    
    publishEvent({
      kind: 1,
      content: nostrText.trim(),
      tags: [],
    });
    
    toast({
      title: 'Posted!',
      description: 'Your note has been published to Nostr',
    });
    
    // Reset and close
    setNostrText('');
    setShareMode('main');
    onOpenChange(false);
  };
  
  const handleSendDM = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to send direct messages',
        variant: 'destructive',
      });
      return;
    }
    
    const recipients = [...selectedRecipients];
    if (dmRecipient.trim()) {
      // Parse npub or hex pubkey
      try {
        let pubkey = dmRecipient.trim();
        if (pubkey.startsWith('npub1')) {
          const decoded = nip19.decode(pubkey);
          if (decoded.type === 'npub') {
            pubkey = decoded.data;
          }
        }
        recipients.push(pubkey);
      } catch {
        toast({
          title: 'Invalid recipient',
          description: 'Please enter a valid npub or select from your following list',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (recipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please add at least one recipient',
        variant: 'destructive',
      });
      return;
    }
    
    // For now, we'll use NIP-04 since it's simpler and still supported
    // In production, you'd want to use NIP-17 with proper encryption
    for (const recipientPubkey of recipients) {
      try {
        if (!user.signer.nip44) {
          throw new Error('Your signer does not support encrypted messages');
        }
        
        const message = `Check out this video on Vlogstr: ${videoUrl}`;
        const encrypted = await user.signer.nip44.encrypt(recipientPubkey, message);
        
        publishEvent({
          kind: 4,
          content: encrypted,
          tags: [['p', recipientPubkey]],
        });
      } catch (error) {
        console.error('Failed to send DM:', error);
        toast({
          title: 'Failed to send',
          description: 'Could not send message to some recipients',
          variant: 'destructive',
        });
      }
    }
    
    toast({
      title: 'Messages sent!',
      description: `Sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
    });
    
    // Reset and close
    setDmRecipient('');
    setSelectedRecipients([]);
    setSearchQuery('');
    setShareMode('main');
    onOpenChange(false);
  };
  
  const toggleRecipient = (pubkey: string) => {
    setSelectedRecipients(prev => 
      prev.includes(pubkey) 
        ? prev.filter(p => p !== pubkey)
        : [...prev, pubkey]
    );
  };

  const handleResetModal = () => {
    setShareMode('main');
    setNostrText('');
    setDmRecipient('');
    setSelectedRecipients([]);
    setSearchQuery('');
  };
  
  const handleCloseModal = (open: boolean) => {
    if (!open) {
      handleResetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {shareMode !== 'main' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareMode('main')}
                className="mr-2 p-1 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Share2 className="h-5 w-5" />
            {shareMode === 'main' && 'Share Video'}
            {shareMode === 'nostr' && 'Share to Nostr'}
            {shareMode === 'dm' && 'Send via DM'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {shareMode === 'main' && (
            <>
              {/* Video Preview */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <FileVideo className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{videoTitle}</p>
                      <p className="text-sm text-muted-foreground">Vlogstr Video</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Choose how to share</label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="justify-start gap-3 h-12"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-blue-500" />}
                    <div className="text-left">
                      <p className="font-medium">{copied ? 'Copied!' : 'Copy to clipboard'}</p>
                      <p className="text-xs text-muted-foreground">Copy link to share anywhere</p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setShareMode('nostr')}
                    variant="outline"
                    className="justify-start gap-3 h-12"
                    disabled={!user}
                  >
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    <div className="text-left">
                      <p className="font-medium">Share to Nostr</p>
                      <p className="text-xs text-muted-foreground">
                        {user ? 'Post about this video' : 'Login required'}
                      </p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setShareMode('dm')}
                    variant="outline"
                    className="justify-start gap-3 h-12"
                    disabled={!user}
                  >
                    <Send className="h-5 w-5 text-pink-500" />
                    <div className="text-left">
                      <p className="font-medium">Share via DM</p>
                      <p className="text-xs text-muted-foreground">
                        {user ? 'Send privately to someone' : 'Login required'}
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {shareMode === 'nostr' && (
            <>
              <div className="space-y-3">
                <Label htmlFor="nostr-text">Compose your note</Label>
                <Textarea
                  id="nostr-text"
                  value={nostrText}
                  onChange={(e) => setNostrText(e.target.value)}
                  placeholder="Share your thoughts about this video..."
                  className="min-h-[120px] resize-none"
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertLink('vlogstr')}
                    className="gap-1"
                  >
                    <Link2 className="h-3 w-3" />
                    Vlogstr Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertLink('mp4')}
                    className="gap-1"
                    disabled={!videoMp4Url}
                  >
                    <FileVideo className="h-3 w-3" />
                    MP4 URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsertLink('nip19')}
                    className="gap-1"
                    disabled={!videoNip19}
                  >
                    <Hash className="h-3 w-3" />
                    Nostr Event
                  </Button>
                </div>
                
                <Button
                  onClick={handleShareToNostr}
                  disabled={!nostrText.trim()}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Post to Nostr
                </Button>
              </div>
            </>
          )}
          
          {shareMode === 'dm' && (
            <>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="dm-recipient">Send to npub or hex pubkey</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="dm-recipient"
                      value={dmRecipient}
                      onChange={(e) => setDmRecipient(e.target.value)}
                      placeholder="npub1... or hex pubkey"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                {following && following.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <Label>Or select from following</Label>
                    </div>
                    
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search following..."
                        className="pl-9"
                      />
                    </div>
                    
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-1">
                        {filteredFollowing?.map((user) => (
                          <Button
                            key={user.pubkey}
                            variant={selectedRecipients.includes(user.pubkey) ? 'default' : 'ghost'}
                            className="w-full justify-start gap-2 h-auto py-2"
                            onClick={() => toggleRecipient(user.pubkey)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.picture} />
                              <AvatarFallback className="text-xs">
                                {user.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{user.displayName}</span>
                            {selectedRecipients.includes(user.pubkey) && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {selectedRecipients.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedRecipients.length} recipient{selectedRecipients.length > 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}
                
                <Button
                  onClick={handleSendDM}
                  disabled={!dmRecipient.trim() && selectedRecipients.length === 0}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}