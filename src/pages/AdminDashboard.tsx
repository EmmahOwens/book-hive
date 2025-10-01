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
import { LoansTrendChart } from "@/components/LoansTrendChart";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { motion } from "framer-motion";

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
  const [loansTrendData, setLoansTrendData] = useState([
    { month: "Jan", loans: 45, returns: 38 },
    { month: "Feb", loans: 52, returns: 45 },
    { month: "Mar", loans: 61, returns: 50 },
    { month: "Apr", loans: 58, returns: 55 },
    { month: "May", loans: 67, returns: 60 },
    { month: "Jun", loans: 73, returns: 65 },
  ]);

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
              <UserCheck className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Client Portal</span>
              <span className="sm:hidden">Client</span>
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
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="bg-gradient-secondary shadow-neumorphic border-0 hover:shadow-glow transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    <AnimatedCounter end={stat.value} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Loans Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <LoansTrendChart data={loansTrendData} />
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <Card 
                className={`${action.color} backdrop-blur-md border-0 shadow-neumorphic hover:shadow-glow transition-all duration-300 cursor-pointer hover:scale-105`}
                onClick={action.action}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                      {action.title}
                    </CardTitle>
                    {action.count !== undefined && action.count > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs animate-pulse-glow">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-card-foreground/80 text-xs sm:text-sm">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <Card className="glass backdrop-blur-md border-border/50 shadow-glass">
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
                  recentActivity.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-card/50 rounded-xl border border-border/50 hover:bg-card/80 transition-colors duration-300"
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
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reading Community Insights */}
        <Card className="bg-gradient-secondary backdrop-blur-md border-0 shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Reading Community Insights</CardTitle>
            <CardDescription>
              Visual overview of our diverse reading community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative overflow-hidden rounded-xl group">
                <img 
                  src="/lovable-uploads/d5db78c0-ff92-42fd-b5ad-b0ab4bdeb1e8.png"
                  alt="Children reading together"
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="text-sm font-semibold">Young Readers</p>
                  <p className="text-xs opacity-90">Ages 5-12</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl group">
                <img 
                  src="/lovable-uploads/7635b99b-4e4f-4208-ad6e-9bb52cae4d22.png"
                  alt="Happy child reading"
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="text-sm font-semibold">Early Learning</p>
                  <p className="text-xs opacity-90">Toddlers</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl group">
                <img 
                  src="/lovable-uploads/4bd5adac-a4cc-49e8-b967-c89183ed7483.png"
                  alt="Professional reading"
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="text-sm font-semibold">Professionals</p>
                  <p className="text-xs opacity-90">Adults</p>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl group">
                <img 
                  src="/lovable-uploads/b5baaf58-aae3-46c9-afb3-365855bf8d24.png"
                  alt="Casual reading"
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="text-sm font-semibold">Leisure Readers</p>
                  <p className="text-xs opacity-90">All ages</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="bg-primary/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-primary">45%</div>
                <p className="text-sm text-muted-foreground">Young Readers</p>
              </div>
              <div className="bg-success/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-success">25%</div>
                <p className="text-sm text-muted-foreground">Professionals</p>
              </div>
              <div className="bg-warning/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-warning">20%</div>
                <p className="text-sm text-muted-foreground">Students</p>
              </div>
              <div className="bg-info/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-info">10%</div>
                <p className="text-sm text-muted-foreground">Others</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BookHiveLayout>
  );
}