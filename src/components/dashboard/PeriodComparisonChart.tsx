import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FxRate } from '@/types/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PeriodComparisonChartProps {
  rates: FxRate[];
  currencies: string[];
}

type Period = '30' | '90' | '180';

const currencyColors: Record<string, string> = {
  'USD/BRL': 'hsl(43 89% 61%)',    // Gold
  'EUR/BRL': 'hsl(199 89% 48%)',   // Info blue
  'CNY/BRL': 'hsl(0 84% 60%)',     // Red
  'GBP/BRL': 'hsl(262 83% 58%)',   // Purple
  'JPY/BRL': 'hsl(142 71% 45%)',   // Green
  'ARS/BRL': 'hsl(220 70% 50%)',   // Blue
  'AUD/BRL': 'hsl(38 92% 50%)',    // Orange
  'RUB/BRL': 'hsl(340 75% 55%)',   // Pink
  'INR/BRL': 'hsl(180 60% 45%)',   // Cyan
};

export function PeriodComparisonChart({ rates, currencies }: PeriodComparisonChartProps) {
  const [period, setPeriod] = useState<Period>('30');

  const chartData = useMemo(() => {
    // Group rates by date and currency
    const dataMap = new Map<string, Record<string, number>>();

    rates.forEach(rate => {
      const date = new Date(rate.timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
      
      if (!dataMap.has(date)) {
        dataMap.set(date, {});
      }
      
      const entry = dataMap.get(date)!;
      // Only update if not already set or if this is newer
      if (!entry[rate.code]) {
        entry[rate.code] = rate.bid_value;
      }
    });

    // Convert to array and sort by date
    const sortedData = Array.from(dataMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .slice(0, parseInt(period))
      .reverse();

    return sortedData;
  }, [rates, period]);

  const activeCurrencies = currencies.filter(c => 
    chartData.some(d => d[c] !== undefined)
  );

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Comparação por Período</CardTitle>
        <div className="flex gap-1">
          {(['30', '90', '180'] as Period[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-primary text-primary-foreground' : ''}
            >
              {p}d
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `R$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`R$ ${value.toFixed(4)}`, '']}
              />
              <Legend />
              {activeCurrencies.map(currency => (
                <Line
                  key={currency}
                  type="monotone"
                  dataKey={currency}
                  name={currency}
                  stroke={currencyColors[currency] || 'hsl(var(--primary))'}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
