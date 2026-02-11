-- Remove notification-related fields from preferences table
ALTER TABLE public.preferences
DROP COLUMN IF EXISTS notifications_email,
DROP COLUMN IF EXISTS notifications_push,
DROP COLUMN IF EXISTS quiet_hours_enabled,
DROP COLUMN IF EXISTS quiet_hours_start,
DROP COLUMN IF EXISTS quiet_hours_end;
