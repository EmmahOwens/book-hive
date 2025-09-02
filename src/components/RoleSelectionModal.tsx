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
      <DialogContent className="sm:max-w-md glass backdrop-blur-2xl border-0">
        <DialogHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-apple-lg">
            <Book className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="headline-medium text-2xl">
            Welcome to Book Hive
          </DialogTitle>
          <p className="body-large text-muted-foreground mt-2">
            Please select your role to continue
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            onClick={() => handleRoleSelection('client')}
            className="h-20 flex flex-col gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-apple-lg hover-lift"
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
            className="h-20 flex flex-col gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-apple-lg hover-lift"
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