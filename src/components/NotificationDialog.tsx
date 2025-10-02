import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNotification } from "@/hooks/useNotification";
import { motion } from "framer-motion";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]",
  },
  error: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.3)]",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/30",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
  },
};

export function NotificationDialog() {
  const { notification, hideNotification } = useNotification();

  if (!notification) return null;

  const Icon = iconMap[notification.type];
  const colors = colorMap[notification.type];

  return (
    <AlertDialog open={notification.isOpen} onOpenChange={hideNotification}>
      <AlertDialogContent className="glass backdrop-blur-xl border-border/50 max-w-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader className="space-y-4">
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className={`w-20 h-20 rounded-full ${colors.bg} border-2 ${colors.border} ${colors.glow} flex items-center justify-center`}
              >
                <Icon className={`w-10 h-10 ${colors.text}`} />
              </motion.div>
            </div>
            
            <AlertDialogTitle className="text-2xl text-center font-bold">
              {notification.title}
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-center text-base text-muted-foreground">
              {notification.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction
              onClick={hideNotification}
              className={`w-full ${colors.bg} ${colors.text} hover:${colors.bg} border ${colors.border} shadow-neumorphic hover:shadow-glow transition-all duration-300`}
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
