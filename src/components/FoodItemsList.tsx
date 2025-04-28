import React from 'react';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import FoodItem from './FoodItem';

const FoodItemsList = () => {
  const { foodItems, loading, error } = useFoodInventory();

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-red-500">
        <p>Error loading food items</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (foodItems.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500">
        <p>No food items found</p>
        <p className="text-sm mt-2">Add some items to your inventory</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {foodItems.map((item) => (
        <FoodItem key={item.id} item={item} />
      ))}
    </div>
  );
};

export default FoodItemsList;
