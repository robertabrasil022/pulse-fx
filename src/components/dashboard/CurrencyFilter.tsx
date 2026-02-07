import { useState } from 'react';
import { Check, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CurrencyFilterProps {
  currencies: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

const currencyInfo: Record<string, { flag: string; label: string }> = {
  'USD/BRL': { flag: '🇺🇸', label: 'Dólar (USD)' },
  'EUR/BRL': { flag: '🇪🇺', label: 'Euro (EUR)' },
  'CNY/BRL': { flag: '🇨🇳', label: 'Yuan (CNY)' },
  'GBP/BRL': { flag: '🇬🇧', label: 'Libra (GBP)' },
  'JPY/BRL': { flag: '🇯🇵', label: 'Iene (JPY)' },
  'ARS/BRL': { flag: '🇦🇷', label: 'Peso AR (ARS)' },
  'AUD/BRL': { flag: '🇦🇺', label: 'Dólar AU (AUD)' },
  'RUB/BRL': { flag: '🇷🇺', label: 'Rublo (RUB)' },
  'INR/BRL': { flag: '🇮🇳', label: 'Rupia (INR)' },
};

export function CurrencyFilter({ currencies, selected, onSelectionChange }: CurrencyFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleCurrency = (currency: string) => {
    if (selected.includes(currency)) {
      // Don't allow deselecting all
      if (selected.length > 1) {
        onSelectionChange(selected.filter(c => c !== currency));
      }
    } else {
      onSelectionChange([...selected, currency]);
    }
  };

  const selectAll = () => {
    onSelectionChange(currencies);
  };

  const selectNone = () => {
    // Keep at least the first 3
    onSelectionChange(currencies.slice(0, 3));
  };

  // Get summary text
  const getSummaryText = () => {
    if (selected.length === currencies.length) {
      return 'Todas as moedas';
    }
    if (selected.length <= 2) {
      return selected.map(c => currencyInfo[c]?.flag || '💱').join(' ');
    }
    return `${selected.length} moedas`;
  };

  // Show selected flags preview
  const getSelectedPreview = () => {
    return selected.slice(0, 4).map(c => currencyInfo[c]?.flag || '💱').join('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-secondary/50 hover:bg-secondary border-border"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">{getSummaryText()}</span>
          <span className="sm:hidden">{getSelectedPreview()}</span>
          {selected.length < currencies.length && (
            <span className="text-xs text-muted-foreground">
              ({selected.length}/{currencies.length})
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-0 bg-card border-border z-50" 
        align="end"
        sideOffset={8}
      >
        {/* Header with actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">Filtrar moedas</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-6 px-2 text-xs"
              disabled={selected.length === currencies.length}
            >
              Todas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectNone}
              className="h-6 px-2 text-xs"
              disabled={selected.length === 3}
            >
              Limpar
            </Button>
          </div>
        </div>

        {/* Currency list */}
        <div className="max-h-64 overflow-y-auto py-1">
          {currencies.map((currency) => {
            const info = currencyInfo[currency] || { flag: '💱', label: currency };
            const isSelected = selected.includes(currency);
            
            return (
              <button
                key={currency}
                onClick={() => toggleCurrency(currency)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  "hover:bg-secondary/50",
                  isSelected && "bg-primary/5"
                )}
              >
                <span className="text-base">{info.flag}</span>
                <span className="flex-1 text-left text-foreground">{info.label}</span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-3 py-2 border-t border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground">
            {selected.length} de {currencies.length} selecionadas
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
