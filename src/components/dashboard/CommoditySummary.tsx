import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Bell, TrendingUp, TrendingDown, ArrowRight, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CommoditySetting, FxRate } from '@/types/database';
import { cn } from '@/lib/utils';

interface CommoditySummaryProps {
  settings: CommoditySetting[];
  rates: FxRate[];
}

const commodityIcons: Record<string, string> = {
  'Grãos': '🌾',
  'Carnes': '🥩',
  'Óleo': '🛢️',
  'Açúcar': '🍬',
  'Café': '☕',
  'Soja': '🫘',
};

const commodityColors: Record<string, string> = {
  'Grãos': 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  'Carnes': 'bg-red-500/10 text-red-500 border-red-500/30',
  'Óleo': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  'Açúcar': 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  'Café': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  'Soja': 'bg-green-500/10 text-green-500 border-green-500/30',
};

export function CommoditySummary({ settings, rates }: CommoditySummaryProps) {
  // Calculate status for each alert
  const alertsWithStatus = useMemo(() => {
    return settings.map(setting => {
      // Get latest rate for the currency
      const currencyRates = rates.filter(r => r.code === setting.target_currency);
      const latestRate = currencyRates.length > 0
        ? currencyRates.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        : null;

      if (!latestRate || !setting.target_price) {
        return { ...setting, status: 'unknown', currentRate: null, proximity: 0, distance: 0 };
      }

      const currentRate = latestRate.bid_value;
      const targetPrice = setting.target_price;
      const threshold = setting.alert_threshold || 5;
      
      // Calculate percentage distance from target
      const distance = ((currentRate - targetPrice) / targetPrice) * 100;
      const absDistance = Math.abs(distance);
      
      // Proximity: 100% when at target, 0% when far away
      const maxDistance = threshold * 3; // Consider "far" as 3x the threshold
      const proximity = Math.max(0, Math.min(100, (1 - absDistance / maxDistance) * 100));
      
      let status: 'triggered' | 'near' | 'far' | 'unknown' = 'far';
      if (absDistance <= threshold) {
        status = 'triggered';
      } else if (absDistance <= threshold * 2) {
        status = 'near';
      }

      return {
        ...setting,
        status,
        currentRate,
        proximity,
        distance,
      };
    });
  }, [settings, rates]);

  // Group by commodity
  const groupedAlerts = useMemo(() => {
    const groups: Record<string, typeof alertsWithStatus> = {};
    alertsWithStatus.forEach(alert => {
      if (!groups[alert.asset_name]) {
        groups[alert.asset_name] = [];
      }
      groups[alert.asset_name].push(alert);
    });
    return groups;
  }, [alertsWithStatus]);

  const triggeredCount = alertsWithStatus.filter(a => a.status === 'triggered').length;
  const nearCount = alertsWithStatus.filter(a => a.status === 'near').length;

  if (settings.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Commodities Monitorados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground mb-3">Nenhum commodity monitorado</p>
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
            <Package className="h-5 w-5" />
            Commodities Monitorados
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
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedAlerts).map(([commodity, alerts]) => (
            <div
              key={commodity}
              className={cn(
                'p-4 rounded-lg border transition-all',
                commodityColors[commodity] || 'bg-muted/50 border-border'
              )}
            >
              {/* Commodity Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{commodityIcons[commodity] || '📦'}</span>
                <div>
                  <h4 className="font-semibold text-foreground">{commodity}</h4>
                  <p className="text-xs text-muted-foreground">
                    {alerts.length} alerta{alerts.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{alert.target_currency}</span>
                      <div className="flex items-center gap-1">
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
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Alvo: R$ {alert.target_price?.toFixed(2)}
                      </span>
                      {alert.currentRate && (
                        <span className={cn(
                          'flex items-center gap-1',
                          alert.distance > 0 ? 'text-destructive' : 'text-success'
                        )}>
                          {alert.distance > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          R$ {alert.currentRate.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Proximity bar */}
                    <Progress 
                      value={alert.proximity} 
                      className="h-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
