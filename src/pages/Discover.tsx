import { useEffect, useRef, useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthor } from '@/hooks/useAuthor';
import { useReactions } from '@/hooks/useReactions';
import { useSEO } from '@/hooks/useSEO';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Zap,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
// import { cn } from '@/lib/utils';
import { RelaySelector } from '@/components/RelaySelector';

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
        videoRef.current.currentTime = 0;
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

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-between">
          <div className="flex-1 mr-4">
            <Link to={`/profile`} className="flex items-center mb-3">
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

function useDiscoverVlogs() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['discover-vlogs'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        { 
          kinds: [21, 22],
          limit: 100 
        }
      ], { signal });
      
      return events.sort((a, b) => b.created_at - a.created_at);
    },
  });
}

const Discover = () => {
  const { generateBreadcrumbSchema } = useSEO({
    title: 'Discover Videos - Vlogstr',
    description: 'Discover trending vlogs and new creators on the Nostr network. Find engaging video content from decentralized creators around the world.',
    keywords: [
      'discover videos', 'vlogstr', 'nostr videos', 'trending vlogs', 
      'creator discovery', 'decentralized content', 'video platform',
      'nostr creators', 'viral videos', 'blockchain video'
    ],
    type: 'website',
  });

  const { data: vlogs, isLoading } = useDiscoverVlogs();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NostrEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);


  const handleComment = (event: NostrEvent) => {
    setSelectedEvent(event);
    setCommentModalOpen(true);
  };

  const handleShare = (event: NostrEvent) => {
    setSelectedEvent(event);
    setShareModalOpen(true);
  };

  useEffect(() => {
    if (vlogs && vlogs.length > 0 && currentIndex === 0) {
      setTimeout(() => {
        setCurrentIndex(0);
      }, 100);
    }
  }, [vlogs, currentIndex]);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      
      if (!vlogs || vlogs.length === 0) return;
      
      if (e.deltaY > 0 && currentIndex < vlogs.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!vlogs || vlogs.length === 0) return;
      
      if (e.key === 'ArrowDown' && currentIndex < vlogs.length - 1) {
        e.preventDefault();
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(prev => prev - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleScroll);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [vlogs, currentIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (!vlogs || vlogs.length === 0) return;

    if (isSwipeUp && currentIndex < vlogs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (isSwipeDown && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading discover feed...</p>
        </div>
      </div>
    );
  }

  if (!vlogs || vlogs.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Card className="max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="pt-6 text-center text-white">
            <p className="mb-4">No vlogs found. Try another relay?</p>
            <RelaySelector className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: window.location.origin },
    { name: 'Discover', url: window.location.href },
  ]);

  return (
    <div 
      className="relative h-screen overflow-hidden" 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <StructuredData data={breadcrumbData} />
      <div>
        <div 
          className="transition-transform duration-500 ease-in-out"
          style={{ transform: `translateY(-${currentIndex * 100}vh)` }}
        >
          {vlogs.map((vlog, index) => (
            <VideoPlayer
              key={vlog.id}
              event={vlog}
              isActive={index === currentIndex}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              onComment={() => handleComment(vlog)}
              onShare={() => handleShare(vlog)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Desktop only */}
      {vlogs && vlogs.length > 1 && (
        <div className="hidden md:flex md:flex-col fixed left-24 top-1/2 transform -translate-y-1/2 z-50 gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-12 h-12 disabled:opacity-30"
            onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-12 h-12 disabled:opacity-30"
            onClick={() => currentIndex < vlogs.length - 1 && setCurrentIndex(prev => prev + 1)}
            disabled={currentIndex === vlogs.length - 1}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        </div>
      )}


      {/* Modals */}
      {selectedEvent && (
        <>
          <CommentModal
            open={commentModalOpen}
            onOpenChange={setCommentModalOpen}
            event={selectedEvent}
          />
          <ShareModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            event={selectedEvent}
          />
        </>
      )}
    </div>
  );
};

export default Discover;