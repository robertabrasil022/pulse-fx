import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCommoditySettings } from '@/hooks/useDashboardData';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, Trash2, Save, Wheat, Drumstick, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const commodityOptions = [
  { value: 'Grains', label: 'Grains', icon: Wheat },
  { value: 'Meat', label: 'Meat', icon: Drumstick },
  { value: 'Oil', label: 'Oil', icon: Droplets },
];

const currencyOptions = ['USD/BRL', 'EUR/BRL', 'CNY/BRL'];

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        title: 'Missing fields',
        description: 'Please select a commodity and currency pair',
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
        alert_threshold: parseFloat(newSetting.alert_threshold),
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already exists',
            description: 'This commodity/currency combination already exists',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Setting saved successfully' });
        setNewSetting({ asset_name: '', target_currency: '', target_price: '', alert_threshold: '5' });
        queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
      }
    } catch (error) {
      toast({
        title: 'Error saving setting',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSetting = async (id: string) => {
    try {
      const { error } = await supabase.from('commodity_settings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Setting deleted' });
      queryClient.invalidateQueries({ queryKey: ['commodity-settings'] });
    } catch (error) {
      toast({
        title: 'Error deleting setting',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
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
            Back to Dashboard
          </Button>
          
          <h2 className="text-2xl font-bold text-foreground mb-1">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your target prices and alert thresholds
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Add Alert Setting</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Commodity</Label>
                  <Select
                    value={newSetting.asset_name}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, asset_name: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {commodityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency Pair</Label>
                  <Select
                    value={newSetting.target_currency}
                    onValueChange={(value) => setNewSetting(prev => ({ ...prev, target_currency: value }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Price (optional)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 5.0000"
                    value={newSetting.target_price}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, target_price: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={newSetting.alert_threshold}
                    onChange={(e) => setNewSetting(prev => ({ ...prev, alert_threshold: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddSetting}
                disabled={isSaving}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Setting
              </Button>
            </div>

            {/* Existing Settings */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Alert Settings</h3>
              
              {settings.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No settings configured yet. Add one above to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => {
                    const commodity = commodityOptions.find(c => c.value === setting.asset_name);
                    const Icon = commodity?.icon || Wheat;
                    
                    return (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-secondary">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {setting.asset_name} • {setting.target_currency}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Target: {setting.target_price ? setting.target_price.toFixed(4) : '—'} | 
                              Threshold: ±{setting.alert_threshold}%
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSetting(setting.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
