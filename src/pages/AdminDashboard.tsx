import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  BookCheck,
  UserCheck
} from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  activeLoans: number;
  pendingRequests: number;
  overdueItems: number;
  totalMembers: number;
}

interface RecentActivity {
  id: string;
  actor: string;
  action: string;
  details: any;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalCopies: 0,
    activeLoans: 0,
    pendingRequests: 0,
    overdueItems: 0,
    totalMembers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Check admin authentication
  useEffect(() => {
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }
  }, [navigate]);

  // Realtime subscriptions for live updates
  useRealtimeSubscription({
    table: 'borrow_requests',
    onInsert: () => fetchStats(),
    onUpdate: () => fetchStats(),
  });

  useRealtimeSubscription({
    table: 'loans',
    onInsert: () => fetchStats(),
    onUpdate: () => fetchStats(),
  });

  useRealtimeSubscription({
    table: 'activity_log',
    onInsert: (payload) => {
      fetchRecentActivity();
      // Show toast notification for important activities
      if (payload.new?.action.includes('request') || payload.new?.action.includes('loan')) {
        toast({
          title: "New Activity",
          description: `${payload.new.action} by ${payload.new.actor}`,
        });
      }
    },
  });

  const fetchStats = async () => {
    try {
      // Fetch dashboard statistics
      const [booksResult, copiesResult, loansResult, requestsResult, overdueResult] = await Promise.all([
        (supabase as any).from('books').select('*', { count: 'exact' }),
        (supabase as any).from('copies').select('*', { count: 'exact' }),
        (supabase as any).from('loans').select('*', { count: 'exact' }).eq('status', 'active'),
        (supabase as any).from('borrow_requests').select('*', { count: 'exact' }).eq('status', 'pending'),
        (supabase as any).from('loans').select('*', { count: 'exact' }).eq('status', 'overdue'),
      ]);

      setStats({
        totalBooks: booksResult.count || 0,
        totalCopies: copiesResult.count || 0,
        activeLoans: loansResult.count || 0,
        pendingRequests: requestsResult.count || 0,
        overdueItems: overdueResult.count || 0,
        totalMembers: 0, // This could be calculated from unique borrowers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentActivity()]);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      description: "Unique titles in collection",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Copies", 
      value: stats.totalCopies,
      description: "Physical copies available",
      icon: BookCheck,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Active Loans",
      value: stats.activeLoans,
      description: "Currently borrowed",
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      description: "Awaiting approval",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Overdue Items",
      value: stats.overdueItems,
      description: "Past due date",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Library Members",
      value: stats.totalMembers,
      description: "Registered users",
      icon: UserCheck,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const quickActions = [
    {
      title: "Review Requests",
      description: "Approve or reject borrow requests",
      action: () => navigate('/admin/requests'),
      color: "bg-gradient-primary",
      count: stats.pendingRequests,
    },
    {
      title: "Manage Loans",
      description: "View and update active loans",
      action: () => navigate('/admin/loans'),
      color: "bg-gradient-secondary",
      count: stats.activeLoans,
    },
    {
      title: "Handle Overdue",
      description: "Process overdue returns",
      action: () => navigate('/admin/overdue'),
      color: "bg-gradient-glass",
      count: stats.overdueItems,
    },
    {
      title: "Manage Inventory",
      description: "Add books and copies",
      action: () => navigate('/admin/inventory'),
      color: "bg-card",
    },
  ];

  return (
    <BookHiveLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Library Dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Monitor and manage your library operations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="shadow-neumorphic"
              onClick={() => navigate('/client')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Client Portal</span>
              <span className="sm:hidden">Portal</span>
            </Button>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
              <span className="hidden sm:inline">Live Updates Active</span>
              <span className="sm:hidden">Live</span>
            </Badge>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-gradient-secondary shadow-neumorphic border-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <Card 
              key={action.title} 
              className={`${action.color} backdrop-blur-md border-0 shadow-neumorphic hover:shadow-glow transition-all duration-300 cursor-pointer`}
              onClick={action.action}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                    {action.title}
                  </CardTitle>
                  {action.count !== undefined && action.count > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {action.count}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-card-foreground/80 text-xs sm:text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recent activity to display
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between p-3 bg-card/50 rounded-xl border border-border/50"
                  >
                    <div>
                      <p className="font-medium text-card-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by {activity.actor}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </BookHiveLayout>
  );
}