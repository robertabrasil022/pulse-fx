import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommoditySettings, useFxRates } from '@/hooks/useDashboardData';
import { createCommoditySetting, deleteCommoditySetting } from '@/repositories/commodityRepository';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];
const COMMODITIES = ['Grãos', 'Carnes', 'Óleo', 'Açúcar', 'Café', 'Soja'];

export default function Alerts() {
  const { user, loading: authLoading } = useAuth();
  const { data: settings = [], isLoading: settingsLoading } = useCommoditySettings(user?.id);
  const { data: rates = [] } = useFxRates();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    asset_name: '',
    target_currency: 'USD/BRL',
    target_price: '',
    alert_threshold: '5',
  });

  const handleCreateAlert = async () => {
    if (!user || !newAlert.asset_name || !newAlert.target_price) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from('commodity_settings').insert({
        user_id: user.id,
        asset_name: newAlert.asset_name,
        target_currency: newAlert.target_currency,
        target_price: parseFloat(newAlert.target_price),
        alert_threshold: parseFloat(newAlert.alert_threshold),
      });

      if (error) throw error;

      toast({
        title: 'Alerta criado',
        description: `Alerta para ${newAlert.asset_name} configurado com sucesso`,
      });

      setNewAlert({
        asset_name: '',
        target_currency: 'USD/BRL',
        target_price: '',
        alert_threshold: '5',
      });

      queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o alerta',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const { error } = await supabase.from('commodity_settings').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Alerta removido',
        description: 'O alerta foi removido com sucesso',
      });

      queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o alerta',
        variant: 'destructive',
      });
    }
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
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Configure alertas de preço para commodities e moedas
          </p>
        </div>

        {/* Create Alert Card */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Criar Novo Alerta
            </CardTitle>
            <CardDescription>
              Receba notificações quando a taxa atingir o valor desejado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commodity</Label>
                <Select 
                  value={newAlert.asset_name} 
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, asset_name: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMODITIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select 
                  value={newAlert.target_currency} 
                  onValueChange={(v) => setNewAlert(prev => ({ ...prev, target_currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preço Alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.50"
                  value={newAlert.target_price}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, target_price: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tolerância (%)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="5"
                  value={newAlert.alert_threshold}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, alert_threshold: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateAlert} 
              disabled={isCreating}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Criar Alerta
            </Button>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : settings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum alerta configurado</p>
                <p className="text-sm text-muted-foreground">Crie seu primeiro alerta acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {setting.asset_name} • {setting.target_currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Preço alvo: R$ {setting.target_price?.toFixed(2)} (±{setting.alert_threshold}%)
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(setting.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
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
