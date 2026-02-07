import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAIInsights } from '@/hooks/useAIInsights';
import { FxRate } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface AIMarketInsightsProps {
  rates: FxRate[];
}

export function AIMarketInsights({ rates }: AIMarketInsightsProps) {
  const { data, isLoading, error, generateInsights, reset } = useAIInsights();
  const { toast } = useToast();
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (rates.length === 0) {
      toast({
        title: 'Dados insuficientes',
        description: 'Não há dados de câmbio disponíveis para análise',
        variant: 'destructive',
      });
      return;
    }
    
    setHasGenerated(true);
    await generateInsights(rates);
  };

  const handleReset = () => {
    reset();
    setHasGenerated(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return TrendingUp;
      case 'risk':
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'opportunity':
        return {
          bg: 'bg-success/10',
          border: 'border-l-success',
          text: 'text-success',
          badge: 'bg-success/15 text-success',
        };
      case 'risk':
        return {
          bg: 'bg-destructive/10',
          border: 'border-l-destructive',
          text: 'text-destructive',
          badge: 'bg-destructive/15 text-destructive',
        };
      default:
        return {
          bg: 'bg-primary/10',
          border: 'border-l-primary',
          text: 'text-primary',
          badge: 'bg-primary/15 text-primary',
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'Oportunidade';
      case 'risk':
        return 'Risco';
      default:
        return 'Neutro';
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Análise de IA</h3>
            <p className="text-xs text-muted-foreground">
              Insights gerados por inteligência artificial
            </p>
          </div>
        </div>
        
        {hasGenerated && data && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Nova análise
          </Button>
        )}
      </div>

      {!hasGenerated ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-foreground font-medium mb-2">
            Análise Inteligente de Mercado
          </h4>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Use IA para analisar as taxas de câmbio atuais e receber insights 
            personalizados para suas operações de importação/exportação.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar Análise com IA
          </Button>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analisando dados de mercado...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-destructive font-medium mb-2">Erro ao gerar análise</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={handleGenerate}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground leading-relaxed">
              {data.summary}
            </p>
          </div>

          {/* Insights */}
          {data.insights && data.insights.length > 0 && (
            <div className="space-y-3">
              {data.insights.map((insight, index) => {
                const Icon = getTypeIcon(insight.type);
                const colors = getTypeColors(insight.type);

                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-xl p-4 border-l-4 bg-secondary/30",
                      colors.border
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0", colors.bg)}>
                        <Icon className={cn("h-4 w-4", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-foreground text-sm">
                            {insight.title}
                          </span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors.badge)}>
                            {getTypeLabel(insight.type)}
                          </span>
                          {insight.currency && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                              {insight.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.message}
                        </p>
                        <p className="text-xs text-primary font-medium">
                          → {insight.action}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommendation */}
          {data.recommendation && (
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-foreground">Recomendação</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.recommendation}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
