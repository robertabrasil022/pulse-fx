import { externalSupabase } from './externalClient';

export async function signIn(email: string, password: string) {
  const { error } = await externalSupabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signUp(email: string, password: string, redirectUrl: string) {
  const { error } = await externalSupabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectUrl },
  });
  return { error };
}

export async function signOut() {
  const { error } = await externalSupabase.auth.signOut();
  return { error };
}

export async function getSession() {
  return externalSupabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: any) => void | Promise<void>) {
  return externalSupabase.auth.onAuthStateChange(callback as any);
}
