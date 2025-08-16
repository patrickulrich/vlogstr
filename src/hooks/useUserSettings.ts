import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

export interface UserSettings {
  muteVideosByDefault: boolean;
  autoplayVideos: boolean;
  hdVideoQuality: boolean;
  uploadQuality: '4k' | '1080' | '720' | '480';
  language: string;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  pushNotifications: boolean;
  commentNotifications: boolean;
  likeNotifications: boolean;
  followNotifications: boolean;
  mentionNotifications: boolean;
}

const defaultSettings: UserSettings = {
  muteVideosByDefault: false, // Changed to false to match new audio policy
  autoplayVideos: true,
  hdVideoQuality: true,
  uploadQuality: '1080',
  language: 'en',
  compactMode: false,
  fontSize: 'medium',
  pushNotifications: false,
  commentNotifications: true,
  likeNotifications: true,
  followNotifications: true,
  mentionNotifications: true,
};

const SETTINGS_D_TAG = 'vlogstr-settings';

export function useUserSettings() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return defaultSettings;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [user.pubkey],
          '#d': [SETTINGS_D_TAG],
          limit: 1,
        }
      ], { signal });
      
      if (events.length === 0) return defaultSettings;
      
      try {
        const settingsData = JSON.parse(events[0].content);
        return { ...defaultSettings, ...settingsData };
      } catch (error) {
        console.error('Failed to parse user settings:', error);
        return defaultSettings;
      }
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      if (!user) throw new Error('User not logged in');
      
      const updatedSettings = { ...(settings || defaultSettings), ...newSettings };
      
      publishEvent({
        kind: 30078,
        content: JSON.stringify(updatedSettings),
        tags: [
          ['d', SETTINGS_D_TAG],
          ['title', 'Vlogstr Settings'],
        ],
      });
      
      return updatedSettings;
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['user-settings', user?.pubkey], updatedSettings);
    },
  });

  return {
    settings: settings || defaultSettings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}