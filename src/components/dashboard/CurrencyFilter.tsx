import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CurrencyFilterProps {
  currencies: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

const currencyInfo: Record<string, { flag: string; label: string }> = {
  'USD/BRL': { flag: '🇺🇸', label: 'Dólar' },
  'EUR/BRL': { flag: '🇪🇺', label: 'Euro' },
  'CNY/BRL': { flag: '🇨🇳', label: 'Yuan' },
  'GBP/BRL': { flag: '🇬🇧', label: 'Libra' },
  'JPY/BRL': { flag: '🇯🇵', label: 'Iene' },
  'ARS/BRL': { flag: '🇦🇷', label: 'Peso AR' },
  'AUD/BRL': { flag: '🇦🇺', label: 'Dólar AU' },
  'RUB/BRL': { flag: '🇷🇺', label: 'Rublo' },
  'INR/BRL': { flag: '🇮🇳', label: 'Rupia' },
};

export function CurrencyFilter({ currencies, selected, onSelectionChange }: CurrencyFilterProps) {
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2">Filtrar:</span>
      
      {currencies.map((currency) => {
        const info = currencyInfo[currency] || { flag: '💱', label: currency };
        const isSelected = selected.includes(currency);
        
        return (
          <Button
            key={currency}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => toggleCurrency(currency)}
            className={cn(
              "gap-2 transition-all",
              isSelected && "bg-primary text-primary-foreground",
              !isSelected && "bg-secondary/50 hover:bg-secondary"
            )}
          >
            <span>{info.flag}</span>
            <span>{info.label}</span>
            {isSelected && <Check className="h-3 w-3" />}
          </Button>
        );
      })}
      
      {selected.length < currencies.length && (
        <Button
          variant="ghost"
          size="sm"
          onClick={selectAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Mostrar todos
        </Button>
      )}
    </div>
  );
}
