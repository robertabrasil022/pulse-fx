import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FxRate, FxInsight, IntegrationLog, CommoditySetting } from '@/types/database';

export function useFxRates() {
  return useQuery({
    queryKey: ['fx-rates'],
    queryFn: async (): Promise<FxRate[]> => {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as FxRate[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useFxInsights() {
  return useQuery({
    queryKey: ['fx-insights'],
    queryFn: async (): Promise<FxInsight[]> => {
      const { data, error } = await supabase
        .from('fx_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as FxInsight[];
    },
  });
}

export function useIntegrationLogs() {
  return useQuery({
    queryKey: ['integration-logs'],
    queryFn: async (): Promise<IntegrationLog[]> => {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as IntegrationLog[];
    },
  });
}

export function useCommoditySettings(userId?: string) {
  return useQuery({
    queryKey: ['commodity-settings', userId],
    queryFn: async (): Promise<CommoditySetting[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('commodity_settings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommoditySetting[];
    },
    enabled: !!userId,
  });
}
