import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NotificationProvider } from "@/hooks/useNotification";
import { NotificationDialog } from "@/components/NotificationDialog";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminLoans from "./pages/AdminLoans";
import AdminInventory from "./pages/AdminInventory";
import AdminOverdue from "./pages/AdminOverdue";
import AdminActivity from "./pages/AdminActivity";
import BookDetails from "./pages/BookDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationDialog />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/client" replace />} />
              <Route path="/home" element={<Index />} />
              <Route path="/client" element={<ClientPortal />} />
              <Route path="/client/book/:bookId" element={<BookDetails />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<AdminRequests />} />
              <Route path="/admin/loans" element={<AdminLoans />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/overdue" element={<AdminOverdue />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
              {/* Redirect old routes to prevent 404s */}
              <Route path="/index" element={<Navigate to="/client" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
};

export default App;
