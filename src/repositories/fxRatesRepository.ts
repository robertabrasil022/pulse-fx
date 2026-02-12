import { externalSupabase as supabase } from '@/repositories/externalClient';
import { FxRate, FxInsight } from '@/types/database';

export async function fetchFxRates(limit = 50): Promise<FxRate[]> {
  const { data, error } = await supabase
    .from('fx_rates')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as FxRate[];
}

export async function fetchFxInsights(limit = 10): Promise<FxInsight[]> {
  const { data, error } = await supabase
    .from('fx_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as FxInsight[];
}

// Função para gerar insights com análise baseada em regras (100% gratuito)
export async function invokeGenerateInsights(rates: FxRate[]) {
  try {
    // Verifique se há dados de taxas de câmbio
    if (rates.length === 0) throw new Error('Dados insuficientes para gerar insights.');

    // Simular delay de processamento para melhor UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Análise baseada em regras
    const insights: Array<{
      title: string;
      message: string;
      type: 'opportunity' | 'risk' | 'neutral';
      currency?: string;
      action: string;
    }> = [];

    let totalChange = 0;
    let strongCurrencies = 0;
    let weakCurrencies = 0;

    rates.forEach(rate => {
      totalChange += rate.pct_change;
      const spread = ((rate.ask_value - rate.bid_value) / rate.bid_value) * 100;

      // Análise de variação significativa
      if (rate.pct_change > 2) {
        strongCurrencies++;
        insights.push({
          title: `${rate.code} em Alta`,
          message: `${rate.code} apresentou valorização de ${rate.pct_change.toFixed(2)}% nas últimas horas. Spread atual: ${spread.toFixed(2)}%.`,
          type: 'opportunity',
          currency: rate.code,
          action: 'Momento favorável para importadores comprarem. Exportadores devem aguardar estabilização.'
        });
      } else if (rate.pct_change < -2) {
        weakCurrencies++;
        insights.push({
          title: `${rate.code} em Queda`,
          message: `${rate.code} desvalorizou ${Math.abs(rate.pct_change).toFixed(2)}% recentemente. Spread: ${spread.toFixed(2)}%.`,
          type: 'risk',
          currency: rate.code,
          action: 'Exportadores podem aproveitar. Importadores devem monitorar para possível recuperação.'
        });
      }

      // Análise de spread
      if (spread > 1.5) {
        insights.push({
          title: `Spread Elevado - ${rate.code}`,
          message: `O spread de ${spread.toFixed(2)}% em ${rate.code} está acima da média, indicando maior custo de conversão.`,
          type: 'risk',
          currency: rate.code,
          action: 'Considere aguardar redução do spread ou negociar melhores taxas com instituições financeiras.'
        });
      }
    });

    // Insights de volatilidade geral
    const avgChange = totalChange / rates.length;
    let volatilityInsight = '';
    
    if (Math.abs(avgChange) > 1) {
      volatilityInsight = `Mercado apresenta alta volatilidade com variação média de ${avgChange.toFixed(2)}%. `;
      insights.unshift({
        title: 'Alta Volatilidade Detectada',
        message: `O mercado está em movimento com ${strongCurrencies} moedas em alta e ${weakCurrencies} em baixa.`,
        type: avgChange > 0 ? 'opportunity' : 'risk',
        action: 'Recomenda-se cautela e uso de hedge cambial para operações de maior volume.'
      });
    } else {
      volatilityInsight = `Mercado relativamente estável com variação média de ${avgChange.toFixed(2)}%. `;
      insights.unshift({
        title: 'Mercado Estável',
        message: 'As taxas de câmbio apresentam baixa volatilidade no momento.',
        type: 'neutral',
        action: 'Momento adequado para planejar operações comerciais de médio prazo.'
      });
    }

    // Gerar resumo
    const summary = `${volatilityInsight}Foram analisadas ${rates.length} moedas, identificando ${strongCurrencies} em valorização e ${weakCurrencies} em desvalorização. ${
      insights.length > 1 ? `${insights.length} insights específicos foram gerados para auxiliar suas decisões comerciais.` : ''
    }`;

    // Gerar recomendação geral
    let recommendation = '';
    if (avgChange > 1) {
      recommendation = 'Mercado em alta: Importadores devem acelerar compras. Exportadores podem aguardar melhores oportunidades. Considere proteção cambial para operações futuras.';
    } else if (avgChange < -1) {
      recommendation = 'Mercado em baixa: Exportadores têm vantagem competitiva. Importadores devem monitorar para recuperação. Avalie estratégias de hedge.';
    } else {
      recommendation = 'Mercado equilibrado: Momento adequado para operações planejadas. Mantenha diversificação cambial e monitore tendências específicas por moeda.';
    }

    return {
      summary,
      insights: insights.slice(0, 5), // Limitar a 5 insights principais
      recommendation,
    };
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    throw new Error(error instanceof Error ? error.message : 'Erro desconhecido');
  }
}
