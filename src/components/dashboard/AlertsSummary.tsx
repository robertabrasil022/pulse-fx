import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, TrendingUp, TrendingDown, ArrowRight, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/repositories/alertsRepository';
import { FxRate } from '@/types/database';
import { cn } from '@/lib/utils';
import { useFormatting } from '@/hooks/useFormatting';

interface AlertsSummaryProps {
  alerts: Alert[];
  rates: FxRate[];
}

const currencyIcons: Record<string, string> = {
  'USD/BRL': '🇺🇸',
  'EUR/BRL': '🇪🇺',
  'CNY/BRL': '🇨🇳',
  'GBP/BRL': '🇬🇧',
  'JPY/BRL': '🇯🇵',
  'ARS/BRL': '🇦🇷',
  'AUD/BRL': '🇦🇺',
  'RUB/BRL': '🇷🇺',
  'INR/BRL': '🇮🇳',
};

export function AlertsSummary({ alerts, rates }: AlertsSummaryProps) {
  const { formatNumber, formatPercentage } = useFormatting();
  
  const alertsWithStatus = useMemo(() => {
    return alerts.map(alert => {
      const currencyRates = rates.filter(r => r.code === alert.currency);
      const latestRate = currencyRates.length > 0
        ? currencyRates.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        : null;

      if (!latestRate) {
        return { ...alert, status: 'unknown' as const, currentRate: null, proximity: 0, distance: 0 };
      }

      const currentRate = latestRate.bid_value;
      const targetPrice = alert.target_price;
      const threshold = alert.tolerance || 5;

      const distance = ((currentRate - targetPrice) / targetPrice) * 100;
      const absDistance = Math.abs(distance);

      const maxDistance = threshold * 3;
      const proximity = Math.max(0, Math.min(100, (1 - absDistance / maxDistance) * 100));

      let status: 'triggered' | 'near' | 'far' | 'unknown' = 'far';
      if (absDistance <= threshold) {
        status = 'triggered';
      } else if (absDistance <= threshold * 2) {
        status = 'near';
      }

      return { ...alert, status, currentRate, proximity, distance };
    });
  }, [alerts, rates]);

  const triggeredCount = alertsWithStatus.filter(a => a.status === 'triggered').length;
  const nearCount = alertsWithStatus.filter(a => a.status === 'near').length;

  if (alerts.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alertas de Câmbio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-3">Nenhum alerta configurado</p>
            <Link to="/alerts">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                Criar Alerta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Alertas de Câmbio
          </CardTitle>
          <div className="flex items-center gap-2">
            {triggeredCount > 0 && (
              <Badge className="bg-success/20 text-success border-success/30">
                {triggeredCount} atingido{triggeredCount > 1 ? 's' : ''}
              </Badge>
            )}
            {nearCount > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30">
                {nearCount} próximo{nearCount > 1 ? 's' : ''}
              </Badge>
            )}
            <Link to="/alerts">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                Gerenciar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertsWithStatus.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                alert.status === 'triggered'
                  ? 'bg-success/5 border-success/30'
                  : alert.status === 'near'
                  ? 'bg-warning/5 border-warning/30'
                  : 'bg-muted/50 border-border'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{currencyIcons[alert.currency] || '💱'}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{alert.currency}</h4>
                  <p className="text-xs text-muted-foreground">
                    Tolerância: ±{alert.tolerance}%
                  </p>
                </div>
                {alert.status === 'triggered' && (
                  <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">
                    <Target className="h-3 w-3 mr-1" />
                    Atingido
                  </Badge>
                )}
                {alert.status === 'near' && (
                  <Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">
                    Próximo
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Alvo: R$ {formatNumber(alert.target_price || 0)}
                  </span>
                  {alert.currentRate && (
                    <span className={cn(
                      'flex items-center gap-1 font-medium',
                      alert.distance > 0 ? 'text-destructive' : 'text-success'
                    )}>
                      {alert.distance > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      R$ {formatNumber(alert.currentRate)}
                    </span>
                  )}
                </div>

                <Progress value={alert.proximity} className="h-1.5" />

                {alert.currentRate && (
                  <p className="text-xs text-muted-foreground text-right">
                    {formatPercentage(alert.distance)} do alvo
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
