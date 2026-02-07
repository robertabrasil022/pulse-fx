import { useState, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates, useFxInsights, useCommoditySettings } from '@/hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ExpandableFxRateCard } from '@/components/dashboard/ExpandableFxRateCard';
import { FxTrendChart } from '@/components/dashboard/FxTrendChart';
import { ComparativeTrendChart } from '@/components/dashboard/ComparativeTrendChart';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { CommodityInsights } from '@/components/dashboard/CommodityInsights';
import { OperationsCalculator } from '@/components/dashboard/OperationsCalculator';
import { AIMarketInsights } from '@/components/dashboard/AIMarketInsights';
import { PersonalizedAlerts } from '@/components/dashboard/PersonalizedAlerts';
import { CurrencyFilter } from '@/components/dashboard/CurrencyFilter';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader2, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];
const DEFAULT_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL'];

export default function Dashboard() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading, isFetching: ratesFetching, dataUpdatedAt } = useFxRates();
  const { data: insights = [], isLoading: insightsLoading, isFetching: insightsFetching } = useFxInsights();
  const { data: commoditySettings = [] } = useCommoditySettings(user?.id);
  const queryClient = useQueryClient();
  
  // Currency filter state - start with default 3 currencies
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(DEFAULT_CURRENCIES);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['fx-rates'] });
    queryClient.invalidateQueries({ queryKey: ['fx-insights'] });
  }, [queryClient]);

  const isRefreshing = ratesFetching || insightsFetching;
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : undefined;

  // Get latest rates for each currency pair (filtered)
  const getLatestRate = useCallback((code: string) => {
    const currencyRates = rates.filter(r => r.code === code);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }, [rates]);

  // Get historical rates for a currency
  const getHistoricalRates = useCallback((code: string) => {
    return rates
      .filter(r => r.code === code)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [rates]);

  const latestRates = useMemo(() => 
    selectedCurrencies
      .map(code => ({ rate: getLatestRate(code), history: getHistoricalRates(code) }))
      .filter((item): item is { rate: NonNullable<typeof item.rate>; history: typeof item.history } => 
        item.rate !== null
      ),
    [selectedCurrencies, getLatestRate, getHistoricalRates]
  );

  const isLoading = ratesLoading || insightsLoading;
  const hasNoRates = !ratesLoading && latestRates.length === 0;
  const hasNoInsights = !insightsLoading && insights.length === 0;

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title with Refresh */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Painel de Inteligência FX</h2>
            <p className="text-sm text-muted-foreground">
              Monitoramento de câmbio em tempo real para compras de commodities
            </p>
          </div>
          <RefreshButton 
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            lastUpdate={lastUpdate}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados do painel...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="glass-card p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tendências
                </TabsTrigger>
              </TabsList>
              
              {/* Currency Filter */}
              <CurrencyFilter
                currencies={ALL_CURRENCIES}
                selected={selectedCurrencies}
                onSelectionChange={setSelectedCurrencies}
              />
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              {/* FX Rate Cards */}
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Taxas de Câmbio</h3>
                {hasNoRates ? (
                  <EmptyState 
                    type="rates" 
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                  />
                ) : (
                  <div className={cn(
                    "grid gap-4",
                    latestRates.length === 1 && "grid-cols-1",
                    latestRates.length === 2 && "grid-cols-1 md:grid-cols-2",
                    latestRates.length >= 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                    latestRates.length > 3 && latestRates.length <= 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                    latestRates.length > 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  )}>
                    {latestRates.map(({ rate, history }) => (
                      <ExpandableFxRateCard 
                        key={rate.id} 
                        rate={rate}
                        historicalRates={history}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Operations Calculator */}
              <section>
                <OperationsCalculator rates={rates} availableCurrencies={ALL_CURRENCIES} />
              </section>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 animate-fade-in">
              {/* AI Market Analysis */}
              <AIMarketInsights rates={rates} />
              
              {/* Personalized Alerts Section */}
              <PersonalizedAlerts rates={rates} commoditySettings={commoditySettings} />
              
              {/* B2B Buy Signals */}
              <CommodityInsights rates={rates} insights={insights} />
              
              {/* Market Insights Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Insights de Mercado</h3>
                  <span className="text-xs text-muted-foreground">
                    {insights.length} sinais ativos
                  </span>
                </div>
                
                {hasNoInsights ? (
                  <EmptyState 
                    type="insights"
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                  />
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6 animate-fade-in">
              {/* Comparative Chart */}
              <ComparativeTrendChart rates={rates} currencies={selectedCurrencies} />
              
              {/* Individual Charts */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Detalhamento por Moeda</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedCurrencies.map(code => (
                    <FxTrendChart key={code} rates={rates} currencyCode={code} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
