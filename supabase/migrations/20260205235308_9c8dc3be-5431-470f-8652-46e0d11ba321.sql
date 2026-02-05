-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create fx_rates table for exchange rate data
CREATE TABLE public.fx_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    bid_value DECIMAL(18, 6) NOT NULL,
    ask_value DECIMAL(18, 6) NOT NULL,
    pct_change DECIMAL(10, 4) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fx_rates
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- FX rates are readable by authenticated users
CREATE POLICY "Authenticated users can view fx_rates"
    ON public.fx_rates FOR SELECT
    TO authenticated
    USING (true);

-- Create commodity_settings table for user preferences
CREATE TABLE public.commodity_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_name TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    target_price DECIMAL(18, 6),
    alert_threshold DECIMAL(10, 4) DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, asset_name, target_currency)
);

-- Enable RLS on commodity_settings
ALTER TABLE public.commodity_settings ENABLE ROW LEVEL SECURITY;

-- Commodity settings policies
CREATE POLICY "Users can view their own settings"
    ON public.commodity_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
    ON public.commodity_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON public.commodity_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
    ON public.commodity_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Create insight type enum
CREATE TYPE public.insight_type AS ENUM ('Opportunity', 'Risk');
CREATE TYPE public.indicator_type AS ENUM ('Bullish', 'Bearish', 'Neutral');

-- Create fx_insights table for recommendations
CREATE TABLE public.fx_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type insight_type NOT NULL,
    message TEXT NOT NULL,
    indicator indicator_type NOT NULL DEFAULT 'Neutral',
    currency_code TEXT,
    commodity TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fx_insights
ALTER TABLE public.fx_insights ENABLE ROW LEVEL SECURITY;

-- Insights are readable by authenticated users
CREATE POLICY "Authenticated users can view insights"
    ON public.fx_insights FOR SELECT
    TO authenticated
    USING (true);

-- Create integration_logs table for n8n workflow monitoring
CREATE TABLE public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on integration_logs
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Logs are readable by authenticated users
CREATE POLICY "Authenticated users can view logs"
    ON public.integration_logs FOR SELECT
    TO authenticated
    USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commodity_settings_updated_at
    BEFORE UPDATE ON public.commodity_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insert sample FX rates data
INSERT INTO public.fx_rates (code, bid_value, ask_value, pct_change, timestamp) VALUES
    ('USD/BRL', 5.0234, 5.0312, 0.45, now() - interval '6 hours'),
    ('USD/BRL', 5.0156, 5.0234, 0.32, now() - interval '5 hours'),
    ('USD/BRL', 5.0089, 5.0167, -0.13, now() - interval '4 hours'),
    ('USD/BRL', 5.0201, 5.0279, 0.22, now() - interval '3 hours'),
    ('USD/BRL', 5.0312, 5.0390, 0.22, now() - interval '2 hours'),
    ('USD/BRL', 5.0423, 5.0501, 0.22, now() - interval '1 hour'),
    ('USD/BRL', 5.0534, 5.0612, 0.22, now()),
    ('EUR/BRL', 5.4823, 5.4912, -0.28, now() - interval '6 hours'),
    ('EUR/BRL', 5.4756, 5.4845, -0.12, now() - interval '5 hours'),
    ('EUR/BRL', 5.4689, 5.4778, -0.12, now() - interval '4 hours'),
    ('EUR/BRL', 5.4756, 5.4845, 0.12, now() - interval '3 hours'),
    ('EUR/BRL', 5.4823, 5.4912, 0.12, now() - interval '2 hours'),
    ('EUR/BRL', 5.4890, 5.4979, 0.12, now() - interval '1 hour'),
    ('EUR/BRL', 5.4957, 5.5046, 0.12, now()),
    ('CNY/BRL', 0.6912, 0.6934, 0.67, now() - interval '6 hours'),
    ('CNY/BRL', 0.6923, 0.6945, 0.16, now() - interval '5 hours'),
    ('CNY/BRL', 0.6934, 0.6956, 0.16, now() - interval '4 hours'),
    ('CNY/BRL', 0.6945, 0.6967, 0.16, now() - interval '3 hours'),
    ('CNY/BRL', 0.6956, 0.6978, 0.16, now() - interval '2 hours'),
    ('CNY/BRL', 0.6967, 0.6989, 0.16, now() - interval '1 hour'),
    ('CNY/BRL', 0.6978, 0.7000, 0.16, now());

-- Insert sample insights
INSERT INTO public.fx_insights (type, message, indicator, currency_code, commodity) VALUES
    ('Opportunity', 'USD/BRL below 30-day average. Favorable window for US grain imports.', 'Bullish', 'USD/BRL', 'Grains'),
    ('Risk', 'EUR strengthening trend. Consider hedging European meat contracts.', 'Bearish', 'EUR/BRL', 'Meat'),
    ('Opportunity', 'CNY stability presents low-risk window for Chinese oil purchases.', 'Bullish', 'CNY/BRL', 'Oil');

-- Insert sample integration logs
INSERT INTO public.integration_logs (workflow_id, status_code, message, metadata) VALUES
    ('fx-rate-sync-001', 200, 'Successfully synced 3 currency pairs', '{"pairs": ["USD/BRL", "EUR/BRL", "CNY/BRL"], "duration_ms": 234}'),
    ('insight-gen-002', 200, 'Generated 3 new insights', '{"insights_count": 3, "model": "gpt-4"}'),
    ('fx-rate-sync-001', 200, 'Successfully synced 3 currency pairs', '{"pairs": ["USD/BRL", "EUR/BRL", "CNY/BRL"], "duration_ms": 189}'),
    ('alert-check-003', 200, 'No threshold alerts triggered', '{"checked_settings": 0}');