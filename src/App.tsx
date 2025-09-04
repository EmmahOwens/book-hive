import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";
import Index from "./pages/Index";
import ClientPortal from "./pages/ClientPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminLoans from "./pages/AdminLoans";
import AdminInventory from "./pages/AdminInventory";
import BookDetails from "./pages/BookDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    // Show role selection modal on first visit
    const hasSelectedRole = sessionStorage.getItem('hasSelectedRole');
    if (!hasSelectedRole) {
      setShowRoleModal(true);
    }
  }, []);

  const handleRoleModalClose = () => {
    sessionStorage.setItem('hasSelectedRole', 'true');
    setShowRoleModal(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoleSelectionModal 
            isOpen={showRoleModal} 
            onClose={handleRoleModalClose} 
          />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/client" element={<ClientPortal />} />
            <Route path="/client/book/:bookId" element={<BookDetails />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/admin/loans" element={<AdminLoans />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
