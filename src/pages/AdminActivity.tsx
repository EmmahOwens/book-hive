import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Clock, User, Filter } from "lucide-react";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  details: any;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

export default function AdminActivity() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("24h");
  const navigate = useNavigate();

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    fetchActivityLogs();
  }, [navigate, filter, timeRange]);

  const fetchActivityLogs = async () => {
    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply time range filter
      const now = new Date();
      let timeFilter = new Date();
      
      switch (timeRange) {
        case '1h':
          timeFilter.setHours(now.getHours() - 1);
          break;
        case '24h':
          timeFilter.setHours(now.getHours() - 24);
          break;
        case '7d':
          timeFilter.setDate(now.getDate() - 7);
          break;
        case '30d':
          timeFilter.setDate(now.getDate() - 30);
          break;
        default:
          timeFilter = null;
      }

      if (timeFilter) {
        query = query.gte('created_at', timeFilter.toISOString());
      }

      // Apply action filter
      if (filter !== 'all') {
        query = query.ilike('action', `%${filter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null,
        user_agent: log.user_agent as string | null,
      }));
      
      setActivityLogs(transformedData);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return 'bg-success/10 text-success border-success/20';
    } else if (action.includes('update') || action.includes('modify')) {
      return 'bg-info/10 text-info border-info/20';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    } else if (action.includes('login') || action.includes('auth')) {
      return 'bg-warning/10 text-warning border-warning/20';
    }
    return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
  };

  const formatDetails = (details: any) => {
    if (!details || typeof details !== 'object') return '';
    
    const entries = Object.entries(details);
    if (entries.length === 0) return '';
    
    return entries.slice(0, 3).map(([key, value]) => 
      `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`
    ).join(', ');
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
              Activity Log
            </h1>
            <p className="text-muted-foreground">
              Monitor system activities and user actions
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Activity className="w-4 h-4 mr-2" />
            {activityLogs.length} Activities
          </Badge>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-glass backdrop-blur-md border-border/50">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login/Auth</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                  <SelectItem value="loan">Loans</SelectItem>
                  <SelectItem value="book">Books</SelectItem>
                  <SelectItem value="create">Creates</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                  <SelectItem value="delete">Deletes</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={fetchActivityLogs}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <div className="grid gap-4">
          {activityLogs.length === 0 ? (
            <Card className="bg-gradient-glass backdrop-blur-md border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No activity logs found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            activityLogs.map((log) => (
              <Card key={log.id} className="bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass hover:shadow-glow transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="text-sm font-medium">{log.actor}</span>
                        </div>
                        
                        {log.entity_type && (
                          <div className="text-sm text-muted-foreground mb-1">
                            Entity: {log.entity_type} {log.entity_id && `(${log.entity_id.slice(0, 8)}...)`}
                          </div>
                        )}
                        
                        {formatDetails(log.details) && (
                          <div className="text-sm text-muted-foreground bg-secondary/20 rounded p-2 mt-2">
                            {formatDetails(log.details)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                      <div>
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </div>
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