import { useState, useMemo } from 'react';
import { Calculator, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { FxRate } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface OperationsCalculatorProps {
  rates: FxRate[];
  availableCurrencies: string[];
}

const COMMODITIES = [
  { id: 'grains', name: 'Grãos', unit: 'tonelada' },
  { id: 'meat', name: 'Carnes', unit: 'tonelada' },
  { id: 'oil', name: 'Óleo', unit: 'barril' },
  { id: 'sugar', name: 'Açúcar', unit: 'tonelada' },
  { id: 'coffee', name: 'Café', unit: 'saca (60kg)' },
  { id: 'soy', name: 'Soja', unit: 'tonelada' },
];

// Currency metadata for symbols and display names
const CURRENCY_META: Record<string, { symbol: string; name: string }> = {
  'USD/BRL': { symbol: '$', name: 'Dólar (USD)' },
  'EUR/BRL': { symbol: '€', name: 'Euro (EUR)' },
  'CNY/BRL': { symbol: '¥', name: 'Yuan (CNY)' },
  'GBP/BRL': { symbol: '£', name: 'Libra (GBP)' },
  'JPY/BRL': { symbol: '¥', name: 'Iene (JPY)' },
  'ARS/BRL': { symbol: '$', name: 'Peso Argentino (ARS)' },
  'AUD/BRL': { symbol: 'A$', name: 'Dólar Australiano (AUD)' },
  'RUB/BRL': { symbol: '₽', name: 'Rublo (RUB)' },
  'INR/BRL': { symbol: '₹', name: 'Rupia Indiana (INR)' },
};

export function OperationsCalculator({ rates, availableCurrencies }: OperationsCalculatorProps) {
  const [commodity, setCommodity] = useState(COMMODITIES[0].id);
  const [quantity, setQuantity] = useState<string>('100');
  const [unitPrice, setUnitPrice] = useState<string>('500');
  const [sourceCurrency, setSourceCurrency] = useState(availableCurrencies[0] || 'USD/BRL');

  // Build currencies list from available currencies
  const currencies = useMemo(() => 
    availableCurrencies.map(code => ({
      code,
      ...CURRENCY_META[code] || { symbol: code.split('/')[0], name: code }
    })),
    [availableCurrencies]
  );

  // Get latest rate for each currency
  const getLatestRate = (code: string): FxRate | null => {
    const currencyRates = rates.filter(r => r.code === code);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  };

  const selectedCommodity = COMMODITIES.find(c => c.id === commodity);
  const selectedCurrency = currencies.find(c => c.code === sourceCurrency);
  const currentRate = getLatestRate(sourceCurrency);

  const calculations = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const totalInSource = qty * price;

    if (!currentRate) {
      return {
        totalInSource,
        totalInBRL: 0,
        comparisons: [],
      };
    }

    const totalInBRL = totalInSource * currentRate.bid_value;

    // Compare with other currencies
    const comparisons = currencies
      .filter(c => c.code !== sourceCurrency)
      .map(currency => {
        const rate = getLatestRate(currency.code);
        if (!rate) return null;

        // Calculate what the same BRL amount would cost in this currency
        const equivalentInCurrency = totalInBRL / rate.bid_value;
        const difference = equivalentInCurrency - totalInSource;
        const percentDiff = (difference / totalInSource) * 100;

        return {
          currency,
          rate,
          equivalentAmount: equivalentInCurrency,
          difference,
          percentDiff,
          isCheaper: difference < 0,
        };
      })
      .filter(Boolean);

    return {
      totalInSource,
      totalInBRL,
      comparisons,
    };
  }, [quantity, unitPrice, sourceCurrency, currentRate, rates, currencies]);

  const formatCurrency = (value: number, symbol: string = 'R$') => {
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Calculadora de Operações</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Simule o custo de compras de commodities em diferentes moedas
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commodity" className="text-xs text-muted-foreground">
              Commodity
            </Label>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger id="commodity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMODITIES.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-xs text-muted-foreground">
              Quantidade ({selectedCommodity?.unit})
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="text-xs text-muted-foreground">
              Preço Unitário
            </Label>
            <Input
              id="unitPrice"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="500"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-xs text-muted-foreground">
              Moeda de Origem
            </Label>
            <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Result */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Custo Total da Operação</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(calculations.totalInBRL)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({formatCurrency(calculations.totalInSource, selectedCurrency?.symbol)} × {currentRate?.bid_value.toFixed(4) || '—'})
                </span>
              </div>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-primary/50" />
          </div>
          
          {currentRate && (
            <p className="text-xs text-muted-foreground mt-2">
              Taxa atual: 1 {selectedCurrency?.symbol} = R$ {currentRate.bid_value.toFixed(4)}
              <span className={cn(
                "ml-2",
                currentRate.pct_change > 0 ? "text-destructive" : "text-success"
              )}>
                ({currentRate.pct_change > 0 ? '+' : ''}{currentRate.pct_change.toFixed(2)}%)
              </span>
            </p>
          )}
        </div>

        {/* Currency Comparisons */}
        {calculations.comparisons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">
              Comparativo com Outras Moedas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {calculations.comparisons.map((comp: any) => (
                <div
                  key={comp.currency.code}
                  className={cn(
                    "rounded-lg p-3 border",
                    comp.isCheaper 
                      ? "bg-success/5 border-success/20" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {comp.currency.symbol} {comp.currency.name}
                    </span>
                    {comp.isCheaper ? (
                      <TrendingDown className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(comp.equivalentAmount, comp.currency.symbol)}
                  </p>
                  <p className={cn(
                    "text-xs mt-1",
                    comp.isCheaper ? "text-success" : "text-muted-foreground"
                  )}>
                    {comp.isCheaper ? 'Economia de' : 'Custo adicional de'}{' '}
                    {Math.abs(comp.percentDiff).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentRate && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Selecione uma moeda com taxas disponíveis para calcular
          </p>
        )}
      </div>
    </div>
  );
}
