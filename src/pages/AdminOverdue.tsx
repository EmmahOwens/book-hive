import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, User, Mail, Phone } from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OverdueLoan {
  id: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone?: string;
  issued_date: string;
  due_date: string;
  status: string;
  renewal_count: number;
  late_fee: number;
  copy_id: string;
  notes?: string;
}

export default function AdminOverdue() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchOverdueLoans();
  }, [navigate]);

  const fetchOverdueLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('status', 'overdue')
        .order('due_date');

      if (error) throw error;
      setOverdueLoans(data || []);
    } catch (error) {
      console.error('Error fetching overdue loans:', error);
      toast({
        title: "Error",
        description: "Failed to load overdue loans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateLateFee = (daysOverdue: number) => {
    return Math.min(daysOverdue * 0.50, 25.00); // $0.50 per day, max $25
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
              Overdue Items
            </h1>
            <p className="text-muted-foreground">
              Manage overdue book returns and late fees
            </p>
          </div>
          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {overdueLoans.length} Overdue
          </Badge>
        </div>

        <div className="grid gap-6">
          {overdueLoans.length === 0 ? (
            <Card className="bg-gradient-glass backdrop-blur-md border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No overdue items found</p>
                <p className="text-sm text-muted-foreground">All loans are on time!</p>
              </CardContent>
            </Card>
          ) : (
            overdueLoans.map((loan) => {
              const daysOverdue = getDaysOverdue(loan.due_date);
              const suggestedLateFee = calculateLateFee(daysOverdue);
              
              return (
                <Card key={loan.id} className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass hover:shadow-glow transition-all duration-300 border-l-4 border-l-destructive">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{loan.borrower_name}</CardTitle>
                          <CardDescription>{loan.borrower_email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{loan.borrower_email}</span>
                        </div>
                        {loan.borrower_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-primary" />
                            <span>{loan.borrower_phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Copy ID:</span> {loan.copy_id}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Current Late Fee:</span> ${loan.late_fee.toFixed(2)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Suggested Fee:</span> ${suggestedLateFee.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-destructive/10 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-1 text-destructive">Overdue Notice</h4>
                      <p className="text-sm text-muted-foreground">
                        This item was due on {new Date(loan.due_date).toLocaleDateString()}. 
                        Please contact the borrower to arrange return.
                      </p>
                    </div>

                    {loan.notes && (
                      <div className="bg-secondary/20 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">{loan.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Reminder
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Mark Returned
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Update Fee
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </BookHiveLayout>
  );
}