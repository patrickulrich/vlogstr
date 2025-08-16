import { useParams } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthor } from '@/hooks/useAuthor';
import { useReactions } from '@/hooks/useReactions';
import { useSEO } from '@/hooks/useSEO';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentModal } from '@/components/CommentModal';
import { ShareModal } from '@/components/ShareModal';
import { ZapDialog } from '@/components/ZapDialog';
import { StructuredData } from '@/components/StructuredData';
import { 
  MessageCircle, 
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Zap
} from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

interface VideoPlayerProps {
  event: NostrEvent;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  onComment: () => void;
  onShare: () => void;
}

function VideoPlayer({ event, isActive, isMuted, onMuteToggle, onComment, onShare }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const { likeCount, userLiked, toggleLike, isToggling } = useReactions(event.id);
  
  const title = event.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Video';
  const imetaTags = event.tags.filter(([name]) => name === 'imeta');
  const videoUrl = imetaTags[0]?.find((item) => item.startsWith('url'))?.split(' ')[1];
  const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];
  
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0; // Reset to beginning
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Additional effect to handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => {
        if (isActive) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => {
                setIsPlaying(false);
              });
          }
        }
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleCanPlay = () => {
        if (isActive) {
          video.play().catch(() => setIsPlaying(false));
        }
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [isActive]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnail}
          loop
          muted={isMuted}
          playsInline
          autoPlay={isActive}
          preload="metadata"
          className="max-w-full max-h-full object-contain cursor-pointer"
          onClick={togglePlayPause}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-white">
          <Play className="h-16 w-16 mb-4" />
          <p>Video unavailable</p>
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && videoUrl && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Video info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-between">
          <div className="flex-1 mr-4">
            <Link to={`/user/${event.pubkey}`} className="flex items-center mb-3">
              <Avatar className="h-10 w-10 mr-3 ring-2 ring-white">
                {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
                <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-white font-semibold">{displayName}</span>
            </Link>
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            {event.content && (
              <p className="text-white/90 text-sm line-clamp-2">{event.content}</p>
            )}
            <p className="text-white/60 text-xs mt-2">
              {formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center space-y-4">
            <ZapDialog target={event}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Zap className="h-6 w-6" />
              </Button>
            </ZapDialog>
            
            <Button
              variant="ghost"
              size="icon"
              className={`hover:bg-white/20 ${userLiked ? 'text-red-500' : 'text-white'}`}
              onClick={() => toggleLike()}
              disabled={isToggling}
            >
              <Heart className={`h-6 w-6 ${userLiked ? 'fill-current' : ''}`} />
            </Button>
            {likeCount > 0 && (
              <span className="text-white text-xs font-semibold">{likeCount}</span>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onComment}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onShare}
            >
              <Share2 className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onMuteToggle}
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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


const VideoPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { settings } = useUserSettings();
  const [isMuted, setIsMuted] = useState(settings.muteVideosByDefault);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Update mute state when settings change
  useEffect(() => {
    setIsMuted(settings.muteVideosByDefault);
  }, [settings.muteVideosByDefault]);
  
  const { data: event, isLoading, error } = useVideoEvent(eventId || '');

  // Set up SEO for the video
  const title = event?.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Video';
  const imetaTags = event?.tags.filter(([name]) => name === 'imeta') || [];
  const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];

  const { generateVideoSchema } = useSEO({
    title: `${title} - Watch on Vlogstr`,
    description: event?.content || `Watch "${title}" on Vlogstr, a decentralized video platform.`,
    keywords: ['vlogstr', 'nostr', 'decentralized video', 'video'],
    type: 'video.other',
    image: thumbnail || `${window.location.origin}/og-image.png`,
  });

  const structuredData: object[] = [];
  if (event) {
    structuredData.push(generateVideoSchema({
      title,
      description: event.content,
      uploadDate: new Date(event.created_at * 1000).toISOString(),
      thumbnailUrl: thumbnail,
      authorName: 'Vlogstr Creator',
    }));
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <p className="text-gray-300 mb-6">
            The video you're looking for doesn't exist or couldn't be loaded.
          </p>
        </div>
      </div>
    );
  }

  // Use the exact same layout as FeedPage/Discover but with just one video
  return (
    <div className="h-screen bg-black overflow-hidden">
      {structuredData.length > 0 && <StructuredData data={structuredData} />}
      
      <VideoPlayer
        event={event}
        isActive={true} // Always active since it's the only video
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onComment={() => setShowCommentModal(true)}
        onShare={() => setShowShareModal(true)}
      />

      {/* Modals */}
      <CommentModal 
        open={showCommentModal} 
        onOpenChange={setShowCommentModal} 
        event={event} 
      />
      <ShareModal 
        open={showShareModal} 
        onOpenChange={setShowShareModal} 
        event={event} 
      />
    </div>
  );
};

export default VideoPage;