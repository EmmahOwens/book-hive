import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";

interface HeaderProps {
  showSidebarTrigger?: boolean;
}

export function Header({ showSidebarTrigger = false }: HeaderProps) {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('/admin');

  return (
    <header 
      className="h-16 flex items-center justify-between px-6 border-b animate-slide-in sticky top-0 z-50 backdrop-blur-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 24px rgba(31, 38, 135, 0.1), 0 0 20px rgba(99, 102, 241, 0.05)',
      }}
    >
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger className="lg:hidden" />}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-secondary flex items-center justify-center hover-wiggle cursor-pointer group">
            <img 
              src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
              alt="Book Hive Logo" 
              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Book Hive
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdminRoute ? "Administrator Portal" : "Discover & Borrow Books"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 animate-fade-in" style={{animationDelay: '0.2s'}}>
        {!isAdminRoute && (
          <Button variant="outline" size="sm" className="glass-interactive hover-lift">
            <User className="w-4 h-4 mr-2" />
            My Account
          </Button>
        )}
      </div>
    </header>
  );
}