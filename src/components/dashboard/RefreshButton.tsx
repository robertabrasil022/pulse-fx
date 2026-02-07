import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate?: Date;
}

export function RefreshButton({ onRefresh, isRefreshing, lastUpdate }: RefreshButtonProps) {
  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'Nunca atualizado';
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return 'Agora mesmo';
    if (diffSeconds < 120) return 'Há 1 minuto';
    if (diffSeconds < 3600) return `Há ${Math.floor(diffSeconds / 60)} minutos`;
    return `Há ${Math.floor(diffSeconds / 3600)} horas`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 bg-secondary/50 hover:bg-secondary"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isRefreshing ? 'Atualizando...' : formatLastUpdate(lastUpdate)}</p>
      </TooltipContent>
    </Tooltip>
  );
}
