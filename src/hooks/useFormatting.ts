import { usePreferences } from '@/hooks/usePreferences';
import { useMemo } from 'react';

export function useFormatting() {
  const { preferences } = usePreferences();

  const formatters = useMemo(() => {
    const numberFormat = preferences?.number_format || 'pt-BR';
    const decimalPlaces = preferences?.decimal_places || 2;

    return {
      // Format currency values
      formatCurrency: (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        
        const locale = numberFormat === 'pt-BR' ? 'pt-BR' : 'en-US';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(value);
      },

      // Format number without currency symbol
      formatNumber: (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        
        const locale = numberFormat === 'pt-BR' ? 'pt-BR' : 'en-US';
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(value);
      },

      // Format percentage
      formatPercentage: (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-';
        
        const locale = numberFormat === 'pt-BR' ? 'pt-BR' : 'en-US';
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: 'always',
        }).format(value / 100);
      },

      // Format date
      formatDate: (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const dateFormat = preferences?.date_format || 'DD/MM/YYYY';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (dateFormat) {
          case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
          case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
          case 'DD/MM/YYYY':
          default:
            return `${day}/${month}/${year}`;
        }
      },

      // Format datetime
      formatDateTime: (date: string | Date): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const locale = numberFormat === 'pt-BR' ? 'pt-BR' : 'en-US';
        
        return new Intl.DateTimeFormat(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      },

      // Get chart period
      getChartPeriod: (): string => {
        return preferences?.chart_default_period || '7d';
      },

      // Get refresh interval in milliseconds (0 means disabled)
      getRefreshInterval: (): number => {
        const minutes = preferences?.auto_refresh_interval || 0;
        return minutes * 60 * 1000;
      },
    };
  }, [preferences?.number_format, preferences?.decimal_places, preferences?.date_format, preferences?.chart_default_period, preferences?.auto_refresh_interval]);

  return formatters;
}
