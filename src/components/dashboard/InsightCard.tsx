import { TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FxInsight } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

interface InsightCardProps {
  insight: FxInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const isOpportunity = insight.type === 'Opportunity';
  const isBullish = insight.indicator === 'Bullish';
  
  const TypeIcon = isOpportunity ? Sparkles : AlertTriangle;
  const TrendIcon = isBullish ? TrendingUp : TrendingDown;

  return (
    <div className={cn(
      "glass-card rounded-xl p-5 border-l-4 transition-all hover:scale-[1.01]",
      isOpportunity ? "border-l-success" : "border-l-destructive"
    )}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "p-2.5 rounded-xl shrink-0",
          isOpportunity ? "bg-success/10" : "bg-destructive/10"
        )}>
          <TypeIcon className={cn(
            "h-5 w-5",
            isOpportunity ? "text-success" : "text-destructive"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isOpportunity ? "text-success" : "text-destructive"
            )}>
              {insight.type}
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="text-foreground text-sm leading-relaxed mb-3">
            {insight.message}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {insight.currency_code && (
              <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                {insight.currency_code}
              </span>
            )}
            {insight.commodity && (
              <span className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                {insight.commodity}
              </span>
            )}
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isBullish ? "text-success" : "text-destructive"
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span className="font-medium">{insight.indicator}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
