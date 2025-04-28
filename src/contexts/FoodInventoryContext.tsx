
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { FoodCategory, FoodItem, AddFoodItemFormData, NotificationSettings } from "../types";
import * as foodService from "../services/foodService";
import * as notificationService from "../services/notificationService";
import { toast } from "sonner";

// Define the context type
interface FoodInventoryContextType {
  foodItems: FoodItem[];
  loading: boolean;
  error: string | null;
  selectedCategory: FoodCategory | 'all';
  notificationSettings: NotificationSettings;
  fetchFoodItems: () => Promise<void>;
  addFoodItem: (item: AddFoodItemFormData) => Promise<void>;
  deleteFoodItem: (id: string) => Promise<void>;
  updateFoodItem: (id: string, updatedItem: Partial<FoodItem>) => Promise<void>;
  setSelectedCategory: (category: FoodCategory | 'all') => void;
  checkExpiringItems: () => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => void;
}

// Create context with default values
const FoodInventoryContext = createContext<FoodInventoryContextType>({
  foodItems: [],
  loading: false,
  error: null,
  selectedCategory: 'all',
  notificationSettings: notificationService.DEFAULT_NOTIFICATION_SETTINGS,
  fetchFoodItems: async () => {},
  addFoodItem: async () => {},
  deleteFoodItem: async () => {},
  updateFoodItem: async () => {},
  setSelectedCategory: () => {},
  checkExpiringItems: async () => {},
  updateNotificationSettings: () => {},
});

// Create context provider
export const FoodInventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    notificationService.DEFAULT_NOTIFICATION_SETTINGS
  );

  // Fetch food items on mount
  useEffect(() => {
    fetchFoodItems();
    
    // Request notification permission on mount
    notificationService.requestNotificationPermission();
    
    // Check for expiring items on mount and every hour
    checkExpiringItems();
    const interval = setInterval(checkExpiringItems, 60 * 60 * 1000); // Check every hour
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Fetch food items based on selected category
  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      setError(null);
      let items: FoodItem[];
      
      if (selectedCategory === 'all') {
        items = await foodService.getAllFoodItems();
      } else {
        items = await foodService.getFoodItemsByCategory(selectedCategory);
      }
      
      setFoodItems(items);
    } catch (err) {
      setError("Failed to fetch food items");
      console.error("Error fetching food items:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new food item
  const addFoodItem = async (item: AddFoodItemFormData) => {
    try {
      setLoading(true);
      setError(null);
      await foodService.addFoodItem(item);
      toast.success("Food item added successfully");
      await fetchFoodItems();
    } catch (err) {
      setError("Failed to add food item");
      toast.error("Failed to add food item");
      console.error("Error adding food item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a food item
  const deleteFoodItem = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await foodService.deleteFoodItem(id);
      if (success) {
        toast.success("Food item deleted successfully");
        await fetchFoodItems();
      } else {
        throw new Error("Failed to delete food item");
      }
    } catch (err) {
      setError("Failed to delete food item");
      toast.error("Failed to delete food item");
      console.error("Error deleting food item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update a food item
  const updateFoodItem = async (id: string, updatedItem: Partial<FoodItem>) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await foodService.updateFoodItem(id, updatedItem);
      if (updated) {
        toast.success("Food item updated successfully");
        await fetchFoodItems();
      } else {
        throw new Error("Failed to update food item");
      }
    } catch (err) {
      setError("Failed to update food item");
      toast.error("Failed to update food item");
      console.error("Error updating food item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check for expiring items
  const checkExpiringItems = async () => {
    try {
      if (!notificationSettings.enabled) return;
      
      const expiringItems = await foodService.getExpiringFoodItems(notificationSettings.threshold);
      
      if (expiringItems.length > 0) {
        // Show notification for expiring items
        const title = "Food Items Expiring Soon";
        const message = `You have ${expiringItems.length} food item(s) expiring soon`;
        
        notificationService.showBrowserNotification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      console.error("Error checking expiring items:", err);
    }
  };

  // Update notification settings
  const updateNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    toast.success("Notification settings updated");
  };

  // Update food items when category changes
  useEffect(() => {
    fetchFoodItems();
  }, [selectedCategory]);

  return (
    <FoodInventoryContext.Provider
      value={{
        foodItems,
        loading,
        error,
        selectedCategory,
        notificationSettings,
        fetchFoodItems,
        addFoodItem,
        deleteFoodItem,
        updateFoodItem,
        setSelectedCategory,
        checkExpiringItems,
        updateNotificationSettings,
      }}
    >
      {children}
    </FoodInventoryContext.Provider>
  );
};

// Custom hook for using the context
export const useFoodInventory = () => useContext(FoodInventoryContext);
