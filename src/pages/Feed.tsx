import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Heart, MessageCircle, Share2, Video as VideoIcon } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import type { NostrEvent } from '@nostrify/nostrify';
import { RelaySelector } from '@/components/RelaySelector';

function VlogCard({ event }: { event: NostrEvent }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Video';
  const duration = event.tags.find(([name]) => name === 'duration')?.[1];
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');
  
  const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];
  // const videoUrl = imetaTags[0]?.find((item) => item.startsWith('url'))?.split(' ')[1];
  
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;
  
  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-muted">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
              <div className="rounded-full bg-white/90 p-4 hover:bg-white transition-colors">
                <Play className="h-8 w-8 text-black fill-black" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-2">{title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <span>{displayName}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {event.content && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{event.content}</p>
        </CardContent>
      )}
      
      <CardFooter className="pt-0">
        <div className="flex items-center space-x-4 text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Heart className="h-4 w-4 mr-1" />
            <span className="text-xs">Like</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Comment</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Share2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function VlogCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video" />
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5 mt-1" />
      </CardContent>
    </Card>
  );
}

function useVlogs() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['vlogs'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        { 
          kinds: [21, 22],
          limit: 50 
        }
      ], { signal });
      
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });
}

const Feed = () => {
  useSeoMeta({
    title: 'Vlog Feed - Vlogstr',
    description: 'Discover and watch vlogs from the Nostr network',
  });

  const { data: vlogs, isLoading, error } = useVlogs();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Vlog Feed</h1>
        <p className="text-muted-foreground">Discover and watch vlogs from creators around the world</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <VlogCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <p className="text-muted-foreground mb-4">Failed to load vlogs. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : vlogs && vlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vlogs.map((vlog) => (
            <VlogCard key={vlog.id} event={vlog} />
          ))}
        </div>
      ) : (
        <div className="col-span-full">
          <Card className="border-dashed">
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <p className="text-muted-foreground">
                  No vlogs found. Try another relay?
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Feed;