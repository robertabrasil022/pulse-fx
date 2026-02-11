-- Add missing DELETE policy for preferences table

CREATE POLICY "Users can delete their own preferences"
ON public.preferences FOR DELETE
USING (auth.uid() = user_id);
