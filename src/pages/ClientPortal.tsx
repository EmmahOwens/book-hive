import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { BorrowModal } from "@/components/BorrowModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Book, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

const ClientPortal = () => {
  const navigate = useNavigate();
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
      let query = (supabase as any).from('books_realtime_view').select('*');

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
    navigate(`/client/book/${bookId}`);
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
    <div className="min-h-screen bg-background">
      {/* Client Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-card/50 backdrop-blur-md border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-neumorphic">
            <img 
              src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
              alt="Book Hive Logo" 
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Book Hive
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Discover & Borrow Books
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-neumorphic hidden sm:flex"
            onClick={() => navigate('/admin/login')}
          >
            <User className="w-4 h-4 mr-2" />
            Librarian Login
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-neumorphic sm:hidden"
            onClick={() => navigate('/admin/login')}
          >
            <User className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-neumorphic hidden sm:flex"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-neumorphic sm:hidden"
            onClick={() => navigate('/')}
          >
            Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Apple-style Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-12 sm:mb-16">
          {/* Background with gradient mesh */}
          <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-mesh"></div>
          
          {/* Content */}
          <div className="relative z-10 text-center py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
            <div className="animate-fade-in-up">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 animate-scale-in leading-tight">
                Discover Your Next
                <br />
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Great Read
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
                Explore our curated collection of academic and reference books with our modern, intuitive browsing experience
              </p>
            </div>
          </div>
          
          {/* Floating elements for visual interest - hidden on mobile */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float hidden lg:block"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300/10 rounded-full blur-xl animate-float hidden lg:block" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Search Section with Apple-style glass morphism */}
        <div className="mb-8 sm:mb-12 relative">
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>

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
            <div className="space-y-8">
              {/* Results header with Apple-style typography */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    Featured Books
                  </h2>
                  <p className="text-muted-foreground">
                    {books.length} {books.length === 1 ? 'book' : 'books'} in our collection
                  </p>
                </div>
              </div>
              
              {/* Staggered grid animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
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
      </main>
    </div>
  );
};

export default ClientPortal;