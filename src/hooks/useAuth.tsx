import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as authRepo from '@/repositories/authRepository';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = authRepo.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    authRepo.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return authRepo.signIn(email, password);
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    return authRepo.signUp(email, password, redirectUrl);
  };

  const signOut = async () => {
    return authRepo.signOut();
  };

  return { user, session, loading, signIn, signUp, signOut };
}
