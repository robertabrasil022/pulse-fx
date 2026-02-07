import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FxRate } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ExpandableFxRateCardProps {
  rate: FxRate;
  historicalRates: FxRate[];
}

export function ExpandableFxRateCard({ rate, historicalRates }: ExpandableFxRateCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const isPositive = rate.pct_change > 0;
  const isNegative = rate.pct_change < 0;
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  const getCurrencyFlag = (code: string) => {
    if (code.startsWith('USD')) return '🇺🇸';
    if (code.startsWith('EUR')) return '🇪🇺';
    if (code.startsWith('CNY')) return '🇨🇳';
    return '💱';
  };

  // Get last 5 historical rates
  const recentHistory = historicalRates
    .filter(r => r.id !== rate.id)
    .slice(0, 5);

  // Calculate min/max for the day
  const allRates = [rate, ...recentHistory];
  const minBid = Math.min(...allRates.map(r => Number(r.bid_value)));
  const maxBid = Math.max(...allRates.map(r => Number(r.bid_value)));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "glass-card rounded-xl relative overflow-hidden transition-all",
        isOpen && "ring-2 ring-primary/30"
      )}>
        {/* Subtle gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-10 pointer-events-none",
          isPositive && "bg-gradient-to-br from-success/20 to-transparent",
          isNegative && "bg-gradient-to-br from-destructive/20 to-transparent"
        )} />
        
        <CollapsibleTrigger asChild>
          <div className="relative z-10 p-6 cursor-pointer hover:bg-secondary/20 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCurrencyFlag(rate.code)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{rate.code}</h3>
                  <p className="text-xs text-muted-foreground">Tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Bid/Ask Values */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Compra</p>
                <p className="stat-value text-foreground">
                  {Number(rate.bid_value).toFixed(4)}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Venda</p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {Number(rate.ask_value).toFixed(4)}
                  </p>
                </div>
                
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  isPositive && "fx-badge-bullish",
                  isNegative && "fx-badge-bearish",
                  !isPositive && !isNegative && "fx-badge-neutral"
                )}>
                  {isPositive && '+'}
                  {Number(rate.pct_change).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Spread indicator */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Spread</span>
                <span className="text-foreground font-medium">
                  {((Number(rate.ask_value) - Number(rate.bid_value)) * 10000).toFixed(1)} pips
                </span>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="relative z-10 px-6 pb-6 border-t border-border/50">
            {/* Day Range */}
            <div className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Intervalo do dia</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Mínima</p>
                  <p className="text-sm font-medium text-foreground">{minBid.toFixed(4)}</p>
                </div>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ 
                      width: maxBid !== minBid 
                        ? `${((Number(rate.bid_value) - minBid) / (maxBid - minBid)) * 100}%` 
                        : '50%' 
                    }}
                  />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-xs text-muted-foreground mb-1">Máxima</p>
                  <p className="text-sm font-medium text-foreground">{maxBid.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* Recent History */}
            <div className="pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Histórico recente</p>
              {recentHistory.length > 0 ? (
                <div className="space-y-2">
                  {recentHistory.map((histRate) => (
                    <div 
                      key={histRate.id} 
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30"
                    >
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(histRate.timestamp), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-foreground">{Number(histRate.bid_value).toFixed(4)}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          Number(histRate.pct_change) > 0 && "bg-success/10 text-success",
                          Number(histRate.pct_change) < 0 && "bg-destructive/10 text-destructive",
                          Number(histRate.pct_change) === 0 && "bg-muted text-muted-foreground"
                        )}>
                          {Number(histRate.pct_change) > 0 && '+'}
                          {Number(histRate.pct_change).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem dados históricos disponíveis
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
