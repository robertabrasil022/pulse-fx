import { externalSupabase as supabase } from '@/repositories/externalClient';

export interface Alert {
  id: string;
  user_id: string;
  currency: string;
  target_price: number;
  tolerance: number;
  created_at: string;
  updated_at: string;
}

export async function fetchAlerts(userId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Alert[];
}

export async function createAlert(alert: {
  user_id: string;
  currency: string;
  target_price: number;
  tolerance: number;
}) {
  const { error } = await supabase
    .from('alerts')
    .insert(alert);

  if (error) throw error;
}

export async function deleteAlert(id: string) {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
