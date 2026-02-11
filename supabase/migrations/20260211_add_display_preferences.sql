-- Add display/formatting preferences to preferences table
ALTER TABLE public.preferences
ADD COLUMN IF NOT EXISTS number_format TEXT NOT NULL DEFAULT 'pt-BR' CHECK (number_format IN ('pt-BR', 'en-US')),
ADD COLUMN IF NOT EXISTS decimal_places INTEGER NOT NULL DEFAULT 2 CHECK (decimal_places IN (2, 4, 6)),
ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
ADD COLUMN IF NOT EXISTS chart_default_period TEXT NOT NULL DEFAULT '7d' CHECK (chart_default_period IN ('24h', '7d', '30d', '90d')),
ADD COLUMN IF NOT EXISTS auto_refresh_interval INTEGER NOT NULL DEFAULT 5 CHECK (auto_refresh_interval IN (0, 1, 5, 15, 30));

-- Add comment for documentation
COMMENT ON COLUMN public.preferences.number_format IS 'Number format: pt-BR (5.234,50) or en-US (5,234.50)';
COMMENT ON COLUMN public.preferences.decimal_places IS 'Decimal places for currency display: 2, 4, or 6';
COMMENT ON COLUMN public.preferences.date_format IS 'Date format preference';
COMMENT ON COLUMN public.preferences.chart_default_period IS 'Default period for charts: 24h, 7d, 30d, 90d';
COMMENT ON COLUMN public.preferences.auto_refresh_interval IS 'Auto-refresh interval in minutes (0 = disabled)';
