-- Insert sample books with proper data
INSERT INTO public.books (title, authors, description, isbn, publisher, publication_year, language) VALUES
('The Great Gatsby', ARRAY['F. Scott Fitzgerald'], 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', '978-0-7432-7356-5', 'Scribner', 1925, 'English'),
('To Kill a Mockingbird', ARRAY['Harper Lee'], 'A gripping tale of racial injustice and childhood innocence in the American South.', '978-0-06-112008-4', 'J.B. Lippincott & Co.', 1960, 'English'),
('1984', ARRAY['George Orwell'], 'A dystopian social science fiction novel about totalitarian control and surveillance.', '978-0-452-28423-4', 'Secker & Warburg', 1949, 'English'),
('Pride and Prejudice', ARRAY['Jane Austen'], 'A romantic novel about manners, upbringing, morality, and marriage in Georgian England.', '978-0-14-143951-8', 'T. Egerton', 1813, 'English'),
('The Catcher in the Rye', ARRAY['J.D. Salinger'], 'A controversial novel about teenage rebellion and alienation in mid-20th century America.', '978-0-316-76948-0', 'Little, Brown and Company', 1951, 'English'),
('Lord of the Flies', ARRAY['William Golding'], 'A novel about a group of British boys stranded on an uninhabited island.', '978-0-571-05686-2', 'Faber & Faber', 1954, 'English'),
('The Hobbit', ARRAY['J.R.R. Tolkien'], 'A fantasy adventure novel about Bilbo Baggins and his journey to the Lonely Mountain.', '978-0-547-92822-7', 'George Allen & Unwin', 1937, 'English'),
('Harry Potter and the Philosopher''s Stone', ARRAY['J.K. Rowling'], 'The first novel in the Harry Potter series about a young wizard''s adventures.', '978-0-7475-3269-9', 'Bloomsbury', 1997, 'English'),
('Brave New World', ARRAY['Aldous Huxley'], 'A dystopian novel set in a futuristic World State of genetically modified citizens.', '978-0-06-085052-4', 'Chatto & Windus', 1932, 'English'),
('The Lord of the Rings: The Fellowship of the Ring', ARRAY['J.R.R. Tolkien'], 'The first volume of the epic fantasy trilogy following Frodo''s quest to destroy the Ring.', '978-0-547-92821-0', 'George Allen & Unwin', 1954, 'English'),
('Fahrenheit 451', ARRAY['Ray Bradbury'], 'A dystopian novel about a future society where books are banned and burned.', '978-1-4516-7331-9', 'Ballantine Books', 1953, 'English'),
('Of Mice and Men', ARRAY['John Steinbeck'], 'A novella about the friendship between two displaced migrant ranch workers during the Great Depression.', '978-0-14-017739-8', 'Covici Friede', 1937, 'English');

-- Insert book copies for each book (2-3 copies per book)
INSERT INTO public.copies (book_id, barcode, status, location)
SELECT 
  b.id,
  CONCAT('BK', LPAD((ROW_NUMBER() OVER())::text, 6, '0')),
  'available',
  'Main Library'
FROM public.books b
CROSS JOIN generate_series(1, 2) -- 2 copies per book
WHERE b.title IS NOT NULL;

-- Insert additional copy for some popular books
INSERT INTO public.copies (book_id, barcode, status, location)
SELECT 
  b.id,
  CONCAT('BK', LPAD((ROW_NUMBER() OVER() + 1000)::text, 6, '0')),
  'available',
  'Reference Section'
FROM public.books b 
WHERE b.title IN ('Harry Potter and the Philosopher''s Stone', 'The Hobbit', 'The Great Gatsby');