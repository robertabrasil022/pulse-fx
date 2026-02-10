import { supabase } from '@/integrations/supabase/client';
import { CommoditySetting } from '@/types/database';

export async function fetchCommoditySettings(userId: string): Promise<CommoditySetting[]> {
  const { data, error } = await supabase
    .from('commodity_settings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CommoditySetting[];
}

export async function createCommoditySetting(setting: {
  user_id: string;
  asset_name: string;
  target_currency: string;
  target_price: number;
  alert_threshold: number;
}) {
  const { error } = await supabase
    .from('commodity_settings')
    .insert(setting);

  if (error) throw error;
}

export async function deleteCommoditySetting(id: string) {
  const { error } = await supabase
    .from('commodity_settings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
