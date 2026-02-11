import { Navigate } from 'react-router-dom';
import { Loader2, Bell, Clock, Check, Eye, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PRESET_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function Preferences() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoading: prefsLoading, updatePreferencesAsync, isUpdating } = usePreferences();
  const { toast } = useToast();

  // Use available preset currencies
  const allCurrencies = PRESET_CURRENCIES;

  const handleWatchlistToggle = async (currency: string) => {
    if (!preferences) return;
    
    const newWatchlist = preferences.watchlist.includes(currency)
      ? preferences.watchlist.filter(c => c !== currency)
      : [...preferences.watchlist, currency];
    
    try {
      await updatePreferencesAsync({ watchlist: newWatchlist });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a watchlist',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationChange = async (field: 'notifications_email' | 'notifications_push' | 'quiet_hours_enabled', value: boolean) => {
    try {
      await updatePreferencesAsync({ [field]: value });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações',
        variant: 'destructive',
      });
    }
  };

  const handleQuietHoursChange = async (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    try {
      await updatePreferencesAsync({ [field]: value });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o horário',
        variant: 'destructive',
      });
    }
  };

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading || prefsLoading) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preferências</h1>
            <p className="text-sm text-muted-foreground">
              Personalize sua experiência no PulseFX
            </p>
          </div>
          {isUpdating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </div>
          )}
        </div>

        {/* Watchlist */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Watchlist de Moedas
            </CardTitle>
            <CardDescription>
              Selecione as moedas que deseja monitorar no dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allCurrencies.map(currency => (
                <label
                  key={currency}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    preferences?.watchlist.includes(currency)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={preferences?.watchlist.includes(currency) || false}
                    onCheckedChange={() => handleWatchlistToggle(currency)}
                  />
                  <span className="text-sm font-medium">{currency}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como deseja receber alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receber alertas por email</p>
              </div>
              <Switch
                checked={preferences?.notifications_email || false}
                onCheckedChange={(checked) => handleNotificationChange('notifications_email', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receber alertas no navegador</p>
              </div>
              <Switch
                checked={preferences?.notifications_push || false}
                onCheckedChange={(checked) => handleNotificationChange('notifications_push', checked)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário Silencioso
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pausar notificações durante um período
                  </p>
                </div>
                <Switch
                  checked={preferences?.quiet_hours_enabled || false}
                  onCheckedChange={(checked) => handleNotificationChange('quiet_hours_enabled', checked)}
                />
              </div>

              {preferences?.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Início</Label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_start?.slice(0, 5) || '22:00'}
                      onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value + ':00')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Fim</Label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_end?.slice(0, 5) || '08:00'}
                      onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value + ':00')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info about theme */}
        <p className="text-sm text-muted-foreground text-center">
          💡 Para alterar o tema (claro/escuro), use o botão na barra de navegação superior.
        </p>
      </div>
    </AppLayout>
  );
}
