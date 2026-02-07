import { TrendingUp, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'rates' | 'insights' | 'logs' | 'settings';
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const emptyStateConfig = {
  rates: {
    icon: TrendingUp,
    title: 'Nenhuma taxa de câmbio disponível',
    description: 'As taxas de câmbio serão exibidas aqui assim que a integração estiver configurada e enviando dados.',
    action: 'Atualizar dados',
    showRefresh: true,
  },
  insights: {
    icon: AlertCircle,
    title: 'Nenhum insight de mercado ainda',
    description: 'Insights serão gerados automaticamente baseados nas tendências de câmbio e condições de mercado.',
    action: 'Atualizar',
    showRefresh: true,
  },
  logs: {
    icon: RefreshCw,
    title: 'Nenhum log de integração',
    description: 'Os logs aparecerão aqui quando workflows externos (n8n) começarem a enviar dados para o sistema.',
    action: 'Ver documentação',
    showRefresh: false,
  },
  settings: {
    icon: Settings,
    title: 'Configure seus alertas',
    description: 'Defina preços-alvo e limites de variação para receber alertas personalizados sobre oportunidades de compra.',
    action: 'Ir para Configurações',
    showRefresh: false,
    link: '/settings',
  },
};

export function EmptyState({ type, onRefresh, isRefreshing }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <Icon className="h-8 w-8 text-primary/60" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {config.title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
        {config.description}
      </p>

      {/* Sample data preview for rates */}
      {type === 'rates' && (
        <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border/50 max-w-sm mx-auto">
          <p className="text-xs text-muted-foreground mb-2">Exemplo de dados:</p>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span>🇺🇸</span>
              <span className="text-foreground">USD/BRL</span>
            </span>
            <span className="text-muted-foreground">5.1234</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        {config.showRefresh && onRefresh && (
          <Button
            variant="default"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {config.action}
          </Button>
        )}
        
        {'link' in config && config.link && (
          <Button asChild variant="default">
            <Link to={config.link}>{config.action}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper for cn
import { cn } from '@/lib/utils';
