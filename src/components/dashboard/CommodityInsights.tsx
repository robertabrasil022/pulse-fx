import { Wheat, Drumstick, Droplets, ArrowRight, Candy, Coffee, Bean } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FxRate, FxInsight } from '@/types/database';

interface CommodityInsightsProps {
  rates: FxRate[];
  insights: FxInsight[];
}

const commodities = [
  { name: 'Grains', label: 'Grãos', icon: Wheat, preferredCurrency: 'USD/BRL' },
  { name: 'Meat', label: 'Carnes', icon: Drumstick, preferredCurrency: 'EUR/BRL' },
  { name: 'Oil', label: 'Óleo', icon: Droplets, preferredCurrency: 'CNY/BRL' },
  { name: 'Sugar', label: 'Açúcar', icon: Candy, preferredCurrency: 'USD/BRL' },
  { name: 'Coffee', label: 'Café', icon: Coffee, preferredCurrency: 'USD/BRL' },
  { name: 'Soy', label: 'Soja', icon: Bean, preferredCurrency: 'USD/BRL' },
];

export function CommodityInsights({ rates, insights }: CommodityInsightsProps) {
  const getLatestRate = (code: string) => {
    const currencyRates = rates.filter(r => r.code === code);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const getCommodityRecommendation = (commodityName: string, preferredCurrency: string) => {
    const relevantInsight = insights.find(
      i => i.commodity === commodityName
    );
    const rate = getLatestRate(preferredCurrency);
    
    if (relevantInsight?.type === 'Opportunity') {
      return { action: 'COMPRAR', color: 'success', message: 'Condições favoráveis' };
    } else if (relevantInsight?.type === 'Risk') {
      return { action: 'AGUARDAR', color: 'warning', message: 'Monitorar tendências' };
    }
    
    // Default based on rate trend
    if (rate && Number(rate.pct_change) < 0) {
      return { action: 'COMPRAR', color: 'success', message: 'Taxa em queda' };
    }
    return { action: 'MANTER', color: 'muted', message: 'Condições estáveis' };
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sinais de Compra B2B</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Recomendações de importação/exportação baseadas em tendências de câmbio
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {commodities.map((commodity) => {
          const rate = getLatestRate(commodity.preferredCurrency);
          const recommendation = getCommodityRecommendation(commodity.name, commodity.preferredCurrency);
          const Icon = commodity.icon;

          return (
            <div
              key={commodity.name}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{commodity.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    {commodity.preferredCurrency} @ {rate ? Number(rate.bid_value).toFixed(4) : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">{recommendation.message}</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase",
                    recommendation.color === 'success' && "bg-success/15 text-success",
                    recommendation.color === 'warning' && "bg-warning/15 text-warning",
                    recommendation.color === 'muted' && "bg-muted text-muted-foreground"
                  )}>
                    {recommendation.action}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-primary font-medium">Dica:</span> Estes sinais são baseados em 
          tendências de câmbio atuais vs. médias móveis de 30 dias. Configure seus preços-alvo em Configurações 
          para alertas personalizados.
        </p>
      </div>
    </div>
  );
}
