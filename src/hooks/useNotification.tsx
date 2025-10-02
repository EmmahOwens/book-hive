import { createContext, useContext, useState, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isOpen: boolean;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (type: NotificationType, title: string, message: string) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotification({ 
      id, 
      type, 
      title, 
      message, 
      isOpen: true 
    });
  };

  const hideNotification = () => {
    if (notification) {
      setNotification({ ...notification, isOpen: false });
      setTimeout(() => setNotification(null), 300);
    }
  };

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
