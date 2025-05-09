import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Home } from 'lucide-react';
import CategoryFilter from '@/components/CategoryFilter';
import FoodItemsList from '@/components/FoodItemsList';
import AddFoodItemDialog from '@/components/AddFoodItemDialog';
import ViewFoodItemDialog from '@/components/ViewFoodItemDialog';
import NotificationSettings from '@/components/NotificationSettings';
import { FoodItem } from '@/types';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoodItem | undefined>(undefined);
  const navigate = useNavigate();

  const handleAddItem = () => {
    setSelectedItem(undefined);
    setIsAddDialogOpen(true);
  };

  const handleViewItem = (item: FoodItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
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
          <Button variant="outline" onClick={() => navigate('/detect')}>
            Detect Fruits
          </Button>
        </div>
      </div>

      <CategoryFilter />
      
      <FoodItemsList onViewItem={handleViewItem} />
      
      {isAddDialogOpen && (
        <AddFoodItemDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          editItem={undefined}
        />
      )}
      
      {isViewDialogOpen && selectedItem && (
        <ViewFoodItemDialog 
          isOpen={isViewDialogOpen} 
          onClose={() => setIsViewDialogOpen(false)} 
          item={selectedItem}
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
