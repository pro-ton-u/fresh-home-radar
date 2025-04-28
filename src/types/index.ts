
export type FoodCategory = 'fruits' | 'vegetables' | 'dairy' | 'packed';

export type FoodItem = {
  id: string;
  name: string;
  category: FoodCategory;
  expiryDate: Date;
  image: string;
  createdAt: Date;
  notes?: string;
  freshness?: number; // 1-5 stars for fruits
  location?: string;
};

export type AddFoodItemFormData = Omit<FoodItem, 'id' | 'createdAt'>;

export type NotificationSettings = {
  enabled: boolean;
  threshold: number; // days before expiry
};
