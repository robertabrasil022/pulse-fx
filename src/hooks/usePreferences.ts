import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import * as prefsRepo from '@/repositories/preferencesRepository';

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  watchlist: string[];
  notifications_email: boolean;
  notifications_push: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Partial<UserPreferences> = {
  theme: 'system',
  watchlist: ['USD/BRL', 'EUR/BRL', 'CNY/BRL'],
  notifications_email: true,
  notifications_push: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00:00',
  quiet_hours_end: '08:00:00',
};

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user?.id) return null;

      const data = await prefsRepo.fetchPreferences(user.id);

      if (!data) {
        return prefsRepo.createDefaultPreferences(user.id, DEFAULT_PREFERENCES);
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');
      return prefsRepo.updatePreferences(user.id, updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences', user?.id], data);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updatePreferences: updateMutation.mutate,
    updatePreferencesAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useThemeSync() {
  const { preferences } = usePreferences();

  useEffect(() => {
    if (!preferences?.theme) return;

    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(preferences.theme === 'dark');
    }
  }, [preferences?.theme]);
}
