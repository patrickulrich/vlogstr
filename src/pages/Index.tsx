import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Heart, Users, Zap, Play, ArrowRight, Sparkles, Globe } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSEO } from '@/hooks/useSEO';
import { StructuredData } from '@/components/StructuredData';
import LoginDialog from '@/components/auth/LoginDialog';

const Index = () => {
  const { generateWebsiteSchema, generateOrganizationSchema } = useSEO({
    title: 'Vlogstr - Decentralized Video Sharing Platform',
    description: 'Create, share, and discover vlogs on the Nostr network. A censorship-resistant, decentralized video platform built for creators who want to own their content and connect directly with their audience.',
    keywords: [
      'vlogstr', 'nostr', 'decentralized video', 'video sharing', 'blockchain video',
      'censorship resistant', 'creator platform', 'vlogs', 'bitcoin', 'lightning',
      'web3 video', 'decentralized social media', 'content creator tools'
    ],
    type: 'website',
    url: window.location.origin,
  });

  const { user } = useCurrentUser();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <StructuredData data={[generateWebsiteSchema(), generateOrganizationSchema()]} />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center transform rotate-12 shadow-2xl">
                <Video className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-yellow-900" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Create.
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Share.
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Own.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
            The decentralized video platform where <span className="text-foreground font-bold">you</span> control your content
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/discover">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 text-lg rounded-full shadow-xl">
                <Play className="h-5 w-5 mr-2" />
                Start Watching
              </Button>
            </Link>
            
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="font-bold px-8 py-4 text-lg rounded-full border-2">
                  <Video className="h-5 w-5 mr-2" />
                  Create Content
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                variant="outline" 
                className="font-bold px-8 py-4 text-lg rounded-full border-2"
                onClick={() => setLoginDialogOpen(true)}
              >
                Sign In to Create
              </Button>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">Decentralized</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-full px-4 py-2">
              <Globe className="h-5 w-5 text-green-400" />
              <span className="font-semibold">Global Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Creators Love Us
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the next generation of content creators who value freedom and ownership
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Own Your Content</h3>
                <p className="text-muted-foreground">
                  Your videos, your audience, your rules. No platform can take them away.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Monetization</h3>
                <p className="text-muted-foreground">
                  Get paid directly by your fans with Lightning payments. No middleman.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Global Reach</h3>
                <p className="text-muted-foreground">
                  Connect with viewers worldwide through the decentralized Nostr network.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">True Community</h3>
                <p className="text-muted-foreground">
                  Build genuine connections without algorithmic interference.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Any Format</h3>
                <p className="text-muted-foreground">
                  Share long-form content or quick vertical videos. Your creativity, your choice.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="relative group hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Censorship Resistant</h3>
                <p className="text-muted-foreground">
                  Your voice matters. Share your truth without fear of takedowns.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl" />
            <Card className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-0">
              <CardContent className="p-12">
                <h2 className="text-4xl md:text-5xl font-black mb-6">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Ready to Go Viral?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of creators who've taken control of their content and built thriving communities.
                </p>
                
                {user ? (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/dashboard">
                      <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 text-lg rounded-full">
                        Upload Your First Video
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/discover">
                      <Button size="lg" variant="outline" className="font-bold px-8 py-4 text-lg rounded-full border-2">
                        Explore Trending Content
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground font-medium">
                      Connect your Nostr account to get started
                    </p>
                    <div className="flex justify-center gap-4">
                      <Link to="/discover">
                        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 text-lg rounded-full">
                          Start Exploring
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            <a href="https://soapbox.pub/mkstack" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Vibed with MKStack
            </a>
          </p>
        </div>
      </footer>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLogin={() => setLoginDialogOpen(false)}
      />
    </div>
  );
};

export default Index;