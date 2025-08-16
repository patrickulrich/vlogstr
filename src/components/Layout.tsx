import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, VideoIcon, Upload, Settings, User, Compass } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user } = useCurrentUser();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Feed', href: '/feed', icon: VideoIcon },
    { name: 'Discover', href: '/discover', icon: Compass },
    ...(user ? [
      { name: 'Creator Dashboard', href: '/dashboard', icon: Upload },
      { name: 'Profile', href: '/profile', icon: User },
      { name: 'Settings', href: '/settings', icon: Settings },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <VideoIcon className="h-6 w-6" />
              <span className="font-bold">Vlogstr</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                      location.pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <LoginArea className="max-w-60" />
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}