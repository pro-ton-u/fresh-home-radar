
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/dateUtils';
import { FoodItem } from '@/types';

interface ViewFoodItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: FoodItem;
}

const ViewFoodItemDialog = ({ isOpen, onClose, item }: ViewFoodItemDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Food Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative w-full max-w-[200px] aspect-square">
              <img 
                src={item.image || '/placeholder.svg'} 
                alt={item.name} 
                className="w-full h-full object-cover rounded-md" 
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="font-semibold">Name:</span>
              <span>{item.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-semibold">Category:</span>
              <span className="capitalize">{item.category}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-semibold">Added on:</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-semibold">Expires on:</span>
              <span>{formatDate(item.expiryDate)}</span>
            </div>
            
            {item.freshness !== undefined && item.category === 'fruits' && (
              <div className="flex justify-between">
                <span className="font-semibold">Freshness:</span>
                <span>{item.freshness} hearts</span>
              </div>
            )}
            
            {item.notes && (
              <div className="mt-2">
                <p className="font-semibold">Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewFoodItemDialog;
