import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Loader2, AlertCircle, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, createAlert, deleteAlert, updateAlert, Alert } from '@/repositories/alertsRepository';

const PRESET_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function Alerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = usePreferences();

  // Merge preset currencies with user's watchlist
  const availableCurrencies = Array.from(new Set([
    ...PRESET_CURRENCIES,
    ...(preferences?.watchlist || []),
  ]));

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!user?.id,
  });

  // Debug: Log when alerts change
  useEffect(() => {
    console.log('[Alerts] Component re-rendered with alerts:', alerts);
  }, [alerts]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [newAlert, setNewAlert] = useState({
    currency: 'USD/BRL',
    target_price: '',
    tolerance: '5',
  });
  const [editAlert, setEditAlert] = useState({
    currency: 'USD/BRL',
    target_price: '',
    tolerance: '5',
  });

  const handleCreateAlert = async () => {
    if (!user || !newAlert.target_price) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    console.log('[Alerts] Starting alert creation for user:', user.id);
    setIsCreating(true);
    try {
      const result = await createAlert({
        user_id: user.id,
        currency: newAlert.currency,
        target_price: parseFloat(newAlert.target_price),
        tolerance: parseFloat(newAlert.tolerance),
      });

      console.log('[Alerts] Create result:', result);
      
      // Add to cache immediately (optimistic update)
      if (result) {
        queryClient.setQueryData(['alerts', user?.id], (old: Alert[] | undefined) => {
          console.log('[Alerts] Current cache before create:', old);
          const updated = !old ? [result] : [result, ...old];
          console.log('[Alerts] Updated cache after create:', updated);
          return updated;
        });
      }
      
      toast({ title: 'Alerta criado', description: `Alerta para ${newAlert.currency} configurado com sucesso` });
      setNewAlert({ currency: 'USD/BRL', target_price: '', tolerance: '5' });
      
      // DO NOT refetch - trust the optimistic update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[Alerts] Error creating alert:', error);
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditDialog = (alert: Alert) => {
    setEditingAlertId(alert.id);
    setEditAlert({
      currency: alert.currency,
      target_price: alert.target_price.toString(),
      tolerance: alert.tolerance.toString(),
    });
    setIsEditing(true);
  };

  const handleUpdateAlert = async () => {
    if (!editingAlertId || !editAlert.target_price) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    console.log('[Alerts] Starting alert update:', editingAlertId);
    const updates = {
      currency: editAlert.currency,
      target_price: parseFloat(editAlert.target_price),
      tolerance: parseFloat(editAlert.tolerance),
    };
    
    try {
      const result = await updateAlert(editingAlertId, updates);
      console.log('[Alerts] Update result:', result);
      
      // Update cache immediately (optimistic update)
      queryClient.setQueryData(['alerts', user?.id], (old: Alert[] | undefined) => {
        console.log('[Alerts] Current cache before update:', old);
        if (!old) return [];
        const updated = old.map(alert => 
          alert.id === editingAlertId 
            ? { ...alert, ...updates }
            : alert
        );
        console.log('[Alerts] Updated cache after update:', updated);
        return updated;
      });
      
      toast({ title: 'Alerta atualizado', description: 'O alerta foi atualizado com sucesso' });
      setIsEditing(false);
      setEditingAlertId(null);
      
      // DO NOT refetch - trust the optimistic update
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[Alerts] Error updating alert:', error);
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditing(false);
    setEditingAlertId(null);
    setEditAlert({ currency: 'USD/BRL', target_price: '', tolerance: '5' });
  };

  const handleDeleteAlert = async (id: string) => {
    console.log('[Alerts] Starting alert deletion:', id);
    console.log('[Alerts] Current user ID:', user?.id);
    
    try {
      const result = await deleteAlert(id);
      console.log('[Alerts] Delete result:', result);
      
      // Remove from cache immediately (optimistic update)
      queryClient.setQueryData(['alerts', user?.id], (old: Alert[] | undefined) => {
        console.log('[Alerts] Current cache before delete:', old);
        if (!old) return [];
        const updated = old.filter(alert => alert.id !== id);
        console.log('[Alerts] Updated cache after delete:', updated);
        return updated;
      });
      
      toast({ title: 'Alerta removido', description: 'O alerta foi removido com sucesso' });
      
      // DO NOT refetch - trust the optimistic update
      // The delete was successful on the server
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[Alerts] Error deleting alert:', error);
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['alerts', user?.id] });
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
                    {availableCurrencies.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
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
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(alert)} className="text-primary hover:text-primary hover:bg-primary/10">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAlert(alert.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Alert Dialog */}
      <Dialog open={isEditing} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Alerta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select value={editAlert.currency} onValueChange={(v) => setEditAlert(prev => ({ ...prev, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço Alvo (R$)</Label>
              <Input type="number" step="0.01" placeholder="5.50" value={editAlert.target_price} onChange={(e) => setEditAlert(prev => ({ ...prev, target_price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tolerância (%)</Label>
              <Input type="number" step="1" placeholder="5" value={editAlert.tolerance} onChange={(e) => setEditAlert(prev => ({ ...prev, tolerance: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCloseEditDialog}>Cancelar</Button>
            <Button onClick={handleUpdateAlert} className="bg-gradient-gold text-primary-foreground hover:opacity-90">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
