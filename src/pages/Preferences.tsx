import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFormatting } from '@/hooks/useFormatting';
import { usePreferences, UserPreferences } from '@/hooks/usePreferences';
import { Calendar, Eye, Hash, Loader2, Monitor, RefreshCw } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const PRESET_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function Preferences() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, isLoading: prefsLoading, updatePreferencesAsync, isUpdating } = usePreferences();
  const { toast } = useToast();
  const { formatNumber, formatDate } = useFormatting();

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

  type DisplayField = keyof Pick<UserPreferences, 'number_format' | 'decimal_places' | 'date_format' | 'auto_refresh_interval'>;
  type DisplayValue = UserPreferences[DisplayField];

  const handleDisplayChange = async (field: DisplayField, value: DisplayValue) => {
    try {
      await updatePreferencesAsync({ [field]: value });
      toast({
        title: 'Configuração atualizada',
        description: 'Suas preferências de visualização foram salvas',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações',
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

        {/* Display & Formatting Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Personalização de Visualização
            </CardTitle>
            <CardDescription>
              Configure como os dados são exibidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Label>Formato de Números</Label>
              </div>
              <Select
                value={preferences?.number_format || 'pt-BR'}
                onValueChange={(value) => handleDisplayChange('number_format', value as UserPreferences['number_format'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">
                    <div className="flex flex-col items-start">
                      <span>Brasileiro (pt-BR)</span>
                      <span className="text-xs text-muted-foreground">{formatNumber(5234.5)}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en-US">
                    <div className="flex flex-col items-start">
                      <span>Internacional (en-US)</span>
                      <span className="text-xs text-muted-foreground">5,234.50</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Decimal Places */}
            <div className="space-y-3">
              <Label>Casas Decimais</Label>
              <Select
                value={String(preferences?.decimal_places || 2)}
                onValueChange={(value) => handleDisplayChange('decimal_places', Number.parseInt(value, 10) as UserPreferences['decimal_places'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">
                    <div className="flex flex-col items-start">
                      <span>2 decimais</span>
                      <span className="text-xs text-muted-foreground">R$ 5,23</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex flex-col items-start">
                      <span>4 decimais</span>
                      <span className="text-xs text-muted-foreground">R$ 5,2345</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="6">
                    <div className="flex flex-col items-start">
                      <span>6 decimais (precisão máxima)</span>
                      <span className="text-xs text-muted-foreground">R$ 5,234567</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Format */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label>Formato de Data</Label>
              </div>
              <Select
                value={preferences?.date_format || 'DD/MM/YYYY'}
                onValueChange={(value) => handleDisplayChange('date_format', value as UserPreferences['date_format'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">
                    <div className="flex flex-col items-start">
                      <span>DD/MM/YYYY</span>
                      <span className="text-xs text-muted-foreground">{formatDate(new Date())}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MM/DD/YYYY">
                    <div className="flex flex-col items-start">
                      <span>MM/DD/YYYY</span>
                      <span className="text-xs text-muted-foreground">11/02/2026</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="YYYY-MM-DD">
                    <div className="flex flex-col items-start">
                      <span>YYYY-MM-DD (ISO)</span>
                      <span className="text-xs text-muted-foreground">2026-02-11</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border pt-4 space-y-6">
              {/* Auto Refresh */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <Label>Atualização Automática</Label>
                </div>
                <Select
                  value={String(preferences?.auto_refresh_interval || 5)}
                  onValueChange={(value) => handleDisplayChange('auto_refresh_interval', Number.parseInt(value, 10) as UserPreferences['auto_refresh_interval'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Desativada</SelectItem>
                    <SelectItem value="1">A cada 1 minuto</SelectItem>
                    <SelectItem value="5">A cada 5 minutos</SelectItem>
                    <SelectItem value="15">A cada 15 minutos</SelectItem>
                    <SelectItem value="30">A cada 30 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          💡 Para alterar o tema (claro/escuro), use o botão na barra de navegação superior.
        </p>
      </div>
    </AppLayout>
  );
}
