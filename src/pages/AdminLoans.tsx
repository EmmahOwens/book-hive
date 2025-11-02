import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Calendar, User, RotateCcw } from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { BouncingBookLoader } from "@/components/BouncingBookLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Loan {
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

export default function AdminLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchLoans();
  }, [navigate]);

  // Setup realtime subscription for loans
  useRealtimeSubscription({
    table: 'loans',
    onInsert: () => fetchLoans(),
    onUpdate: () => fetchLoans(),
    onDelete: () => fetchLoans(),
  });

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('status', 'active')
        .order('due_date');

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast({
        title: "Error",
        description: "Failed to load active loans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: `${Math.abs(diffDays)} days overdue`, color: 'bg-gradient-destructive text-destructive-foreground' };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: 'bg-gradient-warning text-warning-foreground' };
    } else {
      return { status: 'good', label: `Due in ${diffDays} days`, color: 'bg-gradient-success text-success-foreground' };
    }
  };

  const handleLoanAction = async (loanId: string, action: 'return' | 'renew') => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-loan', {
        body: {
          loanId,
          action,
          adminEmail: sessionStorage.getItem('admin_email') || 'admin'
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || `Failed to ${action} loan`);
      }

      fetchLoans();

      toast({
        title: "Success",
        description: `Loan ${action === 'return' ? 'returned' : 'renewed'} successfully`,
      });
    } catch (error: any) {
      console.error(`Error ${action}ing loan:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} loan`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <BookHiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <BouncingBookLoader text="Loading loans..." />
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
              Active Loans
            </h1>
            <p className="text-muted-foreground">
              Monitor and manage current book loans
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {loans.length === 0 ? (
            <Card className="bg-gradient-glass backdrop-blur-md border-border/50 animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-lg text-muted-foreground">No active loans found</p>
              </CardContent>
            </Card>
          ) : (
            loans.map((loan, index) => {
              const dueDateInfo = getDueDateStatus(loan.due_date);
              return (
                <Card 
                  key={loan.id} 
                  className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass hover:shadow-glow transition-all duration-300 animate-fade-in-up group"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                          <User className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{loan.borrower_name}</CardTitle>
                          <CardDescription>{loan.borrower_email}</CardDescription>
                        </div>
                      </div>
                      <Badge className={dueDateInfo.color}>
                        {dueDateInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Issued: {new Date(loan.issued_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                        </div>
                        {loan.borrower_phone && (
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span> {loan.borrower_phone}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Copy ID:</span> {loan.copy_id}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Renewals:</span> {loan.renewal_count}
                        </div>
                        {loan.late_fee > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Late Fee:</span> ${loan.late_fee}
                          </div>
                        )}
                      </div>
                    </div>

                    {loan.notes && (
                      <div className="bg-secondary/20 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground">{loan.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        size="sm" 
                        className="flex items-center gap-2 hover-lift"
                        onClick={() => handleLoanAction(loan.id, 'return')}
                      >
                        <BookOpen className="w-4 h-4" />
                        Return Book
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-2 hover-lift"
                        onClick={() => handleLoanAction(loan.id, 'renew')}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Renew Loan
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