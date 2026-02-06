import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIntegrationLogs } from '@/hooks/useDashboardData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { IntegrationLogsTable } from '@/components/dashboard/IntegrationLogsTable';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Logs() {
  const { user, loading: authLoading } = useAuth();
  const { data: logs = [], isLoading } = useIntegrationLogs();
  const navigate = useNavigate();

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
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Button>
          
          <h2 className="text-2xl font-bold text-foreground mb-1">Logs de Integração</h2>
          <p className="text-sm text-muted-foreground">
            Monitore as execuções de workflows n8n e status de sincronização de dados
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <IntegrationLogsTable logs={logs} />
        )}
      </main>
    </div>
  );
}
