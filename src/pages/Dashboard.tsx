import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates, useFxInsights } from '@/hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversionPanel } from '@/components/dashboard/ConversionPanel';
import { CurrencyCard } from '@/components/dashboard/CurrencyCard';
import { InsightsSection } from '@/components/dashboard/ActionableInsights';
import { PeriodComparisonChart } from '@/components/dashboard/PeriodComparisonChart';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];
const MAIN_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL'];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading, isFetching, dataUpdatedAt } = useFxRates();
  const { data: insights = [] } = useFxInsights();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['fx-rates'] });
    queryClient.invalidateQueries({ queryKey: ['fx-insights'] });
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : undefined;

  // Get latest rates for main currencies
  const latestRates = useMemo(() => {
    return MAIN_CURRENCIES.map(code => {
      const currencyRates = rates.filter(r => r.code === code);
      if (currencyRates.length === 0) return null;
      return currencyRates.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
    }).filter(Boolean);
  }, [rates]);

  // Conditional returns after all hooks
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

        {ratesLoading ? (
          <div className="space-y-6">
            {/* Conversion Panel Skeleton */}
            <Skeleton className="h-64 w-full rounded-xl" />
            
            {/* Currency Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conversion Panel (Hero) */}
            <ConversionPanel rates={rates} currencies={ALL_CURRENCIES} />

            {/* Currency Cards */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4">Cotações Principais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MAIN_CURRENCIES.map(code => (
                  <CurrencyCard key={code} code={code} rates={rates} />
                ))}
              </div>
            </section>

            {/* Insights Section */}
            <section>
              <InsightsSection 
                rates={latestRates.map(r => ({
                  code: r!.code,
                  bid_value: r!.bid_value,
                  pct_change: r!.pct_change || 0,
                }))}
              />
            </section>

            {/* Period Comparison Chart */}
            <section>
              <PeriodComparisonChart rates={rates} currencies={MAIN_CURRENCIES} />
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
