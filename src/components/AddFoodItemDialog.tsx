
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import { AddFoodItemFormData, FoodCategory, FoodItem } from '@/types';
import { fileToDataUrl, takePicture } from '@/utils/imageUtils';
import { freshnessToExpiryDate, getDetailedTimeRemaining } from '@/utils/dateUtils';
import { Camera, Image, X } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [expiryTimeRemaining, setExpiryTimeRemaining] = useState<string>('');
  const [isImageCaptured, setIsImageCaptured] = useState(false);

  useEffect(() => {
    if (category === 'fruits' && freshness) {
      const expiryDate = freshnessToExpiryDate(freshness);
      let interval = setInterval(() => {
        const timeRemaining = getDetailedTimeRemaining(expiryDate);
        setExpiryTimeRemaining(timeRemaining);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [category, freshness]);

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
      toast.success(editItem ? 'Food item updated' : 'New food item added');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to save food item. Please try again.');
      toast.error('Failed to save food item');
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
      setIsImageCaptured(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const dataUrl = await fileToDataUrl(file);
      setImage(dataUrl);
      setIsImageCaptured(true);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try a different file.');
      toast.error('Failed to process image');
    }
  };
  
  const handleTakePhoto = async () => {
    try {
      setIsCameraActive(true);
      const dataUrl = await takePicture();
      setImage(dataUrl);
      setIsImageCaptured(true);
      setIsCameraActive(false);
      toast.success('Photo captured successfully');
    } catch (error) {
      setIsCameraActive(false);
      if (error instanceof Error && error.message === 'Camera access cancelled') {
        return;
      }
      console.error('Error taking photo:', error);
      toast.error('Failed to take photo');
    }
  };
  
  const removeImage = () => {
    setImage('/placeholder.svg');
    setIsImageCaptured(false);
    toast.success('Image removed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
          <DialogDescription>
            {isImageCaptured 
              ? 'Great! Your image is uploaded. Now complete the details below.'
              : 'Take a photo or upload an image of your food item, then fill in the details.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {/* Improved image section with more emphasis on camera */}
            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Food Image
              </Label>
              
              <div className="rounded-md border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center">
                {/* Show image preview if available */}
                {image && image !== '/placeholder.svg' ? (
                  <div className="relative w-full h-48 mb-3">
                    <img 
                      src={image} 
                      alt="Food item preview" 
                      className="w-full h-full object-cover rounded-md" 
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full hover:bg-black"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 w-full bg-gray-100 rounded-md text-gray-400">
                    <Camera className="h-12 w-12 mb-2" />
                    <p className="text-sm text-gray-500 text-center">Take a photo or upload an image</p>
                  </div>
                )}
                
                {/* Image capture buttons - Emphasized camera button */}
                <div className="grid grid-cols-1 gap-3 w-full mt-3">
                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={handleTakePhoto}
                    disabled={isCameraActive || isSubmitting}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="h-5 w-5" />
                    Take Photo with Camera
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 h-12"
                    asChild
                    disabled={isCameraActive || isSubmitting}
                  >
                    <label>
                      <Image className="h-5 w-5" />
                      Upload Image from Gallery
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        disabled={isCameraActive || isSubmitting}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>
            
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
                      <span className={star <= freshness ? 'text-red-500' : 'text-gray-300'}>
                        ❤
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <p>{freshness} hearts = {(freshness * 0.6).toFixed(1)} days of freshness</p>
                  {expiryTimeRemaining && (
                    <p className="font-medium text-amber-600">Expires in: {expiryTimeRemaining}</p>
                  )}
                </div>
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
                </div>
              </div>
            )}
            
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
              disabled={isSubmitting || isCameraActive}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isCameraActive}
            >
              {isSubmitting ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFoodItemDialog;
