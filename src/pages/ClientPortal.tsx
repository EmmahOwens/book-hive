import { useState, useEffect } from "react";
import { SimpleSearchBar } from "@/components/SimpleSearchBar";
import { BookCard } from "@/components/BookCard";
import { BouncingBookLoader } from "@/components/BouncingBookLoader";
import { BorrowModal } from "@/components/BorrowModal";
import { LibraryStats } from "@/components/LibraryStats";
import { CategoryCard } from "@/components/CategoryCard";
import { ParticleBackground } from "@/components/ParticleBackground";
import { AnimatedBlob } from "@/components/AnimatedBlob";
import { GlassBackground } from "@/components/GlassBackground";
import { useDebounce } from "@/hooks/useDebounce";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BookOpen, User, Microscope, Calculator, Globe, Palette, Music, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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


const ClientPortal = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalBorrowers: 0,
    activeLoans: 0,
    avgBorrowTime: 14,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  const categories = [
    { name: "Science", icon: Microscope, description: "Scientific research & experiments", gradient: "bg-gradient-to-br from-blue-500 to-cyan-500" },
    { name: "Mathematics", icon: Calculator, description: "Numbers, formulas & logic", gradient: "bg-gradient-to-br from-purple-500 to-pink-500" },
    { name: "Literature", icon: BookMarked, description: "Classic & modern literature", gradient: "bg-gradient-to-br from-orange-500 to-red-500" },
    { name: "Geography", icon: Globe, description: "World cultures & places", gradient: "bg-gradient-to-br from-green-500 to-teal-500" },
    { name: "Arts", icon: Palette, description: "Visual & performing arts", gradient: "bg-gradient-to-br from-pink-500 to-rose-500" },
    { name: "Music", icon: Music, description: "Theory & history of music", gradient: "bg-gradient-to-br from-indigo-500 to-purple-500" },
  ];

  // Realtime subscription for copy changes (affects availability)
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
      if (selectedCategory) {
        query = query.contains('categories', [selectedCategory]);
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
    const fetchStats = async () => {
      const [booksResult, loansResult] = await Promise.all([
        (supabase as any).from('books').select('*', { count: 'exact' }),
        (supabase as any).from('loans').select('*', { count: 'exact' }).eq('status', 'active'),
      ]);

      setStats({
        totalBooks: booksResult.count || 0,
        totalBorrowers: Math.floor((loansResult.count || 0) * 0.8),
        activeLoans: loansResult.count || 0,
        avgBorrowTime: 14,
      });
    };

    fetchStats();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [debouncedSearchQuery, selectedCategory]);

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
    <div className="min-h-screen bg-background relative">
      <GlassBackground />
      {/* Client Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b backdrop-blur-2xl border-border/50 relative z-10" style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 24px rgba(31, 38, 135, 0.1), 0 0 20px rgba(99, 102, 241, 0.05)',
      }}>
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
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Apple-style Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-12 sm:mb-16">
          {/* Background image overlay */}
          <div className="absolute inset-0">
            <img 
              src="/lovable-uploads/8bfe05d5-a78c-4a87-94f7-be1c59fe094d.png"
              alt="Person reading in library"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-hero opacity-85 animate-gradient"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-mesh"></div>
          
          {/* Particle effects */}
          <ParticleBackground />
          
          {/* Animated blobs */}
          <AnimatedBlob className="w-64 h-64 bg-primary/10 top-0 -left-8" delay={0} />
          <AnimatedBlob className="w-80 h-80 bg-purple-400/10 bottom-0 -right-8" delay={2} />
          
          {/* Content */}
          <div className="relative z-10 text-center py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Discover Your Next
                <br />
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Great Read
                </span>
              </motion.h1>
              <motion.p 
                className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Explore our curated collection of academic and reference books with our modern, intuitive browsing experience
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Library Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <LibraryStats {...stats} />
        </motion.div>

        {/* Search Section with Apple-style glass morphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 sm:mb-12 relative"
        >
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 backdrop-blur-2xl">
            <SimpleSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </motion.div>

        {/* Browse by Category */}
        {!searchQuery && !selectedCategory && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Browse by Category
              </h2>
              <p className="text-muted-foreground">
                Explore our collection by subject area
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <CategoryCard
                    name={category.name}
                    icon={category.icon}
                    count={Math.floor(Math.random() * 50) + 10}
                    description={category.description}
                    gradient={category.gradient}
                    onClick={() => setSelectedCategory(category.name)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Apple-style Books Grid Section */}
        <section className="relative">
          {/* Category filter badge */}
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Viewing:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="gap-2 shadow-neumorphic"
                >
                  {selectedCategory}
                  <span className="text-muted-foreground">×</span>
                </Button>
              </div>
            </motion.div>
          )}

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
                {searchQuery 
                  ? "Try adjusting your search terms or explore our featured collection"
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

        {/* Reading Community Section */}
        <section className="relative mt-16 sm:mt-24">
          <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 backdrop-blur-2xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Join Our Reading Community
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Discover the joy of reading with fellow book enthusiasts from all walks of life
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group hover:scale-105 transition-transform duration-300">
                <img 
                  src="/lovable-uploads/aa64d050-5501-455a-adc8-a2244b8f98ec.png"
                  alt="Child reading in library"
                  className="w-full h-48 sm:h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold text-sm sm:text-base">Young Readers</p>
                  <p className="text-xs sm:text-sm opacity-90">Building lifelong habits</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group hover:scale-105 transition-transform duration-300">
                <img 
                  src="/lovable-uploads/4bd5adac-a4cc-49e8-b967-c89183ed7483.png"
                  alt="Professional woman reading"
                  className="w-full h-48 sm:h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold text-sm sm:text-base">Professionals</p>
                  <p className="text-xs sm:text-sm opacity-90">Continuous learning</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group hover:scale-105 transition-transform duration-300">
                <img 
                  src="/lovable-uploads/4d180e09-c1bc-4178-b708-c35fe7506ba6.png"
                  alt="Children reading together outdoors"
                  className="w-full h-48 sm:h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold text-sm sm:text-base">Study Groups</p>
                  <p className="text-xs sm:text-sm opacity-90">Learning together</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl group hover:scale-105 transition-transform duration-300">
                <img 
                  src="/lovable-uploads/b5baaf58-aae3-46c9-afb3-365855bf8d24.png"
                  alt="Man reading with coffee"
                  className="w-full h-48 sm:h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold text-sm sm:text-base">Relaxed Reading</p>
                  <p className="text-xs sm:text-sm opacity-90">Comfort & knowledge</p>
                </div>
              </div>
            </div>
          </div>
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