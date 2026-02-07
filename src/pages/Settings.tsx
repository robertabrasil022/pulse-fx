import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCommoditySettings } from '@/hooks/useDashboardData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EditableSettingCard } from '@/components/settings/EditableSettingCard';
import { DeleteConfirmDialog } from '@/components/settings/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Wheat, Drumstick, Droplets, Bell, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { CommoditySetting } from '@/types/database';

const commodityOptions = [
  { value: 'Grains', label: 'Grãos', icon: Wheat },
  { value: 'Meat', label: 'Carnes', icon: Drumstick },
  { value: 'Oil', label: 'Óleo', icon: Droplets },
];

const currencyOptions = [
  { value: 'USD/BRL', label: 'USD/BRL', flag: '🇺🇸' },
  { value: 'EUR/BRL', label: 'EUR/BRL', flag: '🇪🇺' },
  { value: 'CNY/BRL', label: 'CNY/BRL', flag: '🇨🇳' },
];

const thresholdPresets = [
  { label: 'Conservador', value: '3', description: '±3%' },
  { label: 'Moderado', value: '5', description: '±5%' },
  { label: 'Agressivo', value: '10', description: '±10%' },
];

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { data: settings = [], isLoading } = useCommoditySettings(user?.id);
  const [newSetting, setNewSetting] = useState({
    asset_name: '',
    target_currency: '',
    target_price: '',
    alert_threshold: '5',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect check after all hooks
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

  const handleAddSetting = async () => {
    if (!newSetting.asset_name || !newSetting.target_currency) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, selecione uma commodity e um par de moedas',
        variant: 'destructive',
      });
      return;
    }

    // Validate threshold
    const threshold = parseFloat(newSetting.alert_threshold);
    if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
      toast({
        title: 'Limite inválido',
        description: 'O limite de alerta deve estar entre 0.1% e 100%',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('commodity_settings').insert({
        user_id: user!.id,
        asset_name: newSetting.asset_name,
        target_currency: newSetting.target_currency,
        target_price: newSetting.target_price ? parseFloat(newSetting.target_price) : null,
        alert_threshold: threshold,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Já existe',
            description: 'Esta combinação de commodity/moeda já existe',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Configuração salva com sucesso' });
        setNewSetting({ asset_name: '', target_currency: '', target_price: '', alert_threshold: '5' });
        queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar configuração',
        description: 'Por favor, tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSetting = async (id: string, data: Partial<CommoditySetting>) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('commodity_settings')
        .update({
          asset_name: data.asset_name,
          target_currency: data.target_currency,
          target_price: data.target_price,
          alert_threshold: data.alert_threshold,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Configuração atualizada' });
      queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Por favor, tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (setting: CommoditySetting) => {
    const commodity = commodityOptions.find(c => c.value === setting.asset_name);
    setDeleteTarget({
      id: setting.id,
      name: `${commodity?.label || setting.asset_name} • ${setting.target_currency}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    try {
      const { error } = await supabase.from('commodity_settings').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Configuração excluída' });
      queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
    } catch (error) {
      toast({
        title: 'Erro ao excluir configuração',
        description: 'Por favor, tente novamente',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const getCommodityLabel = (value: string) => {
    const commodity = commodityOptions.find(c => c.value === value);
    return commodity?.label || value;
  };

  // Preview text for alert
  const getAlertPreview = () => {
    if (!newSetting.asset_name || !newSetting.target_currency) return null;
    const commodity = getCommodityLabel(newSetting.asset_name);
    const threshold = newSetting.alert_threshold || '5';
    return `Você será alertado quando ${newSetting.target_currency} variar ±${threshold}% para ${commodity}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          
          <h2 className="text-2xl font-bold text-foreground mb-1">Configurações de Alertas</h2>
          <p className="text-sm text-muted-foreground">
            Configure seus preços-alvo e limites de variação para receber alertas personalizados
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add New Setting */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Adicionar Novo Alerta</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Commodity</Label>
                  <Select
                    value={newSetting.asset_name}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, asset_name: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione a commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Par de Moedas</Label>
                  <Select
                    value={newSetting.target_currency}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, target_currency: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o par" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <span>{opt.flag}</span>
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preço-Alvo (opcional)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="ex: 5.0000"
                    value={newSetting.target_price}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, target_price: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Limite de Alerta (%)</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      placeholder="5"
                      value={newSetting.alert_threshold}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, alert_threshold: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    {/* Presets */}
                    <div className="flex gap-2">
                      {thresholdPresets.map((preset) => (
                        <Button
                          key={preset.value}
                          type="button"
                          variant={newSetting.alert_threshold === preset.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewSetting(prev => ({ ...prev, alert_threshold: preset.value }))}
                          className="text-xs flex-1"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Preview */}
              {getAlertPreview() && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {getAlertPreview()}
                  </p>
                </div>
              )}

              <Button
                onClick={handleAddSetting}
                disabled={isSaving}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar Alerta
              </Button>
            </div>

            {/* Existing Settings */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Seus Alertas</h3>
                <span className="text-xs text-muted-foreground">
                  {settings.length} {settings.length === 1 ? 'alerta configurado' : 'alertas configurados'}
                </span>
              </div>
              
              {settings.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum alerta configurado ainda.
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Adicione um acima para começar a receber notificações.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => (
                    <EditableSettingCard
                      key={setting.id}
                      setting={setting}
                      onUpdate={handleUpdateSetting}
                      onDelete={() => handleDeleteClick(setting)}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Help text */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-primary font-medium">Dica:</span> Configure alertas para 
                diferentes commodities e moedas. Você será notificado quando as taxas de câmbio 
                variarem além do limite definido, ajudando você a identificar oportunidades de compra.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteTarget?.name || ''}
      />
    </div>
  );
}
