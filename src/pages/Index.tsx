import { useState, useEffect } from "react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { BorrowModal } from "@/components/BorrowModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, BookOpen } from "lucide-react";
import { BouncingBookLoader } from "@/components/BouncingBookLoader";
import { ParticleBackground } from "@/components/ParticleBackground";
import { AnimatedBlob } from "@/components/AnimatedBlob";
import { motion } from "framer-motion";

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
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-hero animate-gradient"></div>
          <div className="absolute inset-0 bg-gradient-mesh"></div>
          
          {/* Particle effects */}
          <ParticleBackground />
          
          {/* Animated blobs */}
          <AnimatedBlob className="w-72 h-72 bg-primary/20 top-0 -left-12" delay={0} />
          <AnimatedBlob className="w-96 h-96 bg-purple-400/20 bottom-0 -right-12" delay={2} />
          <AnimatedBlob className="w-80 h-80 bg-blue-400/20 top-1/2 left-1/2" delay={4} />
          
          {/* Content */}
          <div className="relative z-10 text-center py-32 px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Logo */}
              <motion.div 
                className="mb-8"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img 
                  src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
                  alt="Book Hive Logo" 
                  className="w-20 h-20 mx-auto object-contain opacity-90 cursor-pointer"
                />
              </motion.div>
              
              <motion.h1 
                className="headline-large text-white mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Welcome to
                <br />
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Book Hive
                </span>
              </motion.h1>
              
              <motion.p 
                className="body-large text-white/80 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Your modern digital library experience. Browse our collection or manage library operations with ease.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/client'}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(14, 165, 233, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Collection
                </motion.button>
                <motion.button 
                  className="glass text-white px-6 py-3 rounded-full font-medium"
                  onClick={() => window.location.href = '/admin/login'}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Librarian Portal
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Search Section with Apple-style glass morphism */}
        <motion.div 
          className="mb-12 relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div 
            className="glass rounded-3xl p-8 backdrop-blur-2xl"
            whileHover={{ 
              boxShadow: "0 0 40px rgba(14, 165, 233, 0.3)",
              y: -2 
            }}
            transition={{ duration: 0.3 }}
          >
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </motion.div>
        </motion.div>

        {/* Results Section - Removed as it's now integrated into the main section */}

        {/* Apple-style Books Grid Section */}
        <section className="relative">
          {loading ? (
            <BouncingBookLoader text="Loading your books..." />
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
                  <motion.div 
                    key={book.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{ y: -8 }}
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
                  </motion.div>
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
