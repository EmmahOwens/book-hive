import { useState, useEffect } from "react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { BorrowModal } from "@/components/BorrowModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, BookOpen } from "lucide-react";

interface Book {
  id: string;
  title: string;
  authors: string[];
  level: string;
  categories: string[];
  description: string;
  cover_path: string;
  available_count: number;
  total_copies: number;
}

interface SearchFilters {
  categories: string[];
  levels: string[];
  availability: 'all' | 'available' | 'unavailable';
}

const Index = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    levels: [],
    availability: 'all'
  });
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Realtime subscription for book availability updates
  useRealtimeSubscription({
    table: 'books_realtime_view',
    onUpdate: (payload) => {
      console.log('Book availability updated:', payload);
      fetchBooks(); // Refresh books when availability changes
    },
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('books_realtime_view').select('*');

      // Apply search filter
      if (debouncedSearchQuery) {
        query = query.or(`title.ilike.%${debouncedSearchQuery}%,authors.cs.{"${debouncedSearchQuery}"}`);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories);
      }

      // Apply level filter
      if (filters.levels.length > 0) {
        query = query.in('level', filters.levels);
      }

      // Apply availability filter
      if (filters.availability === 'available') {
        query = query.gt('available_count', 0);
      } else if (filters.availability === 'unavailable') {
        query = query.eq('available_count', 0);
      }

      const { data, error } = await query.order('title');

      if (error) {
        console.error('Error fetching books:', error);
        toast({
          title: "Error",
          description: "Failed to load books. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [debouncedSearchQuery, filters]);

  const handleBorrowBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book && book.available_count > 0) {
      setSelectedBook(book);
      setShowBorrowModal(true);
    } else {
      toast({
        title: "Unavailable",
        description: "This book is currently unavailable for borrowing.",
        variant: "destructive",
      });
    }
  };

  const handleViewBookDetails = (bookId: string) => {
    // TODO: Implement book details modal or page
    console.log('View details for book:', bookId);
  };

  const handleBorrowSubmit = async (borrowData: any) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .insert([{
          requester_name: borrowData.requesterName,
          email: borrowData.email,
          phone: borrowData.phone,
          affiliation: borrowData.affiliation,
          id_number: borrowData.idNumber,
          membership_id: borrowData.membershipId,
          pickup_location: borrowData.pickupLocation,
          requested_items: [{ book_id: borrowData.bookId, quantity: 1 }],
          desired_duration_days: borrowData.desiredDurationDays,
          purpose: borrowData.purpose,
          status: 'pending'
        }]);

      if (error) {
        console.error('Error submitting borrow request:', error);
        throw error;
      }

      // Queue notification email
      await supabase.rpc('queue_notification', {
        notification_type: 'email',
        email_to: borrowData.email,
        email_subject: 'Borrow Request Submitted - Book Hive Library',
        email_content: `
          <h2>Borrow Request Submitted</h2>
          <p>Dear ${borrowData.requesterName},</p>
          <p>Your request to borrow "${selectedBook?.title}" has been successfully submitted.</p>
          <p>Request details:</p>
          <ul>
            <li>Book: ${selectedBook?.title}</li>
            <li>Duration: ${borrowData.desiredDurationDays} days</li>
            <li>Pickup Location: ${borrowData.pickupLocation}</li>
          </ul>
          <p>You will receive another email once your request has been reviewed by our staff.</p>
          <p>Best regards,<br>Book Hive Library Team</p>
        `,
        payload_data: { book_id: borrowData.bookId, request_id: data?.[0]?.id }
      });

      setShowBorrowModal(false);
      setSelectedBook(null);
      
      toast({
        title: "Request Submitted",
        description: "Your borrow request has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      throw error;
    }
  };

  return (
    <BookHiveLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Discover Your Next Great Read
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse our collection of academic and reference books
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Results Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {loading ? "Loading..." : `${books.length} books found`}
            </p>
            {(debouncedSearchQuery || filters.categories.length > 0 || filters.levels.length > 0 || filters.availability !== 'all') && (
              <p className="text-sm text-muted-foreground">
                Filtered results
              </p>
            )}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading books...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No books found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filters.categories.length > 0 || filters.levels.length > 0 
                ? "Try adjusting your search criteria or filters"
                : "No books are currently available in the library"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                authors={book.authors}
                level={book.level}
                categories={book.categories}
                availableCount={book.available_count}
                totalCopies={book.total_copies}
                coverPath={book.cover_path}
                description={book.description}
                onBorrow={handleBorrowBook}
                onViewDetails={handleViewBookDetails}
              />
            ))}
          </div>
        )}

        {/* Borrow Modal */}
        <BorrowModal
          isOpen={showBorrowModal}
          onClose={() => {
            setShowBorrowModal(false);
            setSelectedBook(null);
          }}
          book={selectedBook ? {
            id: selectedBook.id,
            title: selectedBook.title,
            authors: selectedBook.authors,
            availableCount: selectedBook.available_count,
          } : null}
          onSubmit={handleBorrowSubmit}
        />
      </div>
    </BookHiveLayout>
  );
};

export default Index;
