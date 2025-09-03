import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react";

interface LoanRecord {
  id: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string;
  issued_date: string;
  due_date: string;
  returned_date: string | null;
  status: string;
  late_fee: number;
  book_title: string;
  book_authors: string[];
  days_until_due: number;
  is_overdue: boolean;
}

interface BorrowRequest {
  id: string;
  requester_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  book_titles: string[];
  desired_duration_days: number;
  pickup_location: string;
}

export function ClientDashboard() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");

  useEffect(() => {
    if (searchEmail) {
      fetchUserData();
    }
  }, [searchEmail]);

  const fetchUserData = async () => {
    if (!searchEmail.trim()) return;

    try {
      setLoading(true);

      // Fetch loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          copies!inner(
            books!inner(title, authors)
          )
        `)
        .eq('borrower_email', searchEmail.trim())
        .order('issued_date', { ascending: false });

      if (loansError) throw loansError;

      // Process loans data
      const processedLoans = (loansData || []).map(loan => {
        const dueDate = new Date(loan.due_date);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...loan,
          book_title: loan.copies.books.title,
          book_authors: loan.copies.books.authors,
          days_until_due: diffDays,
          is_overdue: diffDays < 0 && !loan.returned_date
        };
      });

      setLoans(processedLoans);

      // Fetch borrow requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('email', searchEmail.trim())
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Process requests data
      const processedRequests = (requestsData || []).map(request => ({
        ...request,
        book_titles: Array.isArray(request.requested_items) 
          ? request.requested_items.map((item: any) => item.book_title || 'Unknown Book')
          : ['Unknown Book']
      }));

      setRequests(processedRequests);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'returned':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string, isOverdue: boolean = false) => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4" />;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <BookOpen className="w-4 h-4" />;
      case 'returned':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <Card className="glass rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Client Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter client email to view their records..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button onClick={fetchUserData} disabled={!searchEmail.trim() || loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchEmail && (
        <Tabs defaultValue="loans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loans" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Loans ({loans.filter(l => !l.returned_date).length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Borrow Requests ({requests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{loans.filter(l => !l.returned_date).length}</p>
                      <p className="text-sm text-muted-foreground">Active Loans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{loans.filter(l => l.is_overdue).length}</p>
                      <p className="text-sm text-muted-foreground">Overdue Books</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{loans.filter(l => l.returned_date).length}</p>
                      <p className="text-sm text-muted-foreground">Completed Loans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Loans */}
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>Loan History</CardTitle>
              </CardHeader>
              <CardContent>
                {loans.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No loan records found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loans.map((loan) => (
                      <div
                        key={loan.id}
                        className="p-4 rounded-2xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{loan.book_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              by {loan.book_authors.join(", ")}
                            </p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(loan.is_overdue ? 'overdue' : loan.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(loan.status, loan.is_overdue)}
                            {loan.is_overdue ? 'Overdue' : loan.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Issued Date</p>
                            <p className="font-medium">{new Date(loan.issued_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className={`font-medium ${loan.is_overdue ? 'text-red-600' : ''}`}>
                              {new Date(loan.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Until Due</p>
                            <p className={`font-medium ${loan.is_overdue ? 'text-red-600' : loan.days_until_due <= 3 ? 'text-yellow-600' : ''}`}>
                              {loan.is_overdue ? `${Math.abs(loan.days_until_due)} days overdue` : `${loan.days_until_due} days`}
                            </p>
                          </div>
                          {loan.returned_date && (
                            <div>
                              <p className="text-muted-foreground">Returned Date</p>
                              <p className="font-medium">{new Date(loan.returned_date).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        {loan.late_fee > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                            <p className="text-red-800 font-medium">
                              Late Fee: ${loan.late_fee.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card className="glass rounded-3xl">
              <CardHeader>
                <CardTitle>Borrow Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No borrow requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 rounded-2xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">
                              Request for {request.book_titles.join(", ")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Duration Requested</p>
                            <p className="font-medium">{request.desired_duration_days} days</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pickup Location</p>
                            <p className="font-medium">{request.pickup_location}</p>
                          </div>
                          {request.approved_at && (
                            <div>
                              <p className="text-muted-foreground">Approved Date</p>
                              <p className="font-medium">{new Date(request.approved_at).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {request.email}
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {request.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}