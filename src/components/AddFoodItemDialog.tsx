
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import { AddFoodItemFormData, FoodCategory, FoodItem } from '@/types';
import { fileToDataUrl, takePicture } from '@/utils/imageUtils';
import { freshnessToExpiryDate } from '@/utils/dateUtils';
import { Calendar } from 'lucide-react';

interface AddFoodItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: FoodItem;
}

const AddFoodItemDialog = ({ isOpen, onClose, editItem }: AddFoodItemDialogProps) => {
  const { addFoodItem, updateFoodItem } = useFoodInventory();
  
  const [name, setName] = useState(editItem?.name || '');
  const [category, setCategory] = useState<FoodCategory>(editItem?.category || 'vegetables');
  const [expiryDate, setExpiryDate] = useState(
    editItem ? new Date(editItem.expiryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [freshness, setFreshness] = useState<number>(editItem?.freshness || 3);
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [image, setImage] = useState<string>(editItem?.image || '/placeholder.svg');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      setIsSubmitting(true);
      
      // For fruits category, use freshness to calculate expiry date
      let finalExpiryDate = new Date(expiryDate);
      if (category === 'fruits') {
        finalExpiryDate = freshnessToExpiryDate(freshness);
      }
      
      const formData: AddFoodItemFormData = {
        name,
        category,
        expiryDate: finalExpiryDate,
        freshness: category === 'fruits' ? freshness : undefined,
        notes,
        image
      };
      
      if (editItem) {
        await updateFoodItem(editItem.id, formData);
      } else {
        await addFoodItem(formData);
      }
      
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to save food item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    if (!editItem) {
      setName('');
      setCategory('vegetables');
      setExpiryDate(new Date().toISOString().split('T')[0]);
      setFreshness(3);
      setNotes('');
      setImage('/placeholder.svg');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try a different file.');
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      const dataUrl = await takePicture();
      setImage(dataUrl);
    } catch (error) {
      console.error('Error taking photo:', error);
      setError('Failed to take photo. Please try again or upload an image.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter food item name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={category} 
                onValueChange={(value: FoodCategory) => setCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="packed">Packed Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {category === 'fruits' ? (
              <div className="space-y-2">
                <Label htmlFor="freshness">Freshness Rating</Label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-2xl focus:outline-none"
                      onClick={() => setFreshness(star)}
                    >
                      <span className={star <= freshness ? 'text-yellow-500' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {freshness} stars = {freshness} days of freshness
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <div className="relative">
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="border rounded-md"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleTakePhoto}
                >
                  Take Photo
                </Button>
              </div>
              {image && image !== '/placeholder.svg' && (
                <div className="mt-2 relative w-full max-w-[200px] aspect-square">
                  <img 
                    src={image} 
                    alt="Food item preview" 
                    className="w-full h-full object-cover rounded-md" 
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFoodItemDialog;
