import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, VideoIcon, BarChart3, Settings, Compass, Heart, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, metadata } = useCurrentUser();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Feed', href: '/feed', icon: Heart },
    { name: 'Discover', href: '/discover', icon: Compass },
    ...(user ? [
      { name: 'Creator Dashboard', href: '/dashboard', icon: BarChart3 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ] : []),
  ];

  const displayName = metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : '');
  const profileImage = metadata?.picture;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 w-20 bg-black border-r border-gray-800 z-50 flex-col",
        isMobile ? "hidden" : "flex"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <Link to="/" className="text-white">
            <VideoIcon className="h-8 w-8" />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col items-center py-8 space-y-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "text-white/80 hover:text-white transition-colors p-3 rounded-lg",
                  location.pathname === item.href && "text-white bg-white/10"
                )}
                title={item.name}
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          })}
        </div>

        {/* Profile Picture */}
        {user && (
          <div className="p-4 border-t border-gray-800">
            <Link to="/profile" className="block">
              <Avatar className="h-12 w-12 ring-2 ring-white/20 hover:ring-white/40 transition-all">
                {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
                <AvatarFallback className="bg-gray-700 text-white">
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative w-72 bg-black border-r border-gray-800 flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
              <Link to="/" className="text-white flex items-center gap-3">
                <VideoIcon className="h-8 w-8" />
                <span className="text-xl font-bold">Vlogstr</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-6">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors",
                        location.pathname === item.href && "text-white bg-white/10"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile Section */}
            {user && (
              <div className="p-6 border-t border-gray-800">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    {profileImage && <AvatarImage src={profileImage} alt={displayName} />}
                    <AvatarFallback className="bg-gray-700 text-white text-sm">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium">{displayName}</p>
                    <p className="text-white/60 text-xs">View Profile</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Camera Button */}
      {isMobile && (
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 bg-black/80 hover:bg-black text-white rounded-full w-12 h-12 p-0"
          size="sm"
        >
          <VideoIcon className="h-6 w-6" />
        </Button>
      )}

      {/* Main Content */}
      <div className={cn(
        "flex-1 min-h-screen bg-background text-foreground",
        isMobile ? "ml-0" : "ml-20"
      )}>
        {children}
      </div>
    </div>
  );
}