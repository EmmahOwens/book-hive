import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Book, Plus, Search, Edit, Trash2 } from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BookWithCopies {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  description?: string;
  total_copies: number;
  available_count: number;
  created_at: string;
}

export default function AdminInventory() {
  const [books, setBooks] = useState<BookWithCopies[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchBooks();
  }, [navigate]);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books_realtime_view')
        .select('*')
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load book inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    if (percentage === 0) return 'bg-gradient-destructive text-destructive-foreground';
    if (percentage <= 30) return 'bg-gradient-warning text-warning-foreground';
    return 'bg-gradient-success text-success-foreground';
  };

  if (isLoading) {
    return (
      <BookHiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </BookHiveLayout>
    );
  }

  return (
    <BookHiveLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Book Inventory
            </h1>
            <p className="text-muted-foreground">
              Manage your library's book collection
            </p>
          </div>
          <Button className="bg-gradient-primary shadow-neumorphic hover:shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Add New Book
          </Button>
        </div>

        <Card className="bg-gradient-glass backdrop-blur-md border-border/50">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search books by title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {filteredBooks.length === 0 ? (
            <Card className="bg-gradient-glass backdrop-blur-md border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Book className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {searchTerm ? "No books found matching your search" : "No books in inventory"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBooks.map((book) => (
              <Card key={book.id} className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Book className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{book.title}</CardTitle>
                        <CardDescription>
                          {book.authors?.join(', ')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getAvailabilityColor(book.available_count, book.total_copies)}>
                      {book.available_count}/{book.total_copies} Available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {book.isbn && (
                        <div className="text-sm">
                          <span className="font-medium">ISBN:</span> {book.isbn}
                        </div>
                      )}
                      {book.publisher && (
                        <div className="text-sm">
                          <span className="font-medium">Publisher:</span> {book.publisher}
                        </div>
                      )}
                      {book.publication_year && (
                        <div className="text-sm">
                          <span className="font-medium">Year:</span> {book.publication_year}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Total Copies:</span> {book.total_copies}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Available:</span> {book.available_count}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">On Loan:</span> {book.total_copies - book.available_count}
                      </div>
                    </div>
                  </div>

                  {book.description && (
                    <div className="bg-secondary/20 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {book.description}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Copy
                    </Button>
                    <Button size="sm" variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </BookHiveLayout>
  );
}