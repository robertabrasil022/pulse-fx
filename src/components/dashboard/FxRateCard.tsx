import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FxRate } from '@/types/database';
import { useFormatting } from '@/hooks/useFormatting';

interface FxRateCardProps {
  rate: FxRate;
  previousRate?: FxRate;
}

export function FxRateCard({ rate, previousRate }: FxRateCardProps) {
  const { formatNumber, formatPercentage } = useFormatting();
  const isPositive = rate.pct_change > 0;
  const isNegative = rate.pct_change < 0;
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  const getCurrencyFlag = (code: string) => {
    if (code.startsWith('USD')) return '🇺🇸';
    if (code.startsWith('EUR')) return '🇪🇺';
    if (code.startsWith('CNY')) return '🇨🇳';
    return '💱';
  };

  return (
    <div className="glass-card glass-card-hover rounded-xl p-6 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-10 pointer-events-none",
        isPositive && "bg-gradient-to-br from-success/20 to-transparent",
        isNegative && "bg-gradient-to-br from-destructive/20 to-transparent"
      )} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCurrencyFlag(rate.code)}</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{rate.code}</h3>
              <p className="text-xs text-muted-foreground">Tempo real</p>
            </div>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            isPositive && "bg-success/10",
            isNegative && "bg-destructive/10",
            !isPositive && !isNegative && "bg-muted"
          )}>
            <TrendIcon className={cn(
              "h-5 w-5",
              isPositive && "text-success",
              isNegative && "text-destructive",
              !isPositive && !isNegative && "text-muted-foreground"
            )} />
          </div>
        </div>

        {/* Bid/Ask Values */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compra</p>
            <p className="stat-value text-foreground">
              {formatNumber(rate.bid_value)}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Venda</p>
              <p className="text-xl font-semibold text-muted-foreground">
                {formatNumber(rate.ask_value)}
              </p>
            </div>
            
            <div className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              isPositive && "fx-badge-bullish",
              isNegative && "fx-badge-bearish",
              !isPositive && !isNegative && "fx-badge-neutral"
            )}>
              {formatPercentage(rate.pct_change)}
            </div>
          </div>
        </div>

        {/* Spread indicator */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Spread</span>
            <span className="text-foreground font-medium">
              {formatNumber((rate.ask_value - rate.bid_value) * 10000)} pips
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
