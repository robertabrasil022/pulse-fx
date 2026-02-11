-- Fix watchlist defaults to start empty instead of with preset currencies

-- Update default value for new preferences
ALTER TABLE public.preferences 
ALTER COLUMN watchlist SET DEFAULT ARRAY[]::TEXT[];

-- Reset existing watchlists that have the old preset configuration
UPDATE public.preferences
SET watchlist = ARRAY[]::TEXT[]
WHERE (
  array_length(watchlist, 1) = 3 
  AND watchlist @> ARRAY['USD/BRL', 'EUR/BRL', 'CNY/BRL']
);
