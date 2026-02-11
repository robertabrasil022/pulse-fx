import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FxRate } from '@/types/database';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodComparisonChartProps {
  rates: FxRate[];
  currencies: string[];
}

type Period = '30' | '90' | '180';

const PERIOD_LABELS: Record<Period, string> = {
  '30': '30 dias',
  '90': '90 dias',
  '180': '180 dias',
};

const currencyColors: Record<string, { stroke: string; fill: string }> = {
  'USD/BRL': { stroke: 'hsl(43 89% 61%)', fill: 'hsl(43 89% 61% / 0.15)' },
  'EUR/BRL': { stroke: 'hsl(199 89% 48%)', fill: 'hsl(199 89% 48% / 0.15)' },
  'CNY/BRL': { stroke: 'hsl(0 84% 60%)', fill: 'hsl(0 84% 60% / 0.15)' },
  'GBP/BRL': { stroke: 'hsl(262 83% 58%)', fill: 'hsl(262 83% 58% / 0.15)' },
  'JPY/BRL': { stroke: 'hsl(142 71% 45%)', fill: 'hsl(142 71% 45% / 0.15)' },
  'ARS/BRL': { stroke: 'hsl(220 70% 50%)', fill: 'hsl(220 70% 50% / 0.15)' },
  'AUD/BRL': { stroke: 'hsl(38 92% 50%)', fill: 'hsl(38 92% 50% / 0.15)' },
  'RUB/BRL': { stroke: 'hsl(340 75% 55%)', fill: 'hsl(340 75% 55% / 0.15)' },
  'INR/BRL': { stroke: 'hsl(180 60% 45%)', fill: 'hsl(180 60% 45% / 0.15)' },
};

const CURRENCY_SHORT: Record<string, string> = {
  'USD/BRL': 'USD', 'EUR/BRL': 'EUR', 'CNY/BRL': 'CNY',
  'GBP/BRL': 'GBP', 'JPY/BRL': 'JPY', 'ARS/BRL': 'ARS',
  'AUD/BRL': 'AUD', 'RUB/BRL': 'RUB', 'INR/BRL': 'INR',
};

export function PeriodComparisonChart({ rates, currencies }: PeriodComparisonChartProps) {
  const [period, setPeriod] = useState<Period>('30');

  const chartData = useMemo(() => {
    const dataMap = new Map<string, Record<string, number | string>>();

    rates.forEach(rate => {
      if (!currencies.includes(rate.code)) return;
      const date = new Date(rate.timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });

      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }

      const entry = dataMap.get(date)!;
      if (!entry[rate.code]) {
        entry[rate.code] = rate.bid_value;
      }
    });

    return Array.from(dataMap.entries())
      .map(([, values]) => values)
      .slice(0, parseInt(period))
      .reverse();
  }, [rates, period, currencies]);

  // Calculate trend stats per currency
  const trendStats = useMemo(() => {
    return currencies.map(code => {
      const values = chartData
        .map(d => d[code] as number)
        .filter(v => v !== undefined);

      if (values.length < 2) return { code, change: 0, first: 0, last: 0 };

      const first = values[0];
      const last = values[values.length - 1];
      const change = ((last - first) / first) * 100;

      return { code, change, first, last };
    }).filter(s => s.first > 0);
  }, [chartData, currencies]);

  const activeCurrencies = currencies.filter(c =>
    chartData.some(d => d[c] !== undefined)
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Tendências por Período</CardTitle>
            <CardDescription>
              Análise comparativa das moedas selecionadas na sua watchlist
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(['30', '90', '180'] as Period[]).map(p => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'ghost'}
                onClick={() => setPeriod(p)}
                className={cn(
                  'text-xs px-3',
                  period === p ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'
                )}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
        </div>

        {/* Trend badges */}
        {trendStats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {trendStats.map(stat => (
              <div
                key={stat.code}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currencyColors[stat.code]?.stroke || 'hsl(var(--primary))' }}
                />
                <span className="text-xs font-medium">{CURRENCY_SHORT[stat.code]}</span>
                <span className={cn(
                  'text-xs font-semibold flex items-center gap-0.5',
                  stat.change > 0.5 ? 'text-destructive' : stat.change < -0.5 ? 'text-success' : 'text-muted-foreground'
                )}>
                  {stat.change > 0.5 ? <TrendingUp className="h-3 w-3" /> :
                   stat.change < -0.5 ? <TrendingDown className="h-3 w-3" /> :
                   <Minus className="h-3 w-3" />}
                  {stat.change > 0 ? '+' : ''}{stat.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                {activeCurrencies.map(currency => (
                  <linearGradient key={currency} id={`gradient-${currency.replace('/', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currencyColors[currency]?.stroke || 'hsl(var(--primary))'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currencyColors[currency]?.stroke || 'hsl(var(--primary))'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px hsl(var(--background) / 0.4)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toFixed(4)}`,
                  CURRENCY_SHORT[name] || name
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => CURRENCY_SHORT[value] || value}
                wrapperStyle={{ fontSize: '12px' }}
              />
              {activeCurrencies.map(currency => (
                <Area
                  key={currency}
                  type="monotone"
                  dataKey={currency}
                  name={currency}
                  stroke={currencyColors[currency]?.stroke || 'hsl(var(--primary))'}
                  fill={`url(#gradient-${currency.replace('/', '')})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Dica:</span> O gráfico exibe a evolução
            das cotações das moedas da sua watchlist nos últimos {PERIOD_LABELS[period]}.
            Use os botões acima para alternar entre períodos e identificar tendências.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
