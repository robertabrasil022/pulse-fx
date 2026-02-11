import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates, useFxInsights } from '@/hooks/useDashboardData';
import { usePreferences } from '@/hooks/usePreferences';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversionPanel } from '@/components/dashboard/ConversionPanel';
import { CurrencyCard } from '@/components/dashboard/CurrencyCard';
import { AIMarketInsights } from '@/components/dashboard/AIMarketInsights';
import { PeriodComparisonChart } from '@/components/dashboard/PeriodComparisonChart';
import { AlertsSummary } from '@/components/dashboard/AlertsSummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAlerts } from '@/repositories/alertsRepository';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];
const DEFAULT_WATCHLIST = ['USD/BRL', 'EUR/BRL', 'CNY/BRL'];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading, isFetching, dataUpdatedAt } = useFxRates();
  const { data: insights = [] } = useFxInsights();
  const { preferences, isLoading: prefsLoading } = usePreferences();
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!user?.id,
  });
  const queryClient = useQueryClient();

  // Use user's watchlist from preferences, fallback to default
  const watchlist = preferences?.watchlist?.length ? preferences.watchlist : DEFAULT_WATCHLIST;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['fx-rates'] });
    queryClient.invalidateQueries({ queryKey: ['fx-insights'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : undefined;

  // Get latest rates for watchlist currencies
  const latestRates = useMemo(() => {
    return watchlist.map(code => {
      const currencyRates = rates.filter(r => r.code === code);
      if (currencyRates.length === 0) return null;
      return currencyRates.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    }).filter(Boolean);
  }, [rates, watchlist]);

  const isLoading = ratesLoading || prefsLoading || authLoading;

  // Dynamic grid columns based on watchlist size
  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento de câmbio em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {/* Conversion Panel Skeleton */}
            <Skeleton className="h-64 w-full rounded-xl" />
            
            {/* Currency Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>

            {/* Commodity Summary Skeleton */}
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conversion Panel (Hero) */}
            <ConversionPanel rates={rates} currencies={ALL_CURRENCIES} />

            {/* Currency Cards */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Cotações Principais
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({watchlist.length} moedas)
                  </span>
                </h2>
                <Link to="/preferences">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                </Link>
              </div>
              
              {watchlist.length === 0 ? (
                <div className="text-center py-8 rounded-lg border border-dashed border-border">
                  <p className="text-muted-foreground mb-2">Nenhuma moeda na sua watchlist</p>
                  <Link to="/preferences">
                    <Button variant="outline" size="sm">
                      Configurar watchlist
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className={`grid gap-4 ${getGridCols(watchlist.length)}`}>
                  {watchlist.map(code => (
                    <CurrencyCard key={code} code={code} rates={rates} />
                  ))}
                </div>
              )}
            </section>

            {/* Alerts Summary */}
            <section>
              <AlertsSummary alerts={alerts} rates={rates} />
            </section>

            {/* AI Insights Section */}
            <section>
              <AIMarketInsights rates={rates} />
            </section>

            {/* Period Comparison Chart */}
            <section>
              <PeriodComparisonChart currencies={watchlist} />
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
