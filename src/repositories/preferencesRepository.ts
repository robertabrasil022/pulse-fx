import { externalSupabase as supabase } from '@/repositories/externalClient';
import { UserPreferences } from '@/hooks/usePreferences';

export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserPreferences | null;
}

export async function createDefaultPreferences(userId: string, defaults: Partial<UserPreferences>): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('preferences')
    .insert({ user_id: userId, ...defaults })
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
}

export async function updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    // Update the preferences
    const { error: updateError, count } = await supabase
      .from('preferences')
      .update(updates, { count: 'exact' })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Update preferences error:', updateError);
      throw updateError;
    }

    if (!count) {
      throw new Error('No rows updated. Check RLS policies or permissions.');
    }

    // Fetch the updated record separately
    const { data, error: selectError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Select preferences error:', selectError);
      throw selectError;
    }

    if (!data) {
      throw new Error('Updated record not found');
    }

    return data as UserPreferences;
  } catch (err) {
    console.error('updatePreferences failed:', err);
    throw err;
  }
}
