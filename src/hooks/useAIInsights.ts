import { useState, useCallback } from 'react';
import { FxRate } from '@/types/database';
import { invokeGenerateInsights } from '@/repositories/fxRatesRepository'; // Mantendo a importação
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Função para gerar insights com IA
  const generateInsights = useCallback(async (rates: FxRate[]) => {
    if (rates.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtém os dados mais recentes para cada moeda
      const latestRates = rates.reduce((acc, rate) => {
        if (!acc[rate.code] || new Date(rate.timestamp) > new Date(acc[rate.code].timestamp)) {
          acc[rate.code] = rate;
        }
        return acc;
      }, {} as Record<string, FxRate>);

      const ratesArray = Object.values(latestRates);

      // Chamamos a função de repositório que invoca a IA para gerar insights
      const responseData = await invokeGenerateInsights(ratesArray); // Mantendo o repositório e a função existente

      if (responseData) {
        setData(responseData as AIInsightsResponse);
      } else {
        throw new Error('Resposta da API não foi recebida corretamente');
      }
    } catch (err) {
      console.error('Erro ao gerar insights com IA:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar insights');
      toast({
        title: 'Erro na análise de IA',
        description: err instanceof Error ? err.message : 'Erro desconhecido.',
        variant: 'destructive',
      });
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
