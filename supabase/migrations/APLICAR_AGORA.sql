-- ================================================================
-- SCRIPT COMPLETO DE MIGRAÇÃO - PERSONALIZAÇÃO DE VISUALIZAÇÃO
-- Execute este SQL no Dashboard do Supabase para ativar todas as funcionalidades
-- ================================================================

-- 1️⃣ ADICIONAR CAMPOS DE PERSONALIZAÇÃO DE VISUALIZAÇÃO
ALTER TABLE public.preferences
ADD COLUMN IF NOT EXISTS number_format TEXT NOT NULL DEFAULT 'pt-BR' CHECK (number_format IN ('pt-BR', 'en-US')),
ADD COLUMN IF NOT EXISTS decimal_places INTEGER NOT NULL DEFAULT 2 CHECK (decimal_places IN (2, 4, 6)),
ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
ADD COLUMN IF NOT EXISTS chart_default_period TEXT NOT NULL DEFAULT '7d' CHECK (chart_default_period IN ('24h', '7d', '30d', '90d')),
ADD COLUMN IF NOT EXISTS auto_refresh_interval INTEGER NOT NULL DEFAULT 5 CHECK (auto_refresh_interval IN (0, 1, 5, 15, 30));

-- 2️⃣ ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.preferences.number_format IS 'Number format: pt-BR (5.234,50) or en-US (5,234.50)';
COMMENT ON COLUMN public.preferences.decimal_places IS 'Decimal places for currency display: 2, 4, or 6';
COMMENT ON COLUMN public.preferences.date_format IS 'Date format preference';
COMMENT ON COLUMN public.preferences.chart_default_period IS 'Default period for charts: 24h, 7d, 30d, 90d';
COMMENT ON COLUMN public.preferences.auto_refresh_interval IS 'Auto-refresh interval in minutes (0 = disabled)';

-- 3️⃣ REMOVER CAMPOS DE NOTIFICAÇÃO (opcional - se existirem)
ALTER TABLE public.preferences
DROP COLUMN IF EXISTS notifications_email,
DROP COLUMN IF EXISTS notifications_push,
DROP COLUMN IF EXISTS quiet_hours_enabled,
DROP COLUMN IF EXISTS quiet_hours_start,
DROP COLUMN IF EXISTS quiet_hours_end;

-- 4️⃣ VERIFICAR E CORRIGIR VALORES PADRÃO EM REGISTROS EXISTENTES
UPDATE public.preferences
SET 
  number_format = COALESCE(number_format, 'pt-BR'),
  decimal_places = COALESCE(decimal_places, 2),
  date_format = COALESCE(date_format, 'DD/MM/YYYY'),
  chart_default_period = COALESCE(chart_default_period, '7d'),
  auto_refresh_interval = COALESCE(auto_refresh_interval, 5)
WHERE 
  number_format IS NULL 
  OR decimal_places IS NULL 
  OR date_format IS NULL 
  OR chart_default_period IS NULL 
  OR auto_refresh_interval IS NULL;

-- ================================================================
-- ✅ PRONTO! As preferências de visualização estão configuradas
-- ================================================================

-- Verificar se funcionou:
-- SELECT user_id, number_format, decimal_places, date_format, chart_default_period, auto_refresh_interval 
-- FROM public.preferences LIMIT 5;
