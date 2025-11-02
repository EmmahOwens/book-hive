import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, Eye, User, Phone, Mail } from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { BouncingBookLoader } from "@/components/BouncingBookLoader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNotification } from "@/hooks/useNotification";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface BorrowRequest {
  id: string;
  requester_name: string;
  email: string;
  phone?: string;
  affiliation: string;
  id_number: string;
  requested_items: Array<{
    title: string;
    authors?: string[];
    id?: string;
  }>;
  desired_duration_days: number;
  purpose?: string;
  pickup_location: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchRequests();
  }, [navigate]);

  // Setup realtime subscription for borrow requests
  useRealtimeSubscription({
    table: 'borrow_requests',
    onInsert: () => fetchRequests(),
    onUpdate: () => fetchRequests(),
    onDelete: () => fetchRequests(),
  });

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle Json type
      const transformedData = (data || []).map(request => ({
        ...request,
        requested_items: Array.isArray(request.requested_items) 
          ? request.requested_items 
          : typeof request.requested_items === 'string'
            ? JSON.parse(request.requested_items)
            : []
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      showNotification(
        'error',
        'Loading Error',
        'Failed to load borrow requests. Please refresh the page.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // Call edge function to process the request
      const { data, error } = await supabase.functions.invoke('process-borrow-request', {
        body: {
          requestId,
          action: status,
          adminEmail: sessionStorage.getItem('admin_email') || 'admin'
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to process request');
      }

      // Refresh requests list
      fetchRequests();

      showNotification(
        'success',
        `Request ${status === 'approved' ? 'Approved' : 'Rejected'}!`,
        status === 'approved' 
          ? 'The borrow request has been approved. An email notification has been sent to the requester.'
          : 'The borrow request has been rejected. The requester has been notified.'
      );
    } catch (error: any) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} request:`, error);
      showNotification(
        'error',
        'Action Failed',
        error.message || `Failed to ${status === 'approved' ? 'approve' : 'reject'} the request. Please try again.`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-warning text-warning-foreground';
      case 'approved': return 'bg-gradient-success text-success-foreground';
      case 'rejected': return 'bg-gradient-destructive text-destructive-foreground';
      default: return 'bg-gradient-secondary text-secondary-foreground';
    }
  };

  if (isLoading) {
    return (
      <BookHiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <BouncingBookLoader text="Loading requests..." />
        </div>
      </BookHiveLayout>
    );
  }

  return (
    <BookHiveLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Borrow Requests
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and process library borrow requests
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {requests.length === 0 ? (
            <Card className="bg-gradient-glass backdrop-blur-md border-border/50 animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-lg text-muted-foreground">No borrow requests found</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request, index) => (
              <Card 
                key={request.id} 
                className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass hover:shadow-glow transition-all duration-300 animate-fade-in-up group"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg sm:text-xl truncate">{request.requester_name}</CardTitle>
                        <CardDescription className="truncate">{request.affiliation}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{request.email}</span>
                      </div>
                      {request.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{request.phone}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">ID:</span> {request.id_number}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Duration:</span> {request.desired_duration_days} days
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Pickup Location:</span> {request.pickup_location}
                      </div>
                      {request.purpose && (
                        <div className="text-sm">
                          <span className="font-medium">Purpose:</span> {request.purpose}
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="font-medium">Requested:</span> {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Requested Items ({request.requested_items.length})</h4>
                    <div className="space-y-1">
                      {request.requested_items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="text-sm bg-secondary/20 rounded-lg p-2">
                          {item.title} by {item.authors?.join(', ')}
                        </div>
                      ))}
                      {request.requested_items.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{request.requested_items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {request.admin_notes && (
                    <div className="bg-secondary/20 rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-1">Admin Notes</h4>
                      <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button size="sm" className="flex items-center justify-center gap-2 w-full sm:w-auto hover-lift">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    {request.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="flex items-center justify-center gap-2 w-full sm:w-auto hover-lift hover-glow"
                          onClick={() => handleRequestAction(request.id, 'approved')}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex items-center justify-center gap-2 w-full sm:w-auto hover-lift"
                          onClick={() => handleRequestAction(request.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
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