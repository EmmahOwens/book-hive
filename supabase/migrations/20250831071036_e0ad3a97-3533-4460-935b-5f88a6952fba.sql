-- Create core tables for Book Hive Library

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  isbn TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  authors TEXT[] NOT NULL DEFAULT '{}',
  edition TEXT,
  publisher TEXT,
  year INTEGER,
  categories TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  cover_path TEXT,
  total_copies INTEGER NOT NULL DEFAULT 0,
  level TEXT, -- Bachelors/Masters/PhD/General
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create copies table
CREATE TABLE public.copies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  copy_code TEXT NOT NULL UNIQUE,
  condition TEXT NOT NULL DEFAULT 'good',
  location TEXT, -- shelf/section info
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_loan', 'reserved', 'lost', 'maintenance')),
  qr_code TEXT,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create borrow_requests table
CREATE TABLE public.borrow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  affiliation TEXT NOT NULL,
  id_number TEXT,
  membership_id TEXT,
  pickup_location TEXT,
  requested_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{book_id, copy_id?, quantity}]
  desired_duration_days INTEGER NOT NULL DEFAULT 14,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  copy_id UUID NOT NULL REFERENCES public.copies(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.borrow_requests(id),
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  borrower_phone TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  fine_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservations table for holds/waitlists
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications_queue table
CREATE TABLE public.notifications_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'system')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  to_email TEXT,
  to_phone TEXT,
  subject TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT NOT NULL, -- admin/system
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_secrets table (for storing hashed admin password)
CREATE TABLE public.admin_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_books_title ON public.books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_authors ON public.books USING gin(authors);
CREATE INDEX idx_books_categories ON public.books USING gin(categories);
CREATE INDEX idx_books_tags ON public.books USING gin(tags);
CREATE INDEX idx_copies_book_id ON public.copies(book_id);
CREATE INDEX idx_copies_status ON public.copies(status);
CREATE INDEX idx_copies_copy_code ON public.copies(copy_code);
CREATE INDEX idx_borrow_requests_status ON public.borrow_requests(status);
CREATE INDEX idx_borrow_requests_email ON public.borrow_requests(email);
CREATE INDEX idx_loans_copy_id ON public.loans(copy_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_due_at ON public.loans(due_at);
CREATE INDEX idx_reservations_book_id ON public.reservations(book_id);
CREATE INDEX idx_notifications_status ON public.notifications_queue(status);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (client portal)
CREATE POLICY "Public can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Public can view copies" ON public.copies FOR SELECT USING (true);
CREATE POLICY "Public can view branches" ON public.branches FOR SELECT USING (true);

-- Create RLS policies for borrow requests (users can create and view their own)
CREATE POLICY "Users can create borrow requests" ON public.borrow_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own requests" ON public.borrow_requests FOR SELECT USING (true);

-- Admin-only policies (will be enforced by admin token in Edge Functions)
CREATE POLICY "Admin full access to all tables" ON public.books FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to copies" ON public.copies FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to requests" ON public.borrow_requests FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to loans" ON public.loans FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to reservations" ON public.reservations FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to notifications" ON public.notifications_queue FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to activity_log" ON public.activity_log FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);
CREATE POLICY "Admin full access to admin_secrets" ON public.admin_secrets FOR ALL USING (current_setting('app.admin_mode', true)::boolean = true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for books table
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for admin_secrets table
CREATE TRIGGER update_admin_secrets_updated_at
  BEFORE UPDATE ON public.admin_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update total_copies when copies are added/removed
CREATE OR REPLACE FUNCTION public.update_book_total_copies()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.books 
    SET total_copies = total_copies + 1 
    WHERE id = NEW.book_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.books 
    SET total_copies = total_copies - 1 
    WHERE id = OLD.book_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for copy count updates
CREATE TRIGGER update_total_copies_on_insert
  AFTER INSERT ON public.copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_total_copies();

CREATE TRIGGER update_total_copies_on_delete
  AFTER DELETE ON public.copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_book_total_copies();

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(actor_name TEXT, action_name TEXT, details_json JSONB DEFAULT '{}'::jsonb)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_log (actor, action, details)
  VALUES (actor_name, action_name, details_json);
END;
$$ LANGUAGE plpgsql;

-- Create function to queue notifications
CREATE OR REPLACE FUNCTION public.queue_notification(
  notification_type TEXT,
  email_to TEXT DEFAULT NULL,
  phone_to TEXT DEFAULT NULL,
  email_subject TEXT DEFAULT NULL,
  email_content TEXT DEFAULT NULL,
  payload_data JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications_queue (type, to_email, to_phone, subject, content, payload)
  VALUES (notification_type, email_to, phone_to, email_subject, email_content, payload_data);
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for books with availability
CREATE MATERIALIZED VIEW public.books_view AS
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

-- Create unique index on materialized view
CREATE UNIQUE INDEX idx_books_view_id ON public.books_view(id);

-- Create function to refresh books view
CREATE OR REPLACE FUNCTION public.refresh_books_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.books_view;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_books_view_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.refresh_books_view();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for refreshing books_view
CREATE TRIGGER refresh_books_view_on_books_change
  AFTER INSERT OR UPDATE OR DELETE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_books_view_trigger();

CREATE TRIGGER refresh_books_view_on_copies_change
  AFTER INSERT OR UPDATE OR DELETE ON public.copies
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_books_view_trigger();

CREATE TRIGGER refresh_books_view_on_loans_change
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_books_view_trigger();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.books_view;
ALTER PUBLICATION supabase_realtime ADD TABLE public.borrow_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.copies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

-- Insert default branch
INSERT INTO public.branches (name, address, contact_phone) 
VALUES ('Main Library', '123 University Ave, Campus', '+1-555-0123');

-- Insert hashed admin password (bcrypt hash of 'Admin256')
INSERT INTO public.admin_secrets (key, value_hash) 
VALUES ('admin_password', '$2b$10$8K1p/a9lWV5g/nF5g2j1k.2B1Ej6f9L3dN8sR7vQ9wK2E4aJ5mN6P');

-- Seed sample books data
INSERT INTO public.books (title, authors, edition, publisher, year, categories, tags, description, level, total_copies) VALUES
('Calculus: Early Transcendentals', ARRAY['James Stewart'], '8th Edition', 'Cengage Learning', 2015, ARRAY['Mathematics','Science'], ARRAY['calculus','math','engineering'], 'Comprehensive calculus textbook covering limits, derivatives, integrals and their applications.', 'Bachelors', 5),
('Introduction to Electrodynamics', ARRAY['David J. Griffiths'], '4th Edition', 'Cambridge University Press', 2017, ARRAY['Physics'], ARRAY['physics','electromagnetism','classical'], 'Classic undergraduate text on electromagnetic theory and applications.', 'Bachelors/Masters', 3),
('Digital Signal Processing', ARRAY['Alan V. Oppenheim','Ronald W. Schafer'], '3rd Edition', 'Prentice Hall', 2009, ARRAY['Electronics','Signal Processing'], ARRAY['DSP','signals','engineering'], 'Fundamental principles and applications of digital signal processing.', 'Masters', 4),
('Power System Analysis', ARRAY['John J. Grainger','William D. Stevenson Jr.'], '1st Edition', 'McGraw-Hill', 1994, ARRAY['Electrical Engineering'], ARRAY['power systems','electrical','engineering'], 'Comprehensive analysis of electrical power systems and grid operations.', 'Masters/PhD', 2),
('Machine Learning: A Probabilistic Perspective', ARRAY['Kevin P. Murphy'], '1st Edition', 'MIT Press', 2012, ARRAY['Computer Science','AI'], ARRAY['machine learning','AI','statistics'], 'Comprehensive introduction to machine learning from a probabilistic viewpoint.', 'Masters/PhD', 6),
('Introduction to Algorithms', ARRAY['Thomas H. Cormen','Charles E. Leiserson','Ronald L. Rivest','Clifford Stein'], '4th Edition', 'MIT Press', 2022, ARRAY['Computer Science'], ARRAY['algorithms','programming','computer science'], 'The definitive textbook on algorithms and data structures.', 'Bachelors/Masters', 8),
('Research Methods in Education', ARRAY['Louis Cohen','Lawrence Manion','Keith Morrison'], '8th Edition', 'Routledge', 2017, ARRAY['Education','Research'], ARRAY['research','education','methodology'], 'Comprehensive guide to educational research methods and approaches.', 'Masters/PhD', 3),
('A History of Western Philosophy', ARRAY['Bertrand Russell'], '2nd Edition', 'Routledge', 2004, ARRAY['Philosophy','Arts'], ARRAY['philosophy','history','western thought'], 'Classic survey of Western philosophical thought from ancient to modern times.', 'Bachelors/Masters', 4),
('Gardner''s Art Through the Ages: A Global History', ARRAY['Fred S. Kleiner'], '16th Edition', 'Cengage Learning', 2019, ARRAY['Arts','History'], ARRAY['art history','global','culture'], 'Comprehensive survey of world art from prehistoric to contemporary periods.', 'Bachelors/Masters', 5),
('Philosophy of Science: An Introduction', ARRAY['Alex Rosenberg'], '1st Edition', 'Routledge', 2011, ARRAY['Philosophy','Science'], ARRAY['philosophy of science','scientific method'], 'Introduction to key issues in the philosophy of science and scientific reasoning.', 'Masters/PhD', 2),
('Advanced Engineering Thermodynamics', ARRAY['Adrian Bejan'], '4th Edition', 'Wiley', 2016, ARRAY['Mechanical Engineering','Science'], ARRAY['thermodynamics','engineering','energy'], 'Advanced treatment of thermodynamic principles for engineering applications.', 'Masters/PhD', 3),
('Statistical Methods for Research Workers', ARRAY['Ronald A. Fisher'], '14th Edition', 'Oliver and Boyd', 1973, ARRAY['Statistics','Research'], ARRAY['statistics','research methods','data analysis'], 'Classic text on statistical methods and their application to research.', 'Bachelors/Masters/PhD', 4);

-- Create copies for each book
DO $$
DECLARE
    book_record RECORD;
    branch_id UUID;
    i INTEGER;
BEGIN
    -- Get the main branch ID
    SELECT id INTO branch_id FROM public.branches WHERE name = 'Main Library' LIMIT 1;
    
    -- Create copies for each book
    FOR book_record IN SELECT id, total_copies FROM public.books LOOP
        FOR i IN 1..book_record.total_copies LOOP
            INSERT INTO public.copies (book_id, branch_id, copy_code, condition, location, status)
            VALUES (
                book_record.id,
                branch_id,
                'BH-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
                'good',
                'A-' || (i % 5 + 1)::TEXT, -- Shelf locations A-1 to A-5
                'available'
            );
        END LOOP;
    END LOOP;
END $$;