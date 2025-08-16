import { useParams } from 'react-router-dom';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSEO } from '@/hooks/useSEO';
import { useFollowerCount } from '@/hooks/useFollowerCount';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Video, Users, Link as LinkIcon, UserPlus, UserMinus } from 'lucide-react';
import { StructuredData } from '@/components/StructuredData';
import { genUserName } from '@/lib/genUserName';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

function VlogGrid({ vlogs }: { vlogs: NostrEvent[] }) {
  if (vlogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No vlogs uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vlogs.map((vlog) => {
        const title = vlog.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
        const imetaTags = vlog.tags.filter(([name]) => name === 'imeta');
        const thumbnail = imetaTags[0]?.find((item) => item.startsWith('image'))?.split(' ')[1];
        const duration = vlog.tags.find(([name]) => name === 'duration')?.[1];

        return (
          <Link key={vlog.id} to={`/video/${vlog.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="relative aspect-video bg-muted">
                {thumbnail ? (
                  <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    {Math.floor(parseInt(duration) / 60)}:{(parseInt(duration) % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              <CardHeader className="p-4">
                <h3 className="font-medium line-clamp-1">{title}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(vlog.created_at * 1000), { addSuffix: true })}
                </p>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function useUserVlogs(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-vlogs', pubkey],
    queryFn: async (c) => {
      if (!pubkey) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [21, 22],
          authors: [pubkey],
          limit: 100
        }
      ], { signal });
      
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
  });
}

function useFollowStatus(targetPubkey: string) {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['follow-status', user?.pubkey, targetPubkey],
    queryFn: async (c) => {
      if (!user?.pubkey || !targetPubkey) return false;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [3],
          authors: [user.pubkey],
          limit: 1
        }
      ], { signal });
      
      const contactList = events[0];
      if (!contactList) return false;
      
      return contactList.tags.some(([tagName, pubkey]) => tagName === 'p' && pubkey === targetPubkey);
    },
    enabled: !!user?.pubkey && !!targetPubkey,
  });
}

const UserProfile = () => {
  const { pubkey } = useParams<{ pubkey: string }>();
  const { user: currentUser } = useCurrentUser();
  const [isFollowing, setIsFollowing] = useState(false);
  
  const author = useAuthor(pubkey || '');
  const metadata = author.data?.metadata;
  const { data: vlogs, isLoading } = useUserVlogs(pubkey || '');
  const { data: followStatus } = useFollowStatus(pubkey || '');
  const { data: followerCount, isLoading: isLoadingFollowers } = useFollowerCount(pubkey || '');
  
  const userDisplayName = metadata?.display_name || metadata?.name || (pubkey ? genUserName(pubkey) : 'User');
  
  const { generateBreadcrumbSchema } = useSEO({
    title: `${userDisplayName}'s Profile - Vlogstr`,
    description: `View ${userDisplayName}'s profile on Vlogstr. Watch their vlogs and connect on the decentralized Nostr network.`,
    keywords: [
      'profile', 'vlogstr profile', userDisplayName, 'creator profile',
      'nostr profile', 'decentralized profile', 'video creator'
    ],
    type: 'profile',
    image: metadata?.picture,
  });

  if (!pubkey) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid user profile
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (author.isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="relative">
          <div className="h-48 md:h-64 bg-muted animate-pulse rounded-lg" />
          <div className="absolute -bottom-16 left-8">
            <div className="h-32 w-32 bg-muted animate-pulse rounded-full border-4 border-background" />
          </div>
        </div>
        <div className="mt-20 px-8">
          <div className="h-8 bg-muted animate-pulse rounded w-48 mb-4" />
          <div className="h-4 bg-muted animate-pulse rounded w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardHeader className="p-4">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;
  const about = metadata?.about;
  const website = metadata?.website;
  const nip05 = metadata?.nip05;
  const banner = metadata?.banner;

  const normalVlogs = vlogs?.filter(v => v.kind === 21) || [];
  const shortVlogs = vlogs?.filter(v => v.kind === 22) || [];

  const isOwnProfile = currentUser?.pubkey === pubkey;

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: window.location.origin },
    { name: displayName, url: window.location.href },
  ]);

  const handleFollowToggle = async () => {
    // TODO: Implement follow/unfollow functionality
    // This would involve updating the user's contact list (kind 3 event)
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <StructuredData data={breadcrumbData} />
      <div className="relative">
        {banner ? (
          <div className="h-48 md:h-64 overflow-hidden rounded-lg">
            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg" />
        )}
        
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-background">
            {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
            <AvatarFallback className="text-3xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="mt-20 px-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
            {nip05 && (
              <p className="text-muted-foreground mb-2">
                {nip05}
              </p>
            )}
            {about && (
              <p className="text-muted-foreground max-w-2xl mb-4">{about}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>{vlogs?.length || 0} vlogs</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {isLoadingFollowers ? '...' : followerCount || 0} {followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <LinkIcon className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
          
          {isOwnProfile ? (
            <Link to="/settings?tab=profile">
              <Button variant="outline" className="gap-2">
                <LinkIcon className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          ) : currentUser ? (
            <Button 
              variant={followStatus ? "outline" : "default"} 
              className="gap-2"
              onClick={handleFollowToggle}
            >
              {followStatus ? (
                <>
                  <UserMinus className="h-4 w-4" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          ) : null}
        </div>

        <Tabs defaultValue="all" className="mt-8">
          <TabsList>
            <TabsTrigger value="all">All Vlogs ({vlogs?.length || 0})</TabsTrigger>
            <TabsTrigger value="normal">Videos ({normalVlogs.length})</TabsTrigger>
            <TabsTrigger value="shorts">Shorts ({shortVlogs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse" />
                    <CardHeader className="p-4">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <VlogGrid vlogs={vlogs || []} />
            )}
          </TabsContent>

          <TabsContent value="normal" className="mt-6">
            <VlogGrid vlogs={normalVlogs} />
          </TabsContent>

          <TabsContent value="shorts" className="mt-6">
            <VlogGrid vlogs={shortVlogs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;