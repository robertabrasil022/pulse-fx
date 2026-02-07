import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates } from '@/hooks/useDashboardData';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FxRate } from '@/types/database';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];
const ITEMS_PER_PAGE = 20;

interface GroupedRates {
  date: string;
  dateLabel: string;
  rates: FxRate[];
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading } = useFxRates();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  // Filter and sort rates
  const filteredRates = useMemo(() => {
    let filtered = [...rates];
    
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(r => r.code === selectedCurrency);
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [rates, selectedCurrency]);

  // Group rates by date
  const groupedRates = useMemo((): GroupedRates[] => {
    const groups: Record<string, FxRate[]> = {};
    
    filteredRates.forEach(rate => {
      const date = new Date(rate.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(rate);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, rates]) => ({
        date,
        dateLabel: formatDateLabel(date),
        rates,
      }));
  }, [filteredRates]);

  // Pagination for list view
  const paginatedRates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRates, currentPage]);

  const totalPages = Math.ceil(filteredRates.length / ITEMS_PER_PAGE);

  // Reset page when filter changes
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    setCurrentPage(1);
  };

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
            <p className="text-sm text-muted-foreground">
              {filteredRates.length} cotações registradas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grouped' | 'list')}>
              <TabsList className="h-9">
                <TabsTrigger value="grouped" className="gap-1.5 px-3">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Agrupado</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5 px-3">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Currency Filter */}
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {ALL_CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {ratesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRates.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grouped' ? (
          /* Grouped View */
          <div className="space-y-4">
            {groupedRates.map(group => (
              <Card key={group.date} className="glass-card overflow-hidden">
                <CardHeader className="py-3 bg-secondary/30 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-primary" />
                      {group.dateLabel}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {group.rates.length} registro{group.rates.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {group.rates.map(rate => (
                      <RateRow key={rate.id} rate={rate} compact />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View with Pagination */
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5" />
                Cotações Registradas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {paginatedRates.map(rate => (
                  <RateRow key={rate.id} rate={rate} showDate />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-secondary/20">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

// Helper Components
interface RateRowProps {
  rate: FxRate;
  compact?: boolean;
  showDate?: boolean;
}

function RateRow({ rate, compact, showDate }: RateRowProps) {
  const pctChange = rate.pct_change || 0;
  const isPositive = pctChange > 0;
  const isNegative = pctChange < 0;

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 hover:bg-secondary/30 transition-colors",
      compact ? "py-2.5" : "py-3"
    )}>
      {/* Left: Currency & Time */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-20">
          <span className="font-medium text-foreground text-sm">{rate.code}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {showDate ? (
            new Date(rate.timestamp).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          ) : (
            new Date(rate.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          )}
        </span>
      </div>

      {/* Right: Values */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">Compra</p>
          <p className="text-sm font-medium tabular-nums">R$ {rate.bid_value.toFixed(4)}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">Venda</p>
          <p className="text-sm font-medium tabular-nums">R$ {rate.ask_value.toFixed(4)}</p>
        </div>
        {/* Mobile: Combined value */}
        <div className="text-right sm:hidden">
          <p className="text-sm font-medium tabular-nums">R$ {rate.bid_value.toFixed(4)}</p>
        </div>
        <div className={cn(
          "flex items-center gap-1 min-w-[70px] justify-end px-2 py-1 rounded-md text-sm font-medium tabular-nums",
          isPositive && "bg-success/10 text-success",
          isNegative && "bg-destructive/10 text-destructive",
          !isPositive && !isNegative && "bg-muted text-muted-foreground"
        )}>
          {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
          {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
          {isPositive ? '+' : ''}{pctChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

// Utility function
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = (d: Date) => d.toISOString().split('T')[0];

  if (dateOnly(date) === dateOnly(today)) {
    return 'Hoje';
  }
  if (dateOnly(date) === dateOnly(yesterday)) {
    return 'Ontem';
  }

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}
