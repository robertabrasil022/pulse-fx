import { useState, useMemo } from 'react';
import { ArrowRightLeft, TrendingUp, TrendingDown, Activity, Minus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FxRate } from '@/types/database';
import { cn } from '@/lib/utils';
import { useFormatting } from '@/hooks/useFormatting';

interface ConversionPanelProps {
  rates: FxRate[];
  currencies: string[];
}

export function ConversionPanel({ rates, currencies }: ConversionPanelProps) {
  const { formatNumber, formatPercentage } = useFormatting();
  const [amount, setAmount] = useState<string>('1000');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD/BRL');
  const [isReversed, setIsReversed] = useState(false); // false = foreign→BRL, true = BRL→foreign

  // Get latest rate for selected currency
  const latestRate = useMemo(() => {
    const currencyRates = rates.filter(r => r.code === selectedCurrency);
    if (currencyRates.length === 0) return null;
    return currencyRates.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }, [rates, selectedCurrency]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const currencyRates = rates
      .filter(r => r.code === selectedCurrency)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (currencyRates.length === 0) {
      return { change24h: 0, change7d: 0, change30d: 0, volatility7d: 0 };
    }

    const current = currencyRates[0]?.bid_value || 0;
    const rate24h = currencyRates[1]?.bid_value || current;
    const rate7d = currencyRates[Math.min(7, currencyRates.length - 1)]?.bid_value || current;
    const rate30d = currencyRates[Math.min(30, currencyRates.length - 1)]?.bid_value || current;

    const change24h = current && rate24h ? ((current - rate24h) / rate24h) * 100 : 0;
    const change7d = current && rate7d ? ((current - rate7d) / rate7d) * 100 : 0;
    const change30d = current && rate30d ? ((current - rate30d) / rate30d) * 100 : 0;

    // Calculate volatility (standard deviation of daily changes)
    const last7 = currencyRates.slice(0, Math.min(7, currencyRates.length));
    const changes = last7.slice(1).map((r, i) => {
      const prev = last7[i].bid_value;
      return prev ? ((r.bid_value - prev) / prev) * 100 : 0;
    });
    const mean = changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
    const variance = changes.length ? changes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / changes.length : 0;
    const volatility7d = Math.sqrt(variance);

    return { change24h, change7d, change30d, volatility7d };
  }, [rates, selectedCurrency]);

  // Conversion calculation - bidirectional
  const { convertedAmount, rate, rateType } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (!latestRate) return { convertedAmount: 0, rate: 0, rateType: '' };
    
    if (isReversed) {
      // BRL → Foreign: use ask rate (selling BRL, buying foreign)
      const converted = latestRate.ask_value > 0 ? numAmount / latestRate.ask_value : 0;
      return { 
        convertedAmount: converted, 
        rate: latestRate.ask_value,
        rateType: 'venda'
      };
    } else {
      // Foreign → BRL: use bid rate (selling foreign, buying BRL)
      return { 
        convertedAmount: numAmount * latestRate.bid_value, 
        rate: latestRate.bid_value,
        rateType: 'compra'
      };
    }
  }, [amount, latestRate, isReversed]);


  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4" />;
    if (value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const currencyBase = selectedCurrency.split('/')[0];
  const fromCurrency = isReversed ? 'BRL' : currencyBase;
  const toCurrency = isReversed ? currencyBase : 'BRL';

  const formatResult = (value: number) => {
    // Use custom formatting with proper decimals for foreign currencies
    return formatNumber(value);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'BRL': 'R$',
      'USD': '$',
      'EUR': '€',
      'CNY': '¥',
      'GBP': '£',
      'JPY': '¥',
      'ARS': '$',
      'AUD': 'A$',
      'RUB': '₽',
      'INR': '₹',
    };
    return symbols[currency] || currency;
  };

  return (
    <Card className="glass-card border-primary/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-gold-subtle opacity-50" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Painel de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Conversion Form */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto,1fr] gap-4 items-end">
          {/* Input Amount */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-lg">{getCurrencySymbol(fromCurrency)}</span>
              Valor em {fromCurrency}
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="text-lg tabular-nums"
            />
          </div>
          
          {/* Currency Selector */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Par</label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground invisible">Inverter</label>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsReversed(!isReversed)}
              className="border-primary/30 hover:border-primary hover:bg-primary/10"
              title="Inverter conversão"
            >
              <RefreshCw className={cn(
                "h-4 w-4 transition-transform duration-300",
                isReversed && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-lg">{getCurrencySymbol(toCurrency)}</span>
              Resultado em {toCurrency}
            </label>
            <div className="h-10 px-3 flex items-center bg-primary/10 border border-primary/20 rounded-md">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {getCurrencySymbol(toCurrency)} {formatResult(convertedAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Rate Info */}
        {latestRate && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground">
              Taxa de {rateType}: <span className="font-medium text-foreground">R$ {formatNumber(rate)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground">
              Compra: <span className="font-medium text-foreground">R$ {formatNumber(latestRate.bid_value)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground">
              Venda: <span className="font-medium text-foreground">R$ {formatNumber(latestRate.ask_value)}</span>
            </div>
          </div>
        )}

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {getChangeIcon(kpis.change24h)}
              <span>Variação 24h</span>
            </div>
            <span className={cn('text-xl font-bold tabular-nums', getChangeColor(kpis.change24h))}>
              {formatPercentage(kpis.change24h)}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {getChangeIcon(kpis.change7d)}
              <span>Variação 7d</span>
            </div>
            <span className={cn('text-xl font-bold tabular-nums', getChangeColor(kpis.change7d))}>
              {formatPercentage(kpis.change7d)}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {getChangeIcon(kpis.change30d)}
              <span>Variação 30d</span>
            </div>
            <span className={cn('text-xl font-bold tabular-nums', getChangeColor(kpis.change30d))}>
              {formatPercentage(kpis.change30d)}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span>Volatilidade 7d</span>
            </div>
            <span className={cn(
              'text-xl font-bold tabular-nums',
              kpis.volatility7d > 2 ? 'text-warning' : 'text-foreground'
            )}>
              {formatPercentage(kpis.volatility7d)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
