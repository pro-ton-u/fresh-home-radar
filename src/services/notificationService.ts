
import { toast } from "sonner";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  threshold: 3 // days
};

// Check if notifications are supported in the browser
export const areNotificationsSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!areNotificationsSupported()) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Show browser notification
export const showBrowserNotification = (title: string, options: NotificationOptions = {}): boolean => {
  if (!areNotificationsSupported()) {
    // Fallback to toast notification
    toast(title, {
      description: options.body,
      duration: 5000,
    });
    return false;
  }
  
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
      return true;
    } else {
      // Fallback to toast notification
      toast(title, {
        description: options.body,
        duration: 5000,
      });
      return false;
    }
  } catch (error) {
    console.error('Error showing notification:', error);
    // Fallback to toast notification
    toast(title, {
      description: options.body,
      duration: 5000,
    });
    return false;
  }
};

// Show a toast notification
export const showToastNotification = (title: string, message: string): void => {
  toast(title, {
    description: message,
    duration: 5000,
  });
};
