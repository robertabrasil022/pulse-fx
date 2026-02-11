-- Function to delete user's own alert (bypasses RLS issues)
CREATE OR REPLACE FUNCTION delete_user_alert(alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verify the alert belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.alerts
    WHERE id = alert_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Alert not found or unauthorized';
  END IF;

  -- Delete the alert
  DELETE FROM public.alerts
  WHERE id = alert_id AND user_id = auth.uid();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;

-- Function to update user's own alert (bypasses RLS issues)
CREATE OR REPLACE FUNCTION update_user_alert(
  alert_id UUID,
  new_currency TEXT DEFAULT NULL,
  new_target_price NUMERIC DEFAULT NULL,
  new_tolerance NUMERIC DEFAULT NULL
)
RETURNS public.alerts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_alert public.alerts;
BEGIN
  -- Verify the alert belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM public.alerts
    WHERE id = alert_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Alert not found or unauthorized';
  END IF;

  -- Update the alert
  UPDATE public.alerts
  SET
    currency = COALESCE(new_currency, currency),
    target_price = COALESCE(new_target_price, target_price),
    tolerance = COALESCE(new_tolerance, tolerance),
    updated_at = now()
  WHERE id = alert_id AND user_id = auth.uid()
  RETURNING * INTO updated_alert;
  
  RETURN updated_alert;
END;
$$;

-- Function to get current user id (for debugging RLS)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;
