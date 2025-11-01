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

  // Realtime subscription for book copies changes (affects availability)
  useRealtimeSubscription({
    table: 'copies',
    onUpdate: (payload) => {
      console.log('Copy status updated:', payload);
      fetchBooks();
    },
    onInsert: (payload) => {
      console.log('Copy added:', payload);
      fetchBooks();
    },
    onDelete: (payload) => {
      console.log('Copy deleted:', payload);
      fetchBooks();
    },
  });

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('books_view').select('*');

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
      const { data, error } = await (supabase as any)
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

      // Queue notification email only if we have data
      if (data && data[0]) {
        await (supabase as any).rpc('queue_notification', {
          notification_type: 'email',
          email_to: borrowData.email,
          email_subject: 'Borrow Request Submitted - Book Hive',
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
            <p>Best regards,<br>Book Hive Team</p>
          `,
          payload_data: { book_id: borrowData.bookId, request_id: data[0].id }
        });
      }

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
        {/* Welcome Hero Section */}
        <div className="relative overflow-hidden rounded-3xl mb-16">
          {/* Pure gradient background without images */}
          <div className="absolute inset-0 bg-gradient-hero"></div>
          <div className="absolute inset-0 bg-gradient-mesh"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center py-32 px-8">
            <div className="animate-fade-in-up">
              {/* Logo */}
              <div className="mb-8 animate-bounce-subtle">
                <img 
                  src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
                  alt="Book Hive Logo" 
                  className="w-20 h-20 mx-auto object-contain opacity-90 hover-wiggle cursor-pointer"
                />
              </div>
              <h1 className="headline-large text-white mb-6 animate-zoom-in">
                Welcome to
                <br />
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent animate-pulse-glow">
                  Book Hive
                </span>
              </h1>
              <p className="body-large text-white/80 mb-8 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
                Your modern digital library experience. Browse our collection or manage library operations with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in-right" style={{animationDelay: '0.4s'}}>
                <button 
                  className="btn-primary hover-lift hover-wiggle"
                  onClick={() => window.location.href = '/client'}
                >
                  Browse Collection
                </button>
                <button 
                  className="glass text-white px-6 py-3 rounded-full font-medium hover-lift hover-float"
                  onClick={() => window.location.href = '/admin/login'}
                >
                  Librarian Portal
                </button>
              </div>
            </div>
          </div>
          
          {/* Floating elements for visual interest */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-40 right-40 w-24 h-24 bg-purple-300/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-40 left-40 w-36 h-36 bg-pink-300/10 rounded-full blur-xl animate-float" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Search Section with Apple-style glass morphism */}
        <div className="mb-12 relative animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <div className="glass rounded-3xl p-8 backdrop-blur-2xl hover-glow transition-all duration-500">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>

        {/* Results Section - Removed as it's now integrated into the main section */}

        {/* Apple-style Books Grid Section */}
        <section className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/60 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
              </div>
              <p className="mt-6 text-muted-foreground font-medium">Loading your books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-apple-lg">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-pulse"></div>
              </div>
              <h3 className="headline-medium text-2xl mb-4">No books found</h3>
              <p className="body-large text-base max-w-md mx-auto">
                {searchQuery || filters.categories.length > 0 || filters.levels.length > 0 
                  ? "Try adjusting your search criteria or explore different categories"
                  : "Our collection is being updated. Please check back soon for new additions"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in-up">
              {/* Results header with Apple-style typography */}
              <div className="flex items-center justify-between animate-slide-in-left">
                <div>
                  <h2 className="headline-medium text-3xl mb-2">
                    Featured Books
                  </h2>
                  <p className="text-muted-foreground">
                    {books.length} {books.length === 1 ? 'book' : 'books'} in our collection
                  </p>
                </div>
              </div>
              
              {/* Staggered grid animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {books.map((book, index) => (
                  <div 
                    key={book.id}
                    className="animate-fade-in-up"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <BookCard
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

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
