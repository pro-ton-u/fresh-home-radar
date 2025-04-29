
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Home } from 'lucide-react';
import CategoryFilter from '@/components/CategoryFilter';
import FoodItemsList from '@/components/FoodItemsList';
import AddFoodItemDialog from '@/components/AddFoodItemDialog';
import NotificationSettings from '@/components/NotificationSettings';
import { FoodItem } from '@/types';

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | undefined>(undefined);

  const handleAddItem = () => {
    setEditItem(undefined);
    setIsAddDialogOpen(true);
  };

  const handleEditItem = (item: FoodItem) => {
    setEditItem(item);
    setIsAddDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Home className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">HomeInvo</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => setIsNotificationDialogOpen(true)}>
            <Bell className="h-5 w-5" />
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="h-5 w-5 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      <CategoryFilter />
      
      <FoodItemsList onEditItem={handleEditItem} />
      
      {isAddDialogOpen && (
        <AddFoodItemDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          editItem={editItem}
        />
      )}
      
      {isNotificationDialogOpen && (
        <NotificationSettings 
          isOpen={isNotificationDialogOpen} 
          onClose={() => setIsNotificationDialogOpen(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
