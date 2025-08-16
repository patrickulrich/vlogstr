import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useReactions } from '@/hooks/useReactions';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Heart, MessageCircle, Share2, Zap, VolumeOff, Volume2, UserPlus } from 'lucide-react';
import { ZapDialog } from '@/components/ZapDialog';
import { StructuredData } from '@/components/StructuredData';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { CommentsSection } from '@/components/comments/CommentsSection';

function useVideoEvent(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['video-event', eventId],
    queryFn: async (c) => {
      if (!eventId) return null;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        { 
          kinds: [21, 22],
          ids: [eventId]
        }
      ], { signal });
      
      return events[0] || null;
    },
    enabled: !!eventId,
  });
}

function VideoPlayer({ event, isMuted, onMuteToggle }: { 
  event: NostrEvent; 
  isMuted: boolean;
  onMuteToggle: () => void;
}) {
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');
  const videoUrl = imetaTags[0]?.find((item) => item.startsWith('url'))?.split(' ')[1];
  const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];
  
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Video not found</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        src={videoUrl}
        poster={thumbnail}
        controls
        muted={isMuted}
        className="w-full h-full object-contain"
        autoPlay
      />
      
      {/* Mute button overlay */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onMuteToggle}
      >
        {isMuted ? <VolumeOff className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function VideoActions({ event }: { event: NostrEvent }) {
  const { likeCount, userLiked, toggleLike, isToggling } = useReactions(event.id);
  
  const handleShare = () => {
    const url = `${window.location.origin}/video/${event.id}`;
    navigator.clipboard.writeText(url);
    // TODO: Add toast notification
  };

  return (
    <div className="flex items-center gap-4">
      <ZapDialog target={event}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <Zap className="h-5 w-5" />
          <span className="text-sm">Zap</span>
        </Button>
      </ZapDialog>
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => toggleLike()}
        disabled={isToggling}
      >
        <Heart className={`h-5 w-5 ${userLiked ? 'fill-red-500 text-red-500' : ''}`} />
        <span className="text-sm">{likeCount > 0 ? likeCount : 'Like'}</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm">Comment</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
        <span className="text-sm">Share</span>
      </Button>
    </div>
  );
}

const VideoPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [isMuted, setIsMuted] = useState(true); // Default muted, TODO: Get from settings
  
  const { data: event, isLoading, error } = useVideoEvent(eventId || '');
  const author = useAuthor(event?.pubkey || '');
  
  const metadata = author.data?.metadata;
  const title = event?.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Video';
  const displayName = metadata?.display_name || metadata?.name || (event ? genUserName(event.pubkey) : '');
  const profileImage = metadata?.picture;
  const duration = event?.tags.find(([name]) => name === 'duration')?.[1];
  const imetaTags = event?.tags.filter(([name]) => name === 'imeta') || [];
  const videoUrl = imetaTags[0]?.find((item) => item.startsWith('url'))?.split(' ')[1];
  const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];

  const { generateVideoSchema, generateBreadcrumbSchema } = useSEO({
    title: `${title} - Watch on Vlogstr`,
    description: event?.content || `Watch "${title}" on Vlogstr, a decentralized video platform. Created by ${displayName}.`,
    keywords: [
      'vlogstr', 'nostr', 'decentralized video', 'video', displayName, 
      'creator', 'blockchain video', 'censorship resistant'
    ],
    type: 'video.other',
    image: thumbnail || `${window.location.origin}/og-image.png`,
    publishedTime: event ? new Date(event.created_at * 1000).toISOString() : undefined,
    author: displayName,
    videoData: {
      duration: duration,
      uploadDate: event ? new Date(event.created_at * 1000).toISOString() : undefined,
      thumbnailUrl: thumbnail,
      embedUrl: videoUrl,
    },
  });

  const structuredData: object[] = [];
  
  if (event) {
    structuredData.push(generateVideoSchema({
      title,
      description: event.content,
      uploadDate: new Date(event.created_at * 1000).toISOString(),
      duration: duration,
      thumbnailUrl: thumbnail,
      embedUrl: videoUrl,
      authorName: displayName,
    }));

    structuredData.push(generateBreadcrumbSchema([
      { name: 'Home', url: window.location.origin },
      { name: 'Videos', url: `${window.location.origin}/discover` },
      { name: title, url: window.location.href },
    ]));
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <Card>
          <CardContent className="py-12">
            <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The video you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {structuredData.length > 0 && <StructuredData data={structuredData} />}
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Video player */}
      <VideoPlayer 
        event={event} 
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
      />

      {/* Video info */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
                <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}
                  {duration && ` • ${Math.floor(parseInt(duration) / 60)}:${(parseInt(duration) % 60).toString().padStart(2, '0')}`}
                </p>
              </div>
            </div>
            {user?.pubkey !== event.pubkey && (
              <Button variant="outline" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <VideoActions event={event} />

        {/* Description */}
        {event.content && (
          <Card>
            <CardContent className="pt-4">
              <p className="whitespace-pre-wrap">{event.content}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <CommentsSection root={event} />
      </div>
    </div>
  );
};

export default VideoPage;