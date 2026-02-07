import { useState } from 'react';
import { Pencil, Trash2, Check, X, Loader2, Wheat, Drumstick, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommoditySetting } from '@/types/database';
import { cn } from '@/lib/utils';

const commodityOptions = [
  { value: 'Grains', label: 'Grãos', icon: Wheat },
  { value: 'Meat', label: 'Carnes', icon: Drumstick },
  { value: 'Oil', label: 'Óleo', icon: Droplets },
];

const currencyOptions = [
  { value: 'USD/BRL', label: 'USD/BRL', flag: '🇺🇸' },
  { value: 'EUR/BRL', label: 'EUR/BRL', flag: '🇪🇺' },
  { value: 'CNY/BRL', label: 'CNY/BRL', flag: '🇨🇳' },
  { value: 'GBP/BRL', label: 'GBP/BRL', flag: '🇬🇧' },
  { value: 'JPY/BRL', label: 'JPY/BRL', flag: '🇯🇵' },
  { value: 'ARS/BRL', label: 'ARS/BRL', flag: '🇦🇷' },
  { value: 'AUD/BRL', label: 'AUD/BRL', flag: '🇦🇺' },
  { value: 'RUB/BRL', label: 'RUB/BRL', flag: '🇷🇺' },
  { value: 'INR/BRL', label: 'INR/BRL', flag: '🇮🇳' },
];

interface EditableSettingCardProps {
  setting: CommoditySetting;
  onUpdate: (id: string, data: Partial<CommoditySetting>) => Promise<void>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export function EditableSettingCard({ setting, onUpdate, onDelete, isUpdating }: EditableSettingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    asset_name: setting.asset_name,
    target_currency: setting.target_currency,
    target_price: setting.target_price?.toString() || '',
    alert_threshold: setting.alert_threshold.toString(),
  });

  const commodity = commodityOptions.find(c => c.value === setting.asset_name);
  const currency = currencyOptions.find(c => c.value === setting.target_currency);
  const Icon = commodity?.icon || Wheat;

  const handleSave = async () => {
    await onUpdate(setting.id, {
      asset_name: editData.asset_name,
      target_currency: editData.target_currency,
      target_price: editData.target_price ? parseFloat(editData.target_price) : null,
      alert_threshold: parseFloat(editData.alert_threshold) || 5,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      asset_name: setting.asset_name,
      target_currency: setting.target_currency,
      target_price: setting.target_price?.toString() || '',
      alert_threshold: setting.alert_threshold.toString(),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-lg bg-secondary/50 border-2 border-primary/30 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Commodity</Label>
            <Select
              value={editData.asset_name}
              onValueChange={(value) => setEditData(prev => ({ ...prev, asset_name: value }))}
            >
              <SelectTrigger className="bg-secondary border-border h-9">
                <SelectValue />
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
            <Label className="text-xs">Par de Moedas</Label>
            <Select
              value={editData.target_currency}
              onValueChange={(value) => setEditData(prev => ({ ...prev, target_currency: value }))}
            >
              <SelectTrigger className="bg-secondary border-border h-9">
                <SelectValue />
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
            <Label className="text-xs">Preço-Alvo</Label>
            <Input
              type="number"
              step="0.0001"
              placeholder="ex: 5.0000"
              value={editData.target_price}
              onChange={(e) => setEditData(prev => ({ ...prev, target_price: e.target.value }))}
              className="bg-secondary border-border h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Limite de Alerta (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              value={editData.alert_threshold}
              onChange={(e) => setEditData(prev => ({ ...prev, alert_threshold: e.target.value }))}
              className="bg-secondary border-border h-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            className="gap-1 bg-primary text-primary-foreground"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground flex items-center gap-2">
            {commodity?.label || setting.asset_name}
            <span className="text-muted-foreground">•</span>
            <span className="flex items-center gap-1">
              {currency?.flag}
              {setting.target_currency}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Preço-alvo: {setting.target_price ? Number(setting.target_price).toFixed(4) : '—'} | 
            Alerta: ±{setting.alert_threshold}%
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(setting.id)}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
