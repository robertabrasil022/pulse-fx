import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FxRate } from '@/types/database';
import { cn } from '@/lib/utils';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface CurrencyCardProps {
  code: string;
  rates: FxRate[];
  onClick?: () => void;
}

export function CurrencyCard({ code, rates, onClick }: CurrencyCardProps) {
  const { latestRate, sparklineData, change24h } = useMemo(() => {
    const currencyRates = rates
      .filter(r => r.code === code)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latest = currencyRates[0];
    const previous = currencyRates[1];
    
    // Calculate 24h change
    const change = latest && previous 
      ? ((latest.bid_value - previous.bid_value) / previous.bid_value) * 100 
      : 0;

    // Prepare sparkline data (last 10 points, reversed for chronological order)
    const sparkline = currencyRates
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({ index: i, value: r.bid_value }));

    return {
      latestRate: latest,
      sparklineData: sparkline,
      change24h: change,
    };
  }, [rates, code]);

  const currencyNames: Record<string, string> = {
    'USD/BRL': 'Dólar Americano',
    'EUR/BRL': 'Euro',
    'CNY/BRL': 'Yuan Chinês',
    'GBP/BRL': 'Libra Esterlina',
    'JPY/BRL': 'Iene Japonês',
    'ARS/BRL': 'Peso Argentino',
    'AUD/BRL': 'Dólar Australiano',
    'RUB/BRL': 'Rublo Russo',
    'INR/BRL': 'Rupia Indiana',
  };

  const currencyFlags: Record<string, string> = {
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

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getSparklineColor = (value: number) => {
    if (value > 0) return 'hsl(var(--success))';
    if (value < 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground))';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  if (!latestRate) {
    return (
      <Card className="glass-card glass-card-hover cursor-pointer" onClick={onClick}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="glass-card glass-card-hover cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currencyFlags[code] || '💱'}</span>
            <div>
              <div className="font-semibold text-foreground">{code}</div>
              <div className="text-xs text-muted-foreground">{currencyNames[code] || code}</div>
            </div>
          </div>
          
          {/* Change Badge */}
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            change24h > 0 && 'bg-success/10 text-success',
            change24h < 0 && 'bg-destructive/10 text-destructive',
            change24h === 0 && 'bg-muted text-muted-foreground'
          )}>
            {getChangeIcon(change24h)}
            <span className="tabular-nums">
              {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Current Rate */}
        <div className="text-2xl font-bold tabular-nums text-foreground">
          R$ {latestRate.bid_value.toFixed(4)}
        </div>

        {/* Sparkline */}
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={getSparklineColor(change24h)}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bid/Ask */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Compra: R$ {latestRate.bid_value.toFixed(4)}</span>
          <span>Venda: R$ {latestRate.ask_value.toFixed(4)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
