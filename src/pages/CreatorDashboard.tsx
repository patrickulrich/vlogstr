import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Video, Image, Loader2, CheckCircle2, AlertCircle, BarChart3, Heart, MessageCircle, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCreatorAnalytics } from '@/hooks/useCreatorAnalytics';
import { StructuredData } from '@/components/StructuredData';

const CreatorDashboard = () => {
  const { generateBreadcrumbSchema } = useSEO({
    title: 'Creator Dashboard - Vlogstr',
    description: 'Upload, manage, and track your vlogs on the Nostr network. Access analytics, upload new content, and manage your decentralized video library.',
    keywords: [
      'creator dashboard', 'upload videos', 'vlogstr creator', 'nostr upload',
      'video analytics', 'content management', 'creator tools', 'video stats',
      'decentralized creator', 'blockchain video upload'
    ],
    type: 'website',
    noIndex: true, // Private dashboard page
  });

  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { totalVideos, totalLikes, totalComments, followerCount, isLoading: analyticsLoading } = useCreatorAnalytics();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'21' | '22'>('21');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setVideoFile(e.target.files[0]);
      setVideoUrl('');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setThumbnailFile(e.target.files[0]);
      setThumbnailUrl('');
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload vlogs',
        variant: 'destructive',
      });
      return;
    }

    if (!title || (!videoFile && !videoUrl)) {
      toast({
        title: 'Error',
        description: 'Please provide a title and video',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(10);

      let finalVideoUrl = videoUrl;
      let finalThumbnailUrl = thumbnailUrl;
      let videoDuration = 0;
      let videoHash = '';
      let videoMimeType = 'video/mp4';
      let videoDimensions = '';

      if (videoFile) {
        setUploadProgress(20);
        
        videoDuration = await getVideoDuration(videoFile);
        videoMimeType = videoFile.type || 'video/mp4';
        
        const uploadedVideoTags = await uploadFile(videoFile);
        finalVideoUrl = uploadedVideoTags[0][1];
        
        const hashTag = uploadedVideoTags.find(tag => tag[0] === 'x');
        if (hashTag) videoHash = hashTag[1];
        
        const dimTag = uploadedVideoTags.find(tag => tag[0] === 'dim');
        if (dimTag) videoDimensions = dimTag[1];
        
        setUploadProgress(60);
      }

      if (thumbnailFile) {
        setUploadProgress(70);
        const uploadedThumbnailTags = await uploadFile(thumbnailFile);
        finalThumbnailUrl = uploadedThumbnailTags[0][1];
        setUploadProgress(80);
      } else if (!finalThumbnailUrl && finalVideoUrl) {
        try {
          const video = document.createElement('video');
          video.src = finalVideoUrl;
          video.crossOrigin = 'anonymous';
          await new Promise(resolve => {
            video.onloadeddata = resolve;
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          const blob = await new Promise<Blob | null>(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
          });
          
          if (blob) {
            const thumbnailTags = await uploadFile(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
            finalThumbnailUrl = thumbnailTags[0][1];
          }
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
        }
      }

      setUploadProgress(90);

      const tags: string[][] = [
        ['title', title],
      ];

      if (videoDuration > 0) {
        tags.push(['duration', videoDuration.toString()]);
      }

      const imetaTag = ['imeta'];
      if (videoDimensions) imetaTag.push(`dim ${videoDimensions}`);
      imetaTag.push(`url ${finalVideoUrl}`);
      if (videoHash) imetaTag.push(`x ${videoHash}`);
      imetaTag.push(`m ${videoMimeType}`);
      if (finalThumbnailUrl) imetaTag.push(`image ${finalThumbnailUrl}`);
      imetaTag.push('service blossom');
      
      tags.push(imetaTag);

      const hashtags = description.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach(tag => {
          tags.push(['t', tag.slice(1).toLowerCase()]);
        });
      }

      publishEvent({
        kind: parseInt(videoType),
        content: description,
        tags,
      });

      setUploadProgress(100);

      toast({
        title: 'Success!',
        description: 'Your vlog has been published',
      });

      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoUrl('');
      setThumbnailUrl('');
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload vlog',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the creator dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: window.location.origin },
    { name: 'Creator Dashboard', url: window.location.href },
  ]);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <StructuredData data={breadcrumbData} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Creator Dashboard</h1>
        <p className="text-muted-foreground">Manage your vlogs and track your performance</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            My Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Upload New Vlog</CardTitle>
              <CardDescription className="text-muted-foreground">
                Share your video content on the Nostr network using Blossom servers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your vlog title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your vlog... (use #hashtags to categorize)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video Type</Label>
                  <RadioGroup value={videoType} onValueChange={(value) => setVideoType(value as '21' | '22')} disabled={isProcessing}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="21" id="normal" />
                      <Label htmlFor="normal">Normal Video (horizontal/long-form)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="22" id="short" />
                      <Label htmlFor="short">Short Video (vertical/stories/reels)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video">Video File *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="video"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Video className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload video</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">MP4, WebM, MOV (MAX. 500MB)</p>
                        </div>
                        <input
                          id="video"
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={handleVideoChange}
                          disabled={isProcessing}
                        />
                      </label>
                    </div>
                    {videoFile && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{videoFile.name}</span>
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or provide URL</span>
                      </div>
                    </div>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={isProcessing || !!videoFile}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="thumbnail"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          <Image className="w-6 h-6 mb-1 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Upload thumbnail</span>
                          </p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, WebP (MAX. 10MB)</p>
                        </div>
                        <input
                          id="thumbnail"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          disabled={isProcessing}
                        />
                      </label>
                    </div>
                    {thumbnailFile && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{thumbnailFile.name}</span>
                      </div>
                    )}
                    <Input
                      placeholder="https://example.com/thumbnail.jpg (optional URL)"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      disabled={isProcessing || !!thumbnailFile}
                    />
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isProcessing || isUploading || isPublishing}
                >
                  {isProcessing || isUploading || isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? 'Uploading...' : isPublishing ? 'Publishing...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Publish Vlog
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? '...' : totalVideos.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Videos published</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? '...' : totalLikes.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all videos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? '...' : totalComments.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total engagement</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? '...' : followerCount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Following you</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Analytics powered by Nostr protocol data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Real-time analytics from the Nostr network showing your content performance.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Videos: Your published content (kinds 21 & 22)<br/>
                    • Likes: NIP-25 reactions to your videos<br/>
                    • Comments: User engagement via replies<br/>
                    • Followers: People who added you to their contact lists
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>My Vlogs</CardTitle>
              <CardDescription>
                Manage your uploaded content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Your uploaded vlogs will appear here. Start by uploading your first video!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorDashboard;