import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { History as HistoryIcon, Loader2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFxRates } from '@/hooks/useDashboardData';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const { data: rates = [], isLoading: ratesLoading } = useFxRates();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');

  const filteredRates = useMemo(() => {
    let filtered = [...rates];
    
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(r => r.code === selectedCurrency);
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [rates, selectedCurrency]);

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Histórico</h1>
            <p className="text-sm text-muted-foreground">
              Histórico de cotações e variações
            </p>
          </div>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar moeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as moedas</SelectItem>
              {ALL_CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* History Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Cotações Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRates.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum registro encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Moeda</TableHead>
                      <TableHead className="text-right">Compra</TableHead>
                      <TableHead className="text-right">Venda</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(rate.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{rate.code}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          R$ {rate.bid_value.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          R$ {rate.ask_value.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 tabular-nums',
                            (rate.pct_change || 0) > 0 && 'text-success',
                            (rate.pct_change || 0) < 0 && 'text-destructive',
                            (rate.pct_change || 0) === 0 && 'text-muted-foreground'
                          )}>
                            {(rate.pct_change || 0) > 0 && <TrendingUp className="h-3 w-3" />}
                            {(rate.pct_change || 0) < 0 && <TrendingDown className="h-3 w-3" />}
                            {((rate.pct_change || 0) > 0 ? '+' : '') + (rate.pct_change || 0).toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
