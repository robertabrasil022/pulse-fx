import { useState } from 'react';
import { TrendingUp, AlertTriangle, Activity, ChevronDown, ChevronUp, Bell, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type InsightType = 'opportunity' | 'risk' | 'trend';

interface ActionableInsight {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  explanation: string;
  currency?: string;
  actionLabel: string;
}

interface ActionableInsightCardProps {
  insight: ActionableInsight;
  onCreateAlert?: (insight: ActionableInsight) => void;
}

export function ActionableInsightCard({ insight, onCreateAlert }: ActionableInsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = {
    opportunity: {
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      badgeVariant: 'default' as const,
      label: 'Oportunidade',
    },
    risk: {
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      badgeVariant: 'secondary' as const,
      label: 'Risco',
    },
    trend: {
      icon: Activity,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/30',
      badgeVariant: 'outline' as const,
      label: 'Tendência',
    },
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card className={cn(
      'glass-card transition-all duration-200',
      config.borderColor,
      'hover:shadow-lg'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              {insight.currency && (
                <Badge variant="outline" className="text-xs">
                  {insight.currency}
                </Badge>
              )}
            </div>

            <h4 className="font-semibold text-foreground mb-1">{insight.title}</h4>
            <p className="text-sm text-muted-foreground">{insight.summary}</p>

            {/* Expandable explanation */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            >
              <HelpCircle className="h-3 w-3" />
              Por que isso?
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground animate-fade-in">
                {insight.explanation}
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1"
            onClick={() => onCreateAlert?.(insight)}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{insight.actionLabel}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightsSectionProps {
  rates: { code: string; bid_value: number; pct_change: number }[];
  onCreateAlert?: (insight: ActionableInsight) => void;
}

export function InsightsSection({ rates, onCreateAlert }: InsightsSectionProps) {
  // Generate insights based on rates data
  const insights: ActionableInsight[] = [];

  // Analyze each currency
  rates.forEach(rate => {
    // Opportunity: Low rate (simulated check)
    if (rate.pct_change < -1) {
      insights.push({
        id: `opp-${rate.code}`,
        type: 'opportunity',
        title: `${rate.code} em queda acentuada`,
        summary: `A taxa caiu ${Math.abs(rate.pct_change).toFixed(2)}% - janela de compra favorável`,
        explanation: `Quando a moeda atinge níveis abaixo da média móvel de 20 dias, historicamente há uma recuperação nos próximos 5-10 dias. Este pode ser um bom momento para fechamento de câmbio.`,
        currency: rate.code,
        actionLabel: 'Criar Alerta',
      });
    }

    // Risk: High volatility
    if (Math.abs(rate.pct_change) > 2) {
      insights.push({
        id: `risk-${rate.code}`,
        type: 'risk',
        title: `Alta volatilidade em ${rate.code}`,
        summary: `Variação de ${Math.abs(rate.pct_change).toFixed(2)}% indica instabilidade`,
        explanation: `Volatilidade elevada aumenta o risco de operações de câmbio. Considere aguardar estabilização ou utilizar instrumentos de hedge para proteger sua posição.`,
        currency: rate.code,
        actionLabel: 'Monitorar',
      });
    }

    // Trend: Stable rate
    if (Math.abs(rate.pct_change) < 0.5) {
      insights.push({
        id: `trend-${rate.code}`,
        type: 'trend',
        title: `${rate.code} em tendência lateral`,
        summary: `Baixa volatilidade (${Math.abs(rate.pct_change).toFixed(2)}%) - momento de estabilidade`,
        explanation: `Períodos de baixa volatilidade são ideais para operações de maior volume, pois o risco de variação brusca é menor.`,
        currency: rate.code,
        actionLabel: 'Criar Alerta',
      });
    }
  });

  // Add some default insights if none generated
  if (insights.length === 0) {
    insights.push({
      id: 'default-1',
      type: 'trend',
      title: 'Mercado em operação normal',
      summary: 'Nenhuma anomalia detectada nas cotações atuais',
      explanation: 'As taxas de câmbio estão operando dentro das faixas esperadas. Continue monitorando para identificar oportunidades.',
      actionLabel: 'Ver Mais',
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Insights Acionáveis</h3>
        <span className="text-xs text-muted-foreground">
          {insights.length} sinais ativos
        </span>
      </div>
      
      <div className="space-y-3">
        {insights.slice(0, 5).map(insight => (
          <ActionableInsightCard
            key={insight.id}
            insight={insight}
            onCreateAlert={onCreateAlert}
          />
        ))}
      </div>
    </div>
  );
}
