import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BorrowModal } from "@/components/BorrowModal";
import { 
  ArrowLeft, 
  Book, 
  Calendar, 
  Users, 
  BookOpen, 
  Globe, 
  Building,
  Hash,
  Star,
  Clock
} from "lucide-react";

interface BookDetails {
  id: string;
  title: string;
  authors: string[];
  description: string;
  level: string;
  categories: string[];
  cover_path: string;
  available_count: number;
  total_copies: number;
}

interface RelatedBook {
  id: string;
  title: string;
  authors: string[];
  cover_path: string;
  available_count: number;
}

const BookDetails = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
      fetchRelatedBooks();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('books_view')
        .select('*')
        .eq('id', bookId)
        .maybeSingle();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast({
        title: "Error",
        description: "Failed to load book details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books_view')
        .select('id, title, authors, cover_path, available_count')
        .neq('id', bookId)
        .limit(4);

      if (error) throw error;
      setRelatedBooks(data || []);
    } catch (error) {
      console.error('Error fetching related books:', error);
    }
  };

  const handleBorrowSubmit = async (borrowData: any) => {
    try {
      const { error } = await supabase
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

      if (error) throw error;

      setShowBorrowModal(false);
      toast({
        title: "Request Submitted",
        description: "Your borrow request has been submitted successfully!",
      });
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Book className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/client')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b bg-card/50 backdrop-blur-md">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-lg font-semibold">Book Details</h1>
        <div className="w-20"></div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Book Overview */}
            <Card className="glass rounded-3xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
                {/* Book Cover */}
                <div className="md:col-span-1">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted/50 flex items-center justify-center shadow-apple-lg">
                    {book.cover_path ? (
                      <img
                        src={book.cover_path}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Book className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h1 className="headline-medium text-3xl mb-3">{book.title}</h1>
                    <p className="text-xl text-muted-foreground mb-4">
                      by {book.authors.join(", ")}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full">
                        {book.level}
                      </Badge>
                      {book.categories.map((category) => (
                        <Badge key={category} variant="outline" className="px-3 py-1 rounded-full">
                          {category}
                        </Badge>
                      ))}
                    </div>

                    {/* Availability */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        book.available_count > 0 ? "bg-success/10" : "bg-destructive/10"
                      }`}>
                        <BookOpen className={`w-6 h-6 ${
                          book.available_count > 0 ? "text-success" : "text-destructive"
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {book.available_count > 0 
                            ? `${book.available_count} of ${book.total_copies} available` 
                            : "Currently unavailable"
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {book.available_count > 0 ? "Ready to borrow" : "All copies are currently on loan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setShowBorrowModal(true)}
                      disabled={book.available_count === 0}
                      className="flex-1 rounded-full py-3 font-semibold"
                      size="lg"
                    >
                      {book.available_count > 0 ? "Borrow This Book" : "Unavailable"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  About This Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {book.description || "No description available for this book."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Details */}
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg">Book Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Book className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Level</p>
                    <p className="text-sm text-muted-foreground">{book.level || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Total Copies</p>
                    <p className="text-sm text-muted-foreground">{book.total_copies}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Available Copies</p>
                    <p className="text-sm text-muted-foreground">{book.available_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Books */}
            {relatedBooks.length > 0 && (
              <Card className="glass rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">Related Books</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedBooks.map((relatedBook) => (
                    <div
                      key={relatedBook.id}
                      className="flex gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/client/book/${relatedBook.id}`)}
                    >
                      <div className="w-12 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {relatedBook.cover_path ? (
                          <img
                            src={relatedBook.cover_path}
                            alt={relatedBook.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Book className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm line-clamp-2">{relatedBook.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {relatedBook.authors.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {relatedBook.available_count > 0 ? "Available" : "Unavailable"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Modal */}
      <BorrowModal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        book={book ? {
          id: book.id,
          title: book.title,
          authors: book.authors,
          availableCount: book.available_count,
        } : null}
        onSubmit={handleBorrowSubmit}
      />
    </div>
  );
};

export default BookDetails;