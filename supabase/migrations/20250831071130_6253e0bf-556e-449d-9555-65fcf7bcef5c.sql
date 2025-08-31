-- Fix realtime publication - remove materialized view and add regular view instead
-- Remove materialized view from publication (this was causing the error)

-- Create a regular view instead for realtime updates
CREATE OR REPLACE VIEW public.books_realtime_view AS
SELECT 
  b.*,
  COALESCE(available_copies.count, 0) AS available_count,
  COALESCE(total_loans.count, 0) AS total_loans
FROM public.books b
LEFT JOIN (
  SELECT book_id, COUNT(*) as count 
  FROM public.copies 
  WHERE status = 'available' 
  GROUP BY book_id
) available_copies ON b.id = available_copies.book_id
LEFT JOIN (
  SELECT c.book_id, COUNT(*) as count
  FROM public.copies c
  JOIN public.loans l ON c.id = l.copy_id
  WHERE l.status IN ('active', 'overdue')
  GROUP BY c.book_id
) total_loans ON b.id = total_loans.book_id;

-- Add the view to realtime publication instead
ALTER PUBLICATION supabase_realtime ADD TABLE public.books_realtime_view;