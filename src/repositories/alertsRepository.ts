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

  if (error) {
    console.error('Fetch alerts error:', error);
    throw new Error(`Falha ao buscar alertas: ${error.message}`);
  }
  return data as Alert[];
}

export async function createAlert(alert: {
  user_id: string;
  currency: string;
  target_price: number;
  tolerance: number;
}) {
  console.log('[AlertsRepository] Creating alert for user:', alert.user_id);
  const { data, error } = await supabase
    .from('alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    console.error('[AlertsRepository] Create alert error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Falha ao criar alerta: ${error.message}`);
  }
  
  console.log('[AlertsRepository] Alert created successfully:', data);
  return data;
}

export async function updateAlert(
  id: string,
  updates: {
    currency?: string;
    target_price?: number;
    tolerance?: number;
  }
) {
  console.log('[AlertsRepository] Updating alert:', id, updates);
  
  try {
    // Use RPC function to bypass RLS issues
    const { data, error } = await supabase.rpc('update_user_alert', {
      alert_id: id,
      new_currency: updates.currency || null,
      new_target_price: updates.target_price || null,
      new_tolerance: updates.tolerance || null,
    });

    if (error) {
      console.error('[AlertsRepository] Update alert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Falha ao atualizar alerta: ${error.message}`);
    }
    
    console.log('[AlertsRepository] Alert updated successfully via RPC:', data);
    return data;
  } catch (error) {
    console.error('[AlertsRepository] Unexpected error:', error);
    throw error;
  }
}

export async function deleteAlert(id: string) {
  console.log('[AlertsRepository] Deleting alert:', id);
  
  try {
    // Use RPC function to bypass RLS issues
    const { data, error } = await supabase.rpc('delete_user_alert', {
      alert_id: id
    });

    if (error) {
      console.error('[AlertsRepository] Delete alert error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Falha ao deletar alerta: ${error.message}`);
    }
    
    console.log('[AlertsRepository] Alert deleted successfully via RPC:', data);
    return { success: true };
  } catch (error) {
    console.error('[AlertsRepository] Unexpected error:', error);
    throw error;
  }
}
