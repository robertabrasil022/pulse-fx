import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';
import * as prefsRepo from '@/repositories/preferencesRepository';

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  watchlist: string[];
  // Display/Formatting preferences
  number_format: 'pt-BR' | 'en-US';
  decimal_places: 2 | 4 | 6;
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  chart_default_period: '24h' | '7d' | '30d' | '90d';
  auto_refresh_interval: 0 | 1 | 5 | 15 | 30;
  created_at: string;
  updated_at: string;
}

const PRESET_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

const DEFAULT_PREFERENCES: Partial<UserPreferences> = {
  theme: 'system',
  watchlist: [],
  number_format: 'pt-BR',
  decimal_places: 2,
  date_format: 'DD/MM/YYYY',
  chart_default_period: '7d',
  auto_refresh_interval: 5,
};

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resetAttemptedRef = useRef(false);

  const query = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user?.id) return null;

      let data = await prefsRepo.fetchPreferences(user.id);

      if (!data) {
        return prefsRepo.createDefaultPreferences(user.id, DEFAULT_PREFERENCES);
      }

      // Reset watchlist ONLY ONCE if it contains the old preset values
      // Use a ref to ensure this happens only on the first load
      if (!resetAttemptedRef.current) {
        resetAttemptedRef.current = true;
        
        const oldPresetValues = ['USD/BRL', 'EUR/BRL', 'CNY/BRL'];
        const isOldConfiguration = 
          data.watchlist.length === 3 && 
          oldPresetValues.every(curr => data.watchlist.includes(curr));
        
        if (isOldConfiguration) {
          data = await prefsRepo.updatePreferences(user.id, { watchlist: [] });
        }
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
    onError: (error) => {
      console.error('Update mutation error:', error);
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
