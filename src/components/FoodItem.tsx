import React from 'react';
import { formatDate, getDaysRemaining, getExpiryStatus, formatRelativeTime } from '@/utils/dateUtils';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import { FoodItem as FoodItemType } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash, Edit, Heart } from 'lucide-react';

interface FoodItemProps {
  item: FoodItemType;
  onEdit: (item: FoodItemType) => void;
}

const FoodItem = ({ item, onEdit }: FoodItemProps) => {
  const { deleteFoodItem } = useFoodInventory();
  const daysRemaining = getDaysRemaining(item.expiryDate);
  const expiryStatus = getExpiryStatus(daysRemaining);
  
  const getCategoryColor = () => {
    switch (item.category) {
      case 'fruits':
        return 'bg-category-fruits';
      case 'vegetables':
        return 'bg-category-vegetables';
      case 'dairy':
        return 'bg-category-dairy';
      case 'packed':
        return 'bg-category-packed';
      default:
        return 'bg-gray-100';
    }
  };
  
  const getStatusColor = () => {
    switch (expiryStatus) {
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'fresh':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderFreshness = () => {
    if (item.category === 'fruits' && item.freshness !== undefined) {
      const hearts = [];
      for (let i = 1; i <= 5; i++) {
        hearts.push(
          <Heart
            key={i}
            className={`h-4 w-4 ${i <= item.freshness ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
          />
        );
      }
      return <div className="flex space-x-0.5 mt-1">{hearts}</div>;
    }
    return null;
  };

  return (
    <Card className={`animate-fade-in overflow-hidden ${getCategoryColor()}`}>
      <CardHeader className="p-0">
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
          <img
            src={item.image || '/placeholder.svg'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium">{item.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}>
            {formatRelativeTime(item.expiryDate)}
          </span>
        </div>
        {renderFreshness()}
        <p className="text-sm text-gray-600 mt-2">Expires: {formatDate(item.expiryDate)}</p>
        {item.notes && <p className="text-sm mt-1 text-gray-500">{item.notes}</p>}
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => deleteFoodItem(item.id)}>
          <Trash className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FoodItem;
