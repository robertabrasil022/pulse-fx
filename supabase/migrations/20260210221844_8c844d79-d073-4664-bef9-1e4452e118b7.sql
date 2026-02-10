
-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  tolerance NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (PERMISSIVE)
CREATE POLICY "Users can view their own alerts"
ON public.alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
ON public.alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON public.alerts FOR DELETE
USING (auth.uid() = user_id);

-- Index for user lookups
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
