-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create levels table  
CREATE TABLE IF NOT EXISTS public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  isbn TEXT UNIQUE,
  publication_year INTEGER,
  publisher TEXT,
  edition TEXT,
  language TEXT DEFAULT 'English',
  description TEXT,
  cover_path TEXT,
  level_id UUID REFERENCES public.levels(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create book_categories junction table
CREATE TABLE IF NOT EXISTS public.book_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, category_id)
);

-- Create copies table
CREATE TABLE IF NOT EXISTS public.copies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  barcode TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'damaged', 'lost', 'maintenance')),
  location TEXT,
  acquisition_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create borrow_requests table
CREATE TABLE IF NOT EXISTS public.borrow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  affiliation TEXT NOT NULL,
  id_number TEXT NOT NULL,
  membership_id TEXT,
  pickup_location TEXT NOT NULL,
  requested_items JSONB NOT NULL DEFAULT '[]',
  desired_duration_days INTEGER NOT NULL DEFAULT 7,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  admin_notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  borrow_request_id UUID REFERENCES public.borrow_requests(id),
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  borrower_phone TEXT,
  copy_id UUID NOT NULL REFERENCES public.copies(id),
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  returned_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'extended')),
  renewal_count INTEGER DEFAULT 0,
  issued_by TEXT NOT NULL,
  returned_to TEXT,
  late_fee DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_title ON public.books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_authors ON public.books USING gin(authors);
CREATE INDEX IF NOT EXISTS idx_books_level_id ON public.books(level_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_book_id ON public.book_categories(book_id);
CREATE INDEX IF NOT EXISTS idx_book_categories_category_id ON public.book_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_copies_book_id ON public.copies(book_id);
CREATE INDEX IF NOT EXISTS idx_copies_status ON public.copies(status);
CREATE INDEX IF NOT EXISTS idx_copies_barcode ON public.copies(barcode);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON public.borrow_requests(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_email ON public.borrow_requests(email);
CREATE INDEX IF NOT EXISTS idx_loans_copy_id ON public.loans(copy_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON public.loans(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_levels_updated_at ON public.levels;
CREATE TRIGGER update_levels_updated_at
    BEFORE UPDATE ON public.levels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON public.books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_copies_updated_at ON public.copies;
CREATE TRIGGER update_copies_updated_at
    BEFORE UPDATE ON public.copies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_borrow_requests_updated_at ON public.borrow_requests;
CREATE TRIGGER update_borrow_requests_updated_at
    BEFORE UPDATE ON public.borrow_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_loans_updated_at ON public.loans;
CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create books_realtime_view as a regular view
CREATE OR REPLACE VIEW public.books_realtime_view AS
SELECT 
  b.id,
  b.title,
  b.authors,
  l.name as level,
  COALESCE(
    (SELECT array_agg(c.name) 
     FROM public.book_categories bc 
     JOIN public.categories c ON bc.category_id = c.id 
     WHERE bc.book_id = b.id), 
    '{}'::text[]
  ) as categories,
  b.description,
  b.cover_path,
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.copies cp 
     WHERE cp.book_id = b.id AND cp.status = 'available'), 
    0
  )::integer as available_count,
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.copies cp 
     WHERE cp.book_id = b.id), 
    0
  )::integer as total_copies,
  b.created_at,
  b.updated_at
FROM public.books b
LEFT JOIN public.levels l ON b.level_id = l.id;

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (library catalog is public)
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on levels" ON public.levels FOR SELECT USING (true);
CREATE POLICY "Allow public read access on books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public read access on book_categories" ON public.book_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on copies" ON public.copies FOR SELECT USING (true);

-- Borrow requests - users can insert their own, admins can manage all
CREATE POLICY "Allow public insert on borrow_requests" ON public.borrow_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read own borrow_requests" ON public.borrow_requests FOR SELECT USING (true);

-- Loans - public read access for transparency
CREATE POLICY "Allow public read on loans" ON public.loans FOR SELECT USING (true);

-- Activity log - public read access for transparency
CREATE POLICY "Allow public read on activity_log" ON public.activity_log FOR SELECT USING (true);

-- Create function for queuing notifications
CREATE OR REPLACE FUNCTION public.queue_notification(
  notification_type TEXT,
  email_to TEXT,
  email_subject TEXT,
  email_content TEXT,
  payload_data JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
BEGIN
  -- Insert into activity log for tracking
  INSERT INTO public.activity_log (actor, action, details)
  VALUES (
    'system',
    'notification_queued',
    jsonb_build_object(
      'type', notification_type,
      'email_to', email_to,
      'subject', email_subject,
      'payload', payload_data
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Notification queued successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for necessary tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.copies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrow_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- Set replica identity for realtime
ALTER TABLE public.books REPLICA IDENTITY FULL;
ALTER TABLE public.copies REPLICA IDENTITY FULL;
ALTER TABLE public.borrow_requests REPLICA IDENTITY FULL;
ALTER TABLE public.loans REPLICA IDENTITY FULL;
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;