import { useEffect, useState } from 'react';
import { externalSupabase } from '@/repositories/externalClient';

export function useAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<{
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
    accessToken: string | null;
    sessionExpiry: string | null;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await externalSupabase.auth.getSession();
        
        if (error) {
          console.error('[AuthDebug] Error getting session:', error);
          setDebugInfo({
            isAuthenticated: false,
            userId: null,
            email: null,
            accessToken: null,
            sessionExpiry: null,
          });
          return;
        }

        if (session) {
          console.log('[AuthDebug] Session found:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          });

          setDebugInfo({
            isAuthenticated: true,
            userId: session.user.id,
            email: session.user.email || null,
            accessToken: session.access_token ? session.access_token.substring(0, 20) + '...' : null,
            sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          });
        } else {
          console.warn('[AuthDebug] No session found');
          setDebugInfo({
            isAuthenticated: false,
            userId: null,
            email: null,
            accessToken: null,
            sessionExpiry: null,
          });
        }
      } catch (err) {
        console.error('[AuthDebug] Unexpected error:', err);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthDebug] Auth state changed:', event);
      checkAuth();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return debugInfo;
}
