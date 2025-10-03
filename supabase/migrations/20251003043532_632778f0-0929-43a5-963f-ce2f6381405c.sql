-- ============================================
-- PERFORMANCE OPTIMIZATION MIGRATION (FIXED)
-- ============================================

-- 1. ADD CRITICAL INDEXES FOR QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_copies_book_id ON public.copies(book_id);
CREATE INDEX IF NOT EXISTS idx_copies_status ON public.copies(status);
CREATE INDEX IF NOT EXISTS idx_copies_book_id_status ON public.copies(book_id, status) WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_loans_copy_id ON public.loans(copy_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans(due_date);
CREATE INDEX IF NOT EXISTS idx_loans_status_due_date ON public.loans(status, due_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_loans_borrow_request_id ON public.loans(borrow_request_id);

CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON public.borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_email ON public.borrow_requests(email);

CREATE INDEX IF NOT EXISTS idx_book_categories_book_id ON public.book_categories(book_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_category_id ON public.book_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type_id ON public.activity_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_books_level_id ON public.books(level_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books(title);


-- 2. CREATE MATERIALIZED VIEW FOR BOOKS
DROP VIEW IF EXISTS public.books_realtime_view CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.books_materialized_view AS
SELECT 
    b.id,
    b.title,
    b.authors,
    b.description,
    b.cover_path,
    b.isbn,
    b.publisher,
    b.publication_year,
    b.edition,
    b.language,
    b.created_at,
    b.updated_at,
    l.name as level,
    COALESCE(
        (SELECT COUNT(*) FROM public.copies c WHERE c.book_id = b.id AND c.status = 'available'),
        0
    )::integer as available_count,
    COALESCE(
        (SELECT COUNT(*) FROM public.copies c WHERE c.book_id = b.id),
        0
    )::integer as total_copies,
    COALESCE(
        ARRAY_AGG(DISTINCT cat.name) FILTER (WHERE cat.name IS NOT NULL),
        ARRAY[]::text[]
    ) as categories
FROM public.books b
LEFT JOIN public.levels l ON b.level_id = l.id
LEFT JOIN public.book_categories bc ON b.id = bc.book_id
LEFT JOIN public.categories cat ON bc.category_id = cat.id
GROUP BY b.id, l.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_books_mv_id ON public.books_materialized_view(id);
CREATE INDEX IF NOT EXISTS idx_books_mv_level ON public.books_materialized_view(level);
CREATE INDEX IF NOT EXISTS idx_books_mv_available_count ON public.books_materialized_view(available_count);


-- 3. CREATE REFRESH FUNCTIONS
CREATE OR REPLACE FUNCTION public.refresh_books_materialized_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.books_materialized_view;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_books_view_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.books_materialized_view;
    RETURN NULL;
END;
$$;


-- 4. CREATE TRIGGERS FOR AUTO-REFRESH
CREATE TRIGGER trigger_refresh_books_view_on_books
AFTER INSERT OR UPDATE OR DELETE ON public.books
FOR EACH STATEMENT
EXECUTE FUNCTION public.schedule_books_view_refresh();

CREATE TRIGGER trigger_refresh_books_view_on_copies
AFTER INSERT OR UPDATE OR DELETE ON public.copies
FOR EACH STATEMENT
EXECUTE FUNCTION public.schedule_books_view_refresh();

CREATE TRIGGER trigger_refresh_books_view_on_book_categories
AFTER INSERT OR UPDATE OR DELETE ON public.book_categories
FOR EACH STATEMENT
EXECUTE FUNCTION public.schedule_books_view_refresh();


-- 5. CREATE NOTIFICATION QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    notification_type text NOT NULL,
    email_to text NOT NULL,
    email_subject text NOT NULL,
    email_content text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')) NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone,
    error_message text,
    sent_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON public.notification_queue(created_at DESC);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage notification queue"
ON public.notification_queue
FOR ALL
USING (false);

CREATE TRIGGER update_notification_queue_updated_at
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- 6. UPDATE QUEUE NOTIFICATION FUNCTION
CREATE OR REPLACE FUNCTION public.queue_notification(
    notification_type text,
    email_to text,
    email_subject text,
    email_content text,
    payload_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notification_queue (
        notification_type,
        email_to,
        email_subject,
        email_content,
        payload,
        status
    )
    VALUES (
        notification_type,
        email_to,
        email_subject,
        email_content,
        payload_data,
        'pending'
    )
    RETURNING id INTO notification_id;
    
    INSERT INTO public.activity_log (actor, action, details)
    VALUES (
        'system',
        'notification_queued',
        jsonb_build_object(
            'notification_id', notification_id,
            'type', notification_type,
            'email_to', email_to,
            'subject', email_subject
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'notification_id', notification_id,
        'message', 'Notification queued successfully'
    );
END;
$$;


-- 7. CREATE BATCH LOAN CREATION FUNCTION
CREATE OR REPLACE FUNCTION public.create_loans_batch(
    loans_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    loan_record jsonb;
    created_loan_ids uuid[] := ARRAY[]::uuid[];
    loan_id uuid;
    success_count integer := 0;
    error_count integer := 0;
    errors jsonb := '[]'::jsonb;
BEGIN
    FOR loan_record IN SELECT * FROM jsonb_array_elements(loans_data)
    LOOP
        BEGIN
            INSERT INTO public.loans (
                borrow_request_id,
                copy_id,
                borrower_name,
                borrower_email,
                borrower_phone,
                issued_date,
                due_date,
                status,
                issued_by,
                notes
            )
            VALUES (
                (loan_record->>'borrow_request_id')::uuid,
                (loan_record->>'copy_id')::uuid,
                loan_record->>'borrower_name',
                loan_record->>'borrower_email',
                loan_record->>'borrower_phone',
                (loan_record->>'issued_date')::date,
                (loan_record->>'due_date')::date,
                COALESCE(loan_record->>'status', 'active'),
                loan_record->>'issued_by',
                loan_record->>'notes'
            )
            RETURNING id INTO loan_id;
            
            UPDATE public.copies
            SET status = 'borrowed',
                updated_at = now()
            WHERE id = (loan_record->>'copy_id')::uuid;
            
            created_loan_ids := array_append(created_loan_ids, loan_id);
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || jsonb_build_object(
                'copy_id', loan_record->>'copy_id',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', error_count = 0,
        'created_loan_ids', created_loan_ids,
        'success_count', success_count,
        'error_count', error_count,
        'errors', errors
    );
END;
$$;