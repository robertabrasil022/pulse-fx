import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Settings, Loader2, Moon, Sun, Monitor, Bell, Clock, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ALL_CURRENCIES = ['USD/BRL', 'EUR/BRL', 'CNY/BRL', 'GBP/BRL', 'JPY/BRL', 'ARS/BRL', 'AUD/BRL', 'RUB/BRL', 'INR/BRL'];

export default function Preferences() {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Local state for preferences (would be saved to Supabase in production)
  const [watchlist, setWatchlist] = useState<string[]>(['USD/BRL', 'EUR/BRL', 'CNY/BRL']);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
  });

  const handleWatchlistToggle = (currency: string) => {
    setWatchlist(prev => 
      prev.includes(currency) 
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  };

  const handleSave = () => {
    toast({
      title: 'Preferências salvas',
      description: 'Suas configurações foram atualizadas com sucesso',
    });
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
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preferências</h1>
          <p className="text-sm text-muted-foreground">
            Personalize sua experiência no PulseFX
          </p>
        </div>

        {/* Theme Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Escolha o tema de exibição do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="light"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Claro</span>
              </Label>

              <Label
                htmlFor="dark"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Escuro</span>
              </Label>

              <Label
                htmlFor="system"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="system" id="system" className="sr-only" />
                <Monitor className="h-6 w-6" />
                <span className="text-sm font-medium">Sistema</span>
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Watchlist de Moedas</CardTitle>
            <CardDescription>
              Selecione as moedas que deseja monitorar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_CURRENCIES.map(currency => (
                <label
                  key={currency}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    watchlist.includes(currency)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Checkbox
                    checked={watchlist.includes(currency)}
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
                checked={notifications.email}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">Receber alertas no navegador</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, push: checked }))
                }
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
                  checked={notifications.quietHours}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, quietHours: checked }))
                  }
                />
              </div>

              {notifications.quietHours && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Início</Label>
                    <input
                      type="time"
                      value={notifications.quietStart}
                      onChange={(e) => 
                        setNotifications(prev => ({ ...prev, quietStart: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Fim</Label>
                    <input
                      type="time"
                      value={notifications.quietEnd}
                      onChange={(e) => 
                        setNotifications(prev => ({ ...prev, quietEnd: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
        >
          <Check className="h-4 w-4 mr-2" />
          Salvar Preferências
        </Button>
      </div>
    </AppLayout>
  );
}
