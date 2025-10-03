-- Fix security warning: Hide materialized view from Data API
-- Materialized views should not be directly accessible via the API

-- Revoke all privileges from anon and authenticated roles
REVOKE ALL ON public.books_materialized_view FROM anon, authenticated;

-- Grant access only to postgres role
GRANT SELECT ON public.books_materialized_view TO postgres;