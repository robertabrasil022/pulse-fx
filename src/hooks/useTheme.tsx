import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { externalSupabase as supabase } from '@/repositories/externalClient';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'pulsefx-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return stored || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Load theme from database if user is logged in
  useEffect(() => {
    const loadThemeFromDB = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('preferences')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.theme) {
          setThemeState(data.theme as Theme);
          localStorage.setItem(STORAGE_KEY, data.theme);
        }
      } catch (err) {
        console.error('Failed to load theme from database:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeFromDB();
  }, [user?.id]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      setResolvedTheme(isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    // Update local state and localStorage immediately
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);

    // Persist to database if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('preferences')
          .update({ theme: newTheme })
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to save theme to database:', err);
      }
    }
  }, [user?.id]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
