import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, UserCheck } from "lucide-react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const navigate = useNavigate();

  const handleRoleSelection = (role: 'client' | 'librarian') => {
    if (role === 'client') {
      navigate('/client');
    } else {
      navigate('/admin/login');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border">
        <DialogHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-apple-lg">
            <Book className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to Book Hive
          </DialogTitle>
          <p className="text-lg text-muted-foreground mt-2">
            Please select your role to continue
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            onClick={() => handleRoleSelection('client')}
            className="h-20 flex flex-col gap-2 bg-primary hover:bg-primary/90 text-white border-0 shadow-apple-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            size="lg"
          >
            <UserCheck className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">I'm a Client</div>
              <div className="text-sm opacity-90">Browse and borrow books</div>
            </div>
          </Button>
          
          <Button
            onClick={() => handleRoleSelection('librarian')}
            className="h-20 flex flex-col gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground border shadow-apple-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1"
            size="lg"
          >
            <Book className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">I'm a Librarian</div>
              <div className="text-sm opacity-90">Manage library operations</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}