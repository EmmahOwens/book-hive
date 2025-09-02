import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";

interface BookHiveLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function BookHiveLayout({ children, showSidebar = true }: BookHiveLayoutProps) {
  const location = useLocation();
  const isClientRoute = location?.pathname.includes('/client');
  
  // Don't show sidebar for client routes
  if (!showSidebar || isClientRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}