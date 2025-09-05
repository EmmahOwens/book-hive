import { 
  Book, 
  Search, 
  Heart, 
  User,
  BarChart3,
  Users,
  BookOpen,
  Clock,
  AlertTriangle
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const clientItems = [
  { title: "Browse Books", url: "/", icon: Search },
  { title: "My Requests", url: "/my-requests", icon: BookOpen },
  { title: "Favorites", url: "/favorites", icon: Heart },
  { title: "Profile", url: "/profile", icon: User },
];

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Requests", url: "/admin/requests", icon: Users },
  { title: "Active Loans", url: "/admin/loans", icon: BookOpen },
  { title: "Overdue Items", url: "/admin/overdue", icon: Clock },
  { title: "Inventory", url: "/admin/inventory", icon: Book },
  { title: "Activity Log", url: "/admin/activity", icon: AlertTriangle },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdminSection = currentPath.includes('/admin');

  const items = isAdminSection ? adminItems : clientItems;
  const isActive = (path: string) => currentPath === path || (path === "/" && currentPath === "/");

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-primary text-primary-foreground shadow-neumorphic font-medium" 
      : "hover:bg-secondary/80 hover:shadow-neumorphic-inset transition-all duration-200";

  return (
    <Sidebar
      className={`${!open ? "w-14" : "w-64"} border-r bg-card/30 backdrop-blur-md border-border/50`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Logo Section */}
        {open && (
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-neumorphic">
              <img 
                src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
                alt="Book Hive Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Book Hive
              </h2>
            </div>
          </div>
        )}
        
        <SidebarGroup>
          <SidebarGroupLabel className={`${!open ? "hidden" : "block"} text-muted-foreground font-medium mb-2`}>
            {isAdminSection ? "Administration" : "Library Portal"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName}
                      end={item.url === '/'}
                    >
                      <div className="flex items-center gap-3 p-2 rounded-xl">
                        <item.icon className="w-5 h-5 flex-shrink-0 text-black dark:text-white" />
                        {open && (
                          <span className="font-medium text-black dark:text-white">{item.title}</span>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}