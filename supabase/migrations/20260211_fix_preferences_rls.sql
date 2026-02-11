-- Ensure authenticated users can update preferences and policy checks updates

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.preferences TO authenticated;

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.preferences;

CREATE POLICY "Users can update their own preferences"
ON public.preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
