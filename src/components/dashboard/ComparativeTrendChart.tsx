import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FxRate } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ComparativeTrendChartProps {
  rates: FxRate[];
  currencies: string[];
}

// Color palette for different currencies
const CURRENCY_COLORS: Record<string, string> = {
  'USD/BRL': 'hsl(187 94% 43%)',   // Primary cyan
  'EUR/BRL': 'hsl(142 76% 36%)',   // Green
  'CNY/BRL': 'hsl(45 93% 47%)',    // Yellow/Gold
  'GBP/BRL': 'hsl(262 83% 58%)',   // Purple
  'JPY/BRL': 'hsl(0 84% 60%)',     // Red
  'ARS/BRL': 'hsl(199 89% 48%)',   // Light blue
  'AUD/BRL': 'hsl(24 95% 53%)',    // Orange
  'RUB/BRL': 'hsl(330 81% 60%)',   // Pink
  'INR/BRL': 'hsl(173 80% 40%)',   // Teal
};

const CURRENCY_LABELS: Record<string, string> = {
  'USD/BRL': 'USD',
  'EUR/BRL': 'EUR',
  'CNY/BRL': 'CNY',
  'GBP/BRL': 'GBP',
  'JPY/BRL': 'JPY',
  'ARS/BRL': 'ARS',
  'AUD/BRL': 'AUD',
  'RUB/BRL': 'RUB',
  'INR/BRL': 'INR',
};

export function ComparativeTrendChart({ rates, currencies }: ComparativeTrendChartProps) {
  const chartData = useMemo(() => {
    // Get all unique timestamps
    const timestampMap = new Map<string, Record<string, string | number>>();
    
    currencies.forEach(currency => {
      const currencyRates = rates
        .filter(r => r.code === currency)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      currencyRates.forEach(rate => {
        const timeKey = format(new Date(rate.timestamp), 'HH:mm');
        const existing = timestampMap.get(timeKey) || { time: timeKey, fullTime: '' };
        
        // Normalize the values for comparison (percentage change from first value)
        const firstRate = currencyRates[0];
        const percentChange = firstRate 
          ? ((rate.bid_value - firstRate.bid_value) / firstRate.bid_value) * 100
          : 0;
        
        existing[currency] = percentChange;
        existing[`${currency}_raw`] = rate.bid_value;
        existing.fullTime = format(new Date(rate.timestamp), "dd 'de' MMM, HH:mm", { locale: ptBR });
        
        timestampMap.set(timeKey, existing);
      });
    });
    
    return Array.from(timestampMap.values());
  }, [rates, currencies]);

  const currencyStats = useMemo(() => {
    return currencies.map(currency => {
      const currencyRates = rates.filter(r => r.code === currency);
      if (currencyRates.length === 0) return { currency, current: 0, change: 0 };
      
      const sorted = currencyRates.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sorted[0];
      
      return {
        currency,
        current: latest.bid_value,
        change: latest.pct_change,
      };
    });
  }, [rates, currencies]);

  if (currencies.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground text-sm">
          Selecione moedas no filtro para ver o gráfico comparativo
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Comparativo de Tendências</h3>
          <p className="text-xs text-muted-foreground">
            Variação percentual relativa ao início do período
          </p>
        </div>
        
        {/* Currency stats badges */}
        <div className="flex flex-wrap gap-2">
          {currencyStats.map(stat => (
            <div 
              key={stat.currency}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/50"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: CURRENCY_COLORS[stat.currency] }}
              />
              <span className="text-xs font-medium text-foreground">
                {CURRENCY_LABELS[stat.currency]}
              </span>
              <span className={`text-xs ${stat.change > 0 ? 'text-destructive' : 'text-success'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(217 33% 17%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215 20% 45%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 45%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222 47% 11%)',
                border: '1px solid hsl(217 33% 25%)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px hsl(222 47% 5% / 0.4)',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
              formatter={(value: number, name: string, props: any) => {
                const rawValue = props.payload[`${name}_raw`];
                return [
                  `${value > 0 ? '+' : ''}${value.toFixed(2)}% (R$ ${rawValue?.toFixed(4) || '—'})`,
                  CURRENCY_LABELS[name] || name
                ];
              }}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value) => CURRENCY_LABELS[value] || value}
              wrapperStyle={{ fontSize: '12px' }}
            />
            {currencies.map(currency => (
              <Line 
                key={currency}
                type="monotone" 
                dataKey={currency} 
                stroke={CURRENCY_COLORS[currency] || 'hsl(215 20% 45%)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Dica:</span> O gráfico mostra a variação 
          percentual de cada moeda em relação ao primeiro ponto do período, permitindo comparar 
          o desempenho relativo mesmo com valores absolutos diferentes.
        </p>
      </div>
    </div>
  );
}
