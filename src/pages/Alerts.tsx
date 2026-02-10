import { useState } from 'react';
import { Bell, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, createAlert, deleteAlert, Alert } from '@/repositories/alertsRepository';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function Alerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!user?.id,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    currency: 'USD/BRL',
    target_price: '',
    tolerance: '5',
  });

  const handleCreateAlert = async () => {
    if (!user || !newAlert.target_price) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      await createAlert({
        user_id: user.id,
        currency: newAlert.currency,
        target_price: parseFloat(newAlert.target_price),
        tolerance: parseFloat(newAlert.tolerance),
      });

      toast({ title: 'Alerta criado', description: `Alerta para ${newAlert.currency} configurado com sucesso` });
      setNewAlert({ currency: 'USD/BRL', target_price: '', tolerance: '5' });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível criar o alerta', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await deleteAlert(id);
      toast({ title: 'Alerta removido', description: 'O alerta foi removido com sucesso' });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o alerta', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">Configure alertas de preço para moedas</p>
        </div>

        {/* Create Alert Card */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Alerta
            </CardTitle>
            <CardDescription>Receba notificações quando a taxa atingir o valor desejado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select value={newAlert.currency} onValueChange={(v) => setNewAlert(prev => ({ ...prev, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço Alvo (R$)</Label>
                <Input type="number" step="0.01" placeholder="5.50" value={newAlert.target_price} onChange={(e) => setNewAlert(prev => ({ ...prev, target_price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tolerância (%)</Label>
                <Input type="number" step="1" placeholder="5" value={newAlert.tolerance} onChange={(e) => setNewAlert(prev => ({ ...prev, tolerance: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleCreateAlert} disabled={isCreating} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              Criar Alerta
            </Button>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Alertas Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum alerta configurado</p>
                <p className="text-sm text-muted-foreground">Crie seu primeiro alerta acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <div className="font-medium text-foreground">{alert.currency}</div>
                      <div className="text-sm text-muted-foreground">
                        Preço alvo: R$ {alert.target_price?.toFixed(2)} (±{alert.tolerance}%)
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
