import { useState, useCallback } from 'react';
import { FxRate } from '@/types/database';
import { invokeGenerateInsights } from '@/repositories/fxRatesRepository';

interface AIInsight {
  title: string;
  message: string;
  type: 'opportunity' | 'risk' | 'neutral';
  currency?: string;
  action: string;
}

interface AIInsightsResponse {
  summary: string;
  insights: AIInsight[];
  recommendation: string;
}

export function useAIInsights() {
  const [data, setData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (rates: FxRate[]) => {
    if (rates.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const latestRates = rates.reduce((acc, rate) => {
        if (!acc[rate.code] || new Date(rate.timestamp) > new Date(acc[rate.code].timestamp)) {
          acc[rate.code] = rate;
        }
        return acc;
      }, {} as Record<string, FxRate>);

      const ratesArray = Object.values(latestRates);
      const responseData = await invokeGenerateInsights(ratesArray);
      setData(responseData as AIInsightsResponse);
    } catch (err) {
      console.error('AI Insights error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, generateInsights, reset };
}
