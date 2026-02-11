import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFxHistory } from '@/hooks/useFxHistory';
import { cn } from '@/lib/utils';
import { Calendar, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PeriodComparisonChartProps {
  currencies: string[];
}

type Period = '7' | '15' | '30';

const PERIOD_LABELS: Record<Period, string> = {
  '7': '7 dias',
  '15': '15 dias',
  '30': '30 dias',
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

export function PeriodComparisonChart({ currencies }: PeriodComparisonChartProps) {
  const [period, setPeriod] = useState<Period>('7');
  const days = parseInt(period);

  const { data: historyData, isLoading, isFetching } = useFxHistory(currencies, days);

  // Build chart data from API response
  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    const dateMap = new Map<string, Record<string, number | string>>();

    historyData.forEach(({ currency, data }) => {
      data.forEach(point => {
        const pointDate = new Date(point.date);
        const dateKey = pointDate.toISOString();
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            label: pointDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            fullLabel: pointDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            sortKey: dateKey,
          });
        }
        const entry = dateMap.get(dateKey)!;
        entry[currency] = point.bid;
      });
    });

    return Array.from(dateMap.values())
      .sort((a, b) => (a.sortKey as string).localeCompare(b.sortKey as string));
  }, [historyData]);

  // Stats: first vs last value per currency
  const trendStats = useMemo(() => {
    if (!historyData) return [];

    return historyData.map(({ currency, data }) => {
      if (data.length < 2) return null;
      // data comes from API newest first, so reverse
      const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
      const first = sorted[0].bid;
      const last = sorted[sorted.length - 1].bid;
      const change = ((last - first) / first) * 100;
      const high = Math.max(...sorted.map(d => d.high));
      const low = Math.min(...sorted.map(d => d.low));

      return { currency, change, first, last, high, low };
    }).filter(Boolean) as { currency: string; change: number; first: number; last: number; high: number; low: number }[];
  }, [historyData]);

  const activeCurrencies = currencies.filter(c =>
    chartData.some(d => d[c] !== undefined)
  );

  if (currencies.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">
            Selecione moedas na sua watchlist para ver tendências históricas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tendências por Período
            </CardTitle>
            <CardDescription>
              Dados históricos reais da cotação das moedas selecionadas
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(['7', '15', '30'] as Period[]).map(p => (
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

        {/* Trend summary badges */}
        {trendStats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {trendStats.map(stat => (
              <div
                key={stat.currency}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/50"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: currencyColors[stat.currency]?.stroke || 'hsl(var(--primary))' }}
                />
                <span className="text-xs font-semibold">{CURRENCY_SHORT[stat.currency]}</span>
                <span className={cn(
                  'text-xs font-bold flex items-center gap-0.5',
                  stat.change > 0.5 ? 'text-destructive' : stat.change < -0.5 ? 'text-success' : 'text-muted-foreground'
                )}>
                  {stat.change > 0.5 ? <TrendingUp className="h-3 w-3" /> :
                   stat.change < -0.5 ? <TrendingDown className="h-3 w-3" /> :
                   <Minus className="h-3 w-3" />}
                  {stat.change > 0 ? '+' : ''}{stat.change.toFixed(2)}%
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  R${stat.last.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-sm text-muted-foreground">Sem dados históricos disponíveis</p>
          </div>
        ) : (
          <>
            <div className="h-[350px] relative">
              {isFetching && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    {activeCurrencies.map(currency => (
                      <linearGradient key={currency} id={`hist-gradient-${currency.replace('/', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currencyColors[currency]?.stroke || 'hsl(var(--primary))'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={currencyColors[currency]?.stroke || 'hsl(var(--primary))'} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value.toFixed(4)}`}
                    domain={['dataMin - 0.01', 'dataMax + 0.01']}
                    tickCount={12}
                    padding={{ top: 20, bottom: 20 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 8px 32px hsl(var(--background) / 0.4)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload as { fullLabel?: string } | undefined;
                      return item?.fullLabel ?? String(label);
                    }}
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
                      fill={`url(#hist-gradient-${currency.replace('/', '')})`}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Min/Max summary table */}
            {trendStats.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {trendStats.map(stat => (
                  <div key={stat.currency} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: currencyColors[stat.currency]?.stroke }}
                      />
                      <span className="text-xs font-semibold">{CURRENCY_SHORT[stat.currency]}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Mín: R${stat.low.toFixed(4)}</span>
                      <span>Máx: R${stat.high.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
