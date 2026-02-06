import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FxRate } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FxTrendChartProps {
  rates: FxRate[];
  currencyCode: string;
}

export function FxTrendChart({ rates, currencyCode }: FxTrendChartProps) {
  // Filter rates for the specific currency and sort by timestamp
  const filteredRates = rates
    .filter(r => r.code === currencyCode)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate 30-day moving average (simulated with available data)
  const average = filteredRates.length > 0
    ? filteredRates.reduce((acc, r) => acc + Number(r.bid_value), 0) / filteredRates.length
    : 0;

  const chartData = filteredRates.map(rate => ({
    time: format(new Date(rate.timestamp), 'HH:mm'),
    bid: Number(rate.bid_value),
    ask: Number(rate.ask_value),
    fullTime: format(new Date(rate.timestamp), "dd 'de' MMM, HH:mm", { locale: ptBR }),
  }));

  const currentRate = filteredRates[filteredRates.length - 1];
  const isBelowAverage = currentRate && Number(currentRate.bid_value) < average;

  return (
    <div className="chart-container h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tendência {currencyCode}</h3>
          <p className="text-xs text-muted-foreground">
            Atual vs Média Móvel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary rounded-full" />
            <span className="text-xs text-muted-foreground">Compra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground/50 rounded-full" />
            <span className="text-xs text-muted-foreground">Média</span>
          </div>
        </div>
      </div>

      {isBelowAverage && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-xs text-success">
          ✨ Taxa atual abaixo da média — potencial oportunidade de compra
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(187 94% 43%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(187 94% 43%)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            domain={['dataMin - 0.01', 'dataMax + 0.01']}
            tickFormatter={(value) => value.toFixed(3)}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(222 47% 11%)',
              border: '1px solid hsl(217 33% 25%)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px hsl(222 47% 5% / 0.4)',
            }}
            labelStyle={{ color: 'hsl(210 40% 98%)' }}
            itemStyle={{ color: 'hsl(187 94% 43%)' }}
            formatter={(value: number) => [value.toFixed(4), 'Taxa']}
            labelFormatter={(label, payload) => payload[0]?.payload?.fullTime || label}
          />
          <ReferenceLine 
            y={average} 
            stroke="hsl(215 20% 45%)" 
            strokeDasharray="5 5" 
            strokeWidth={1}
          />
          <Line 
            type="monotone" 
            dataKey="bid" 
            stroke="hsl(187 94% 43%)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'hsl(187 94% 43%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
