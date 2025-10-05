-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.books_view;

CREATE VIEW public.books_view AS
SELECT
  b.id,
  b.title,
  b.authors,
  COALESCE(l.name, '') AS level,
  COALESCE(cat.categories, '{}'::text[]) AS categories,
  b.description,
  b.cover_path,
  COALESCE(cc.available_count, 0)::int AS available_count,
  COALESCE(cc.total_copies, 0)::int AS total_copies
FROM public.books b
LEFT JOIN public.levels l ON l.id = b.level_id
LEFT JOIN (
  SELECT bc.book_id, array_agg(DISTINCT c.name) AS categories
  FROM public.book_categories bc
  JOIN public.categories c ON c.id = bc.category_id
  GROUP BY bc.book_id
) AS cat ON cat.book_id = b.id
LEFT JOIN (
  SELECT
    c.book_id,
    COUNT(*)::int AS total_copies,
    COUNT(*) FILTER (WHERE c.status = 'available')::int AS available_count
  FROM public.copies c
  GROUP BY c.book_id
) AS cc ON cc.book_id = b.id;