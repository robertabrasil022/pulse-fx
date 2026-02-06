import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates, useFxInsights, useIntegrationLogs } from '@/hooks/useDashboardData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { FxRateCard } from '@/components/dashboard/FxRateCard';
import { FxTrendChart } from '@/components/dashboard/FxTrendChart';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { CommodityInsights } from '@/components/dashboard/CommodityInsights';
import { IntegrationLogsTable } from '@/components/dashboard/IntegrationLogsTable';
import { Loader2, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading } = useFxRates();
  const { data: insights = [], isLoading: insightsLoading } = useFxInsights();
  const { data: logs = [], isLoading: logsLoading } = useIntegrationLogs();

  // Redirect to auth if not logged in
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

  // Get latest rates for each currency pair
  const getLatestRate = (code: string) => {
    const currencyRates = rates.filter(r => r.code === code);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const latestRates = ['USD/BRL', 'EUR/BRL', 'CNY/BRL']
    .map(code => getLatestRate(code))
    .filter(Boolean);

  const isLoading = ratesLoading || insightsLoading || logsLoading;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">Painel de Inteligência FX</h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento de câmbio em tempo real para compras de commodities
          </p>
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

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 animate-fade-in">
              {/* FX Rate Cards */}
              <section>
                <h3 className="text-lg font-semibold text-foreground mb-4">Taxas de Câmbio</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {latestRates.map((rate) => rate && (
                    <FxRateCard key={rate.id} rate={rate} />
                  ))}
                </div>
              </section>

              {/* Commodity Insights */}
              <section>
                <CommodityInsights rates={rates} insights={insights} />
              </section>

              {/* Recent Logs Preview */}
              <section>
                <IntegrationLogsTable logs={logs.slice(0, 5)} />
              </section>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Insights de Mercado</h3>
                <span className="text-xs text-muted-foreground">
                  {insights.length} sinais ativos
                </span>
              </div>
              
              {insights.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Nenhum insight disponível ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FxTrendChart rates={rates} currencyCode="USD/BRL" />
                <FxTrendChart rates={rates} currencyCode="EUR/BRL" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FxTrendChart rates={rates} currencyCode="CNY/BRL" />
                <div className="glass-card rounded-xl p-6 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Gráficos adicionais em breve
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
