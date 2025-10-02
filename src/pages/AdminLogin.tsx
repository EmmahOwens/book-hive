import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BookHiveLayout } from "@/components/BookHiveLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNotification } from "@/hooks/useNotification";

const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type AdminLoginData = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const form = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleSubmit = async (data: AdminLoginData) => {
    setIsLoading(true);
    
    try {
      // Call Edge Function to verify admin password
      const { data: result, error } = await supabase.functions.invoke('admin-check-password', {
        body: { password: data.password }
      });

      if (error) {
        console.error('Admin login error:', error);
        showNotification(
          'error',
          'Authentication Failed',
          'Invalid admin password. Please try again.'
        );
        return;
      }

      if (result?.success) {
        // Store admin token in sessionStorage for this session
        sessionStorage.setItem('admin_token', result.token);
        
        showNotification(
          'success',
          'Welcome, Administrator!',
          'You have been successfully authenticated and will be redirected to the dashboard.'
        );
        
        setTimeout(() => navigate('/admin'), 1500);
      } else {
        showNotification(
          'error',
          'Authentication Failed',
          'Invalid admin password. Please try again.'
        );
      }
    } catch (error) {
      console.error('Admin login error:', error);
      showNotification(
        'error',
        'Authentication Error',
        'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BookHiveLayout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary p-6">
        <Card className="w-full max-w-md bg-gradient-glass backdrop-blur-md border-border/50 shadow-glass">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-neumorphic">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Administrator Access
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Enter your admin credentials to access the management dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Admin Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter admin password"
                            className="pr-10 bg-card/50 border-border/50 shadow-neumorphic-inset"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary shadow-neumorphic hover:shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Access Dashboard"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact your system administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BookHiveLayout>
  );
}