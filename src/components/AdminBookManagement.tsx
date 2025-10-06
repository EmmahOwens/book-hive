import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Book, 
  Search,
  Copy,
  Package
} from "lucide-react";

interface BookFormData {
  title: string;
  authors: string[];
  description: string;
  isbn: string;
  publisher: string;
  publication_year: string;
  edition: string;
  language: string;
  level_id: string;
  categories: string[];
}

interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  edition?: string;
  language?: string;
  level: string;
  categories: string[];
  total_copies: number;
  available_count: number;
}

interface Level {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const initialFormData: BookFormData = {
  title: "",
  authors: [],
  description: "",
  isbn: "",
  publisher: "",
  publication_year: "",
  edition: "",
  language: "English",
  level_id: "",
  categories: [],
};

export function AdminBookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);
  const [authorInput, setAuthorInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchBooks();
    fetchLevels();
    fetchCategories();
  }, []);

  // Setup realtime subscriptions for books and copies
  useRealtimeSubscription({
    table: 'books',
    onInsert: () => fetchBooks(),
    onUpdate: () => fetchBooks(),
    onDelete: () => fetchBooks(),
  });

  useRealtimeSubscription({
    table: 'copies',
    onInsert: () => fetchBooks(),
    onUpdate: () => fetchBooks(),
    onDelete: () => fetchBooks(),
  });

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books_view')
        .select('*')
        .order('title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('name');

      if (error) throw error;
      setLevels(data || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddAuthor = () => {
    if (authorInput.trim() && !formData.authors.includes(authorInput.trim())) {
      setFormData({
        ...formData,
        authors: [...formData.authors, authorInput.trim()]
      });
      setAuthorInput("");
    }
  };

  const removeAuthor = (author: string) => {
    setFormData({
      ...formData,
      authors: formData.authors.filter(a => a !== author)
    });
  };

  const handleCategoryToggle = (categoryId: string, categoryName: string) => {
    const isSelected = selectedCategories.includes(categoryId);
    let newSelected: string[];
    let newCategoryNames: string[];

    if (isSelected) {
      newSelected = selectedCategories.filter(id => id !== categoryId);
      newCategoryNames = formData.categories.filter(name => name !== categoryName);
    } else {
      newSelected = [...selectedCategories, categoryId];
      newCategoryNames = [...formData.categories, categoryName];
    }

    setSelectedCategories(newSelected);
    setFormData({
      ...formData,
      categories: newCategoryNames
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || formData.authors.length === 0) {
      toast({
        title: "Error",
        description: "Title and at least one author are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const adminToken = sessionStorage.getItem('admin_token');
      if (!adminToken) {
        toast({
          title: "Error",
          description: "Admin session expired. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const bookData = {
        title: formData.title,
        authors: formData.authors,
        description: formData.description,
        isbn: formData.isbn,
        publisher: formData.publisher,
        publication_year: formData.publication_year,
        edition: formData.edition,
        language: formData.language,
        level_id: formData.level_id,
        categories: selectedCategories,
      };

      const { data, error } = await supabase.functions.invoke('admin-manage-book', {
        body: {
          action: editingBook ? 'update' : 'create',
          bookData,
          bookId: editingBook?.id,
        },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Operation failed');

      toast({
        title: "Success",
        description: editingBook ? "Book updated successfully!" : "Book and initial copy added successfully!",
      });

      fetchBooks();
      setShowAddDialog(false);
      setEditingBook(null);
      setFormData(initialFormData);
      setSelectedCategories([]);
    } catch (error) {
      console.error('Error saving book:', error);
      toast({
        title: "Error",
        description: "Failed to save book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      authors: book.authors,
      description: book.description || "",
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      publication_year: book.publication_year?.toString() || "",
      edition: book.edition || "",
      language: book.language || "English",
      level_id: levels.find(l => l.name === book.level)?.id || "",
      categories: book.categories,
    });
    setSelectedCategories(
      book.categories.map(catName => 
        categories.find(c => c.name === catName)?.id || ""
      ).filter(id => id !== "")
    );
    setShowAddDialog(true);
  };

  const handleDelete = async (bookId: string) => {
    try {
      const adminToken = sessionStorage.getItem('admin_token');
      if (!adminToken) {
        toast({
          title: "Error",
          description: "Admin session expired. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-book', {
        body: {
          action: 'delete',
          bookId,
        },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Delete operation failed');

      toast({
        title: "Success",
        description: "Book deleted successfully!",
      });

      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCopy = async (bookId: string) => {
    try {
      const adminToken = sessionStorage.getItem('admin_token');
      if (!adminToken) {
        toast({
          title: "Error",
          description: "Admin session expired. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-manage-copy', {
        body: { bookId },
        headers: {
          Authorization: `Bearer ${adminToken}`,
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Add copy operation failed');

      toast({
        title: "Success",
        description: "New copy added successfully!",
      });

      fetchBooks();
    } catch (error) {
      console.error('Error adding copy:', error);
      toast({
        title: "Error",
        description: "Failed to add copy. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Book Management</h2>
          <p className="text-muted-foreground">Manage your library's book collection</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBook(null);
              setFormData(initialFormData);
              setSelectedCategories([]);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBook ? "Edit Book" : "Add New Book"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter book title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    placeholder="Enter ISBN"
                  />
                </div>

                <div>
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                    placeholder="Enter publisher"
                  />
                </div>

                <div>
                  <Label htmlFor="publication_year">Publication Year</Label>
                  <Input
                    id="publication_year"
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                    placeholder="Enter year"
                  />
                </div>

                <div>
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    value={formData.edition}
                    onChange={(e) => setFormData({...formData, edition: e.target.value})}
                    placeholder="Enter edition"
                  />
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    placeholder="Enter language"
                  />
                </div>

                <div>
                  <Label htmlFor="level">Academic Level</Label>
                  <Select
                    value={formData.level_id}
                    onValueChange={(value) => setFormData({...formData, level_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Authors */}
              <div>
                <Label>Authors *</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={authorInput}
                      onChange={(e) => setAuthorInput(e.target.value)}
                      placeholder="Enter author name"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAuthor())}
                    />
                    <Button type="button" onClick={handleAddAuthor}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.authors.map((author) => (
                      <Badge key={author} variant="secondary" className="gap-1">
                        {author}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeAuthor(author)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <Label>Categories</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id, category.name)}
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter book description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBook ? "Update Book" : "Add Book"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="glass rounded-2xl">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search books by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Books List */}
      <Card className="glass rounded-2xl">
        <CardHeader>
          <CardTitle>Books Collection ({filteredBooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading books...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-8">
              <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No books found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{book.title}</h3>
                      <p className="text-muted-foreground">by {book.authors.join(", ")}</p>
                      {book.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCopy(book.id)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Add Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(book)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Book</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{book.title}"? This action cannot be undone and will also delete all copies of this book.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(book.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {/* Book Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    {book.isbn && (
                      <div>
                        <span className="text-muted-foreground">ISBN:</span>
                        <span className="ml-1">{book.isbn}</span>
                      </div>
                    )}
                    {book.publisher && (
                      <div>
                        <span className="text-muted-foreground">Publisher:</span>
                        <span className="ml-1">{book.publisher}</span>
                      </div>
                    )}
                    {book.publication_year && (
                      <div>
                        <span className="text-muted-foreground">Year:</span>
                        <span className="ml-1">{book.publication_year}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Copies:</span>
                      <span className="ml-1">{book.available_count}/{book.total_copies}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {book.level}
                    </Badge>
                    {book.categories.slice(0, 3).map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                    {book.categories.length > 3 && (
                      <Badge variant="outline">
                        +{book.categories.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}