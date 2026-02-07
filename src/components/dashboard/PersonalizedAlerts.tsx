import { useMemo } from 'react';
import { Target, TrendingDown, TrendingUp, Bell, CheckCircle, AlertTriangle, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FxRate, CommoditySetting } from '@/types/database';
import { Progress } from '@/components/ui/progress';

interface PersonalizedAlertsProps {
  rates: FxRate[];
  commoditySettings: CommoditySetting[];
}

interface AlertData {
  setting: CommoditySetting;
  currentRate: FxRate | null;
  percentToTarget: number;
  recommendation: 'buy' | 'wait' | 'monitor';
  proximityLabel: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD/BRL': '$',
  'EUR/BRL': '€',
  'CNY/BRL': '¥',
  'GBP/BRL': '£',
  'JPY/BRL': '¥',
  'ARS/BRL': '$',
  'AUD/BRL': 'A$',
  'RUB/BRL': '₽',
  'INR/BRL': '₹',
};

export function PersonalizedAlerts({ rates, commoditySettings }: PersonalizedAlertsProps) {
  const getLatestRate = (code: string): FxRate | null => {
    const currencyRates = rates.filter(r => r.code === code);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const alerts = useMemo((): AlertData[] => {
    return commoditySettings
      .filter(setting => setting.target_price !== null)
      .map(setting => {
        const currentRate = getLatestRate(setting.target_currency);
        
        if (!currentRate || !setting.target_price) {
          return {
            setting,
            currentRate,
            percentToTarget: 0,
            recommendation: 'monitor' as const,
            proximityLabel: 'Sem dados',
          };
        }

        const currentBid = currentRate.bid_value;
        const targetPrice = setting.target_price;
        
        // Calculate how close we are to the target
        // If target is lower than current (user wants to buy when rate drops),
        // progress shows how much the rate has dropped toward the target
        const percentToTarget = ((targetPrice - currentBid) / targetPrice) * 100;
        const absPercent = Math.abs(percentToTarget);
        
        // Determine recommendation based on proximity to target
        let recommendation: 'buy' | 'wait' | 'monitor';
        let proximityLabel: string;
        
        if (currentBid <= targetPrice) {
          // Rate is at or below target - BUY opportunity!
          recommendation = 'buy';
          proximityLabel = 'Meta atingida!';
        } else if (absPercent <= (setting.alert_threshold || 5)) {
          // Within threshold - close to target
          recommendation = 'buy';
          proximityLabel = `${absPercent.toFixed(1)}% do alvo`;
        } else if (absPercent <= 10) {
          // Getting close
          recommendation = 'monitor';
          proximityLabel = `${absPercent.toFixed(1)}% do alvo`;
        } else {
          // Far from target
          recommendation = 'wait';
          proximityLabel = `${absPercent.toFixed(1)}% do alvo`;
        }

        return {
          setting,
          currentRate,
          percentToTarget: Math.min(100, Math.max(0, 100 - absPercent)),
          recommendation,
          proximityLabel,
        };
      })
      .sort((a, b) => b.percentToTarget - a.percentToTarget); // Sort by closest to target
  }, [commoditySettings, rates]);

  if (commoditySettings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Alertas Personalizados</h3>
        </div>
        
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground mb-2">
            Nenhuma configuração de commodity encontrada
          </p>
          <p className="text-xs text-muted-foreground">
            Vá em Configurações para definir seus preços-alvo e receber alertas personalizados
          </p>
        </div>
      </div>
    );
  }

  const alertsWithTargets = alerts.filter(a => a.setting.target_price !== null);
  
  if (alertsWithTargets.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Alertas Personalizados</h3>
        </div>
        
        <div className="text-center py-8">
          <Gauge className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground mb-2">
            Configure preços-alvo para suas commodities
          </p>
          <p className="text-xs text-muted-foreground">
            Defina os preços de câmbio desejados em Configurações para monitorar oportunidades
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Alertas Personalizados</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {alertsWithTargets.filter(a => a.recommendation === 'buy').length} oportunidades
        </span>
      </div>

      <div className="space-y-4">
        {alertsWithTargets.map((alert) => {
          const { setting, currentRate, percentToTarget, recommendation, proximityLabel } = alert;
          const symbol = CURRENCY_SYMBOLS[setting.target_currency] || '';
          
          return (
            <div
              key={setting.id}
              className={cn(
                "p-4 rounded-xl border transition-all",
                recommendation === 'buy' && "bg-success/5 border-success/30",
                recommendation === 'monitor' && "bg-warning/5 border-warning/30",
                recommendation === 'wait' && "bg-secondary/30 border-border/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{setting.asset_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {setting.target_currency}
                  </p>
                </div>
                
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                  recommendation === 'buy' && "bg-success/15 text-success",
                  recommendation === 'monitor' && "bg-warning/15 text-warning",
                  recommendation === 'wait' && "bg-muted text-muted-foreground"
                )}>
                  {recommendation === 'buy' && <CheckCircle className="h-3.5 w-3.5" />}
                  {recommendation === 'monitor' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {recommendation === 'wait' && <Target className="h-3.5 w-3.5" />}
                  {recommendation === 'buy' ? 'COMPRAR' : recommendation === 'monitor' ? 'MONITORAR' : 'AGUARDAR'}
                </div>
              </div>

              {/* Price comparison */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Taxa Atual</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-foreground">
                      R$ {currentRate?.bid_value.toFixed(4) || '—'}
                    </span>
                    {currentRate && (
                      <span className={cn(
                        "text-xs flex items-center",
                        currentRate.pct_change > 0 ? "text-destructive" : "text-success"
                      )}>
                        {currentRate.pct_change > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {currentRate.pct_change > 0 ? '+' : ''}{currentRate.pct_change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Preço-Alvo</p>
                  <span className="text-lg font-semibold text-primary">
                    R$ {setting.target_price?.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Progress bar to target */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Proximidade do Alvo</span>
                  <span className={cn(
                    "font-medium",
                    recommendation === 'buy' && "text-success",
                    recommendation === 'monitor' && "text-warning",
                    recommendation === 'wait' && "text-muted-foreground"
                  )}>
                    {proximityLabel}
                  </span>
                </div>
                <Progress 
                  value={percentToTarget} 
                  className={cn(
                    "h-2",
                    recommendation === 'buy' && "[&>div]:bg-success",
                    recommendation === 'monitor' && "[&>div]:bg-warning",
                    recommendation === 'wait' && "[&>div]:bg-muted-foreground"
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-primary font-medium">Como funciona:</span> Quando a taxa de câmbio 
          atingir seu preço-alvo (ou ficar dentro da margem configurada), você receberá uma 
          recomendação de COMPRAR. Configure suas commodities em Configurações.
        </p>
      </div>
    </div>
  );
}
