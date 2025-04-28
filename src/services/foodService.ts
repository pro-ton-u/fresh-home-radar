import { FoodCategory, FoodItem, AddFoodItemFormData } from "../types";

// In-memory storage
let foodItems: FoodItem[] = [];

// Get all food items
export const getAllFoodItems = (): Promise<FoodItem[]> => {
  return new Promise((resolve) => {
    resolve([...foodItems]);
  });
};

// Get food items by category
export const getFoodItemsByCategory = (category: FoodCategory): Promise<FoodItem[]> => {
  return new Promise((resolve) => {
    const filteredItems = foodItems.filter(item => item.category === category);
    resolve([...filteredItems]);
  });
};

// Get food item by id
export const getFoodItemById = (id: string): Promise<FoodItem | undefined> => {
  return new Promise((resolve) => {
    const item = foodItems.find(item => item.id === id);
    resolve(item ? { ...item } : undefined);
  });
};

// Add new food item
export const addFoodItem = (item: AddFoodItemFormData): Promise<FoodItem> => {
  return new Promise((resolve) => {
    const newItem: FoodItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9), // generate random id
      createdAt: new Date(),
    };
    
    foodItems = [...foodItems, newItem];
    resolve({ ...newItem });
  });
};

// Update food item
export const updateFoodItem = (id: string, updatedItem: Partial<FoodItem>): Promise<FoodItem | undefined> => {
  return new Promise((resolve) => {
    const index = foodItems.findIndex(item => item.id === id);
    if (index !== -1) {
      foodItems[index] = { ...foodItems[index], ...updatedItem };
      resolve({ ...foodItems[index] });
    } else {
      resolve(undefined);
    }
  });
};

// Delete food item
export const deleteFoodItem = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const initialLength = foodItems.length;
    foodItems = foodItems.filter(item => item.id !== id);
    resolve(initialLength !== foodItems.length);
  });
};

// Get expiring food items
export const getExpiringFoodItems = (thresholdDays: number = 3): Promise<FoodItem[]> => {
  return new Promise((resolve) => {
    const now = new Date();
    const threshold = new Date(now.setDate(now.getDate() + thresholdDays));
    
    const expiring = foodItems.filter(item => {
      return item.expiryDate <= threshold;
    });
    
    resolve([...expiring]);
  });
};
