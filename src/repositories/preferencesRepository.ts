import { externalSupabase } from './externalClient';
import { UserPreferences } from '@/hooks/usePreferences';

export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await externalSupabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserPreferences | null;
}

export async function createDefaultPreferences(userId: string, defaults: Partial<UserPreferences>): Promise<UserPreferences> {
  const { data, error } = await externalSupabase
    .from('preferences')
    .insert({ user_id: userId, ...defaults })
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
}

export async function updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
  const { data, error } = await externalSupabase
    .from('preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
}
