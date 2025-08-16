import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/hooks/useAppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useSEO } from '@/hooks/useSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings as SettingsIcon, Server, User, Bell, Palette } from 'lucide-react';
import { RelaySelector } from '@/components/RelaySelector';
import { EditProfileForm } from '@/components/EditProfileForm';
import { StructuredData } from '@/components/StructuredData';

const Settings = () => {
  const { generateBreadcrumbSchema } = useSEO({
    title: 'Settings - Vlogstr',
    description: 'Configure your Vlogstr preferences including theme, notifications, relay settings, and profile information.',
    keywords: [
      'vlogstr settings', 'preferences', 'configuration', 'theme settings',
      'notification settings', 'profile settings', 'relay configuration',
      'privacy settings', 'account settings'
    ],
    type: 'website',
    noIndex: true, // Private settings page
  });

  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const { config } = useAppContext();
  const { settings, updateSettings } = useUserSettings();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access settings
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: window.location.origin },
    { name: 'Settings', url: window.location.href },
  ]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <StructuredData data={breadcrumbData} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="relays" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Relays</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSettings({ language: value })}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mute-videos">Mute Videos by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Start videos muted in the feed
                  </p>
                </div>
                <Switch 
                  id="mute-videos" 
                  checked={settings.muteVideosByDefault}
                  onCheckedChange={(checked) => updateSettings({ muteVideosByDefault: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="disable-mute">Disable Muted Videos</Label>
                  <p className="text-sm text-muted-foreground">
                    Completely disable muted video playback in feed
                  </p>
                </div>
                <Switch 
                  id="disable-mute" 
                  checked={settings.disableMutedVideos}
                  onCheckedChange={(checked) => updateSettings({ disableMutedVideos: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hd">HD Video Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    Stream videos in high definition when available
                  </p>
                </div>
                <Switch 
                  id="hd" 
                  checked={settings.hdVideoQuality}
                  onCheckedChange={(checked) => updateSettings({ hdVideoQuality: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-quality">Default Upload Quality</Label>
                <Select value={settings.uploadQuality} onValueChange={(value: '4k' | '1080' | '720' | '480') => updateSettings({ uploadQuality: value })}>
                  <SelectTrigger id="upload-quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4k">4K (2160p)</SelectItem>
                    <SelectItem value="1080">Full HD (1080p)</SelectItem>
                    <SelectItem value="720">HD (720p)</SelectItem>
                    <SelectItem value="480">SD (480p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your Nostr profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relays">
          <Card>
            <CardHeader>
              <CardTitle>Relay Configuration</CardTitle>
              <CardDescription>
                Manage your Nostr relay connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Current Relay</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  You are currently connected to: <code className="bg-muted px-2 py-1 rounded">{config.relayUrl}</code>
                </p>
                <RelaySelector className="w-full" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-relay">Add Custom Relay</Label>
                <div className="flex space-x-2">
                  <Input
                    id="custom-relay"
                    placeholder="wss://relay.example.com"
                    type="url"
                  />
                  <Button variant="outline">Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Relay List</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">wss://relay.nostr.band</span>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">wss://relay.damus.io</span>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">wss://relay.primal.net</span>
                    <Button variant="ghost" size="sm">Remove</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing and use smaller fonts
                  </p>
                </div>
                <Switch 
                  id="compact" 
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select value={settings.fontSize} onValueChange={(value: 'small' | 'medium' | 'large' | 'xl') => updateSettings({ fontSize: value })}>
                  <SelectTrigger id="font-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications even when the app is closed
                  </p>
                </div>
                <Switch 
                  id="push" 
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comments">Comment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone comments on your vlogs
                  </p>
                </div>
                <Switch 
                  id="comments" 
                  checked={settings.commentNotifications}
                  onCheckedChange={(checked) => updateSettings({ commentNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="likes">Like Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone likes your vlogs
                  </p>
                </div>
                <Switch 
                  id="likes" 
                  checked={settings.likeNotifications}
                  onCheckedChange={(checked) => updateSettings({ likeNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="follows">New Follower Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone follows you
                  </p>
                </div>
                <Switch 
                  id="follows" 
                  checked={settings.followNotifications}
                  onCheckedChange={(checked) => updateSettings({ followNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mentions">Mention Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you
                  </p>
                </div>
                <Switch 
                  id="mentions" 
                  checked={settings.mentionNotifications}
                  onCheckedChange={(checked) => updateSettings({ mentionNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Settings;