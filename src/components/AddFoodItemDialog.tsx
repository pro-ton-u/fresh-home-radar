import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFoodInventory } from '@/contexts/FoodInventoryContext';
import { AddFoodItemFormData, FoodCategory, FoodItem } from '@/types';
import { 
  fileToDataUrl
} from '@/utils/imageUtils';
import { freshnessToExpiryDate, getDetailedTimeRemaining } from '@/utils/dateUtils';
import { Camera, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { detectFoodItem } from '../services/foodDetectorService';

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
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [expiryTimeRemaining, setExpiryTimeRemaining] = useState<string>('');
  const [isImageCaptured, setIsImageCaptured] = useState(editItem?.image && editItem.image !== '/placeholder.svg' ? true : false);
  const [isDetecting, setIsDetecting] = useState(false);

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

  // Start camera when showCamera is true
  useEffect(() => {
    if (!showCamera) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera start error:', err);
        toast.error('Unable to access camera');
        setShowCamera(false);
      }
    };
    startCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    };
  }, [showCamera]);

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
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    processAndSetImage(file, 'gallery');
  };
  
  const handleOpenCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowCamera(true);
  };

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImage(dataUrl);
    setIsImageCaptured(true);
    setShowCamera(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    toast.success('Photo captured successfully');
    
    // Auto-detect the food item
    try {
      setIsDetecting(true);
      const result = await detectFoodItem(dataUrl);
      
      // Auto-fill the form with the detected food
      if (result.confidence > 0.7) { // Only auto-fill if confidence is high
        setName(result.class);
        // You could also set other fields like category based on the detected item
      }
    } catch (error) {
      console.error('Failed to detect food item:', error);
      // You could show a toast notification here
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCancelCamera = () => {
    setShowCamera(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Centralized function to process and set the image (from camera or gallery)
  const processAndSetImage = async (file: File, sourceType: 'camera' | 'gallery') => {
    try {
      setError(null);
      setIsSubmitting(true);
      toast.loading(`Processing image from ${sourceType}...`);

      // --- Validation --- 
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please select an image.');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image too large (max 10MB).');
      }

      // --- Optional Compression --- 
      // let processedFile = file;
      // try {
      //   processedFile = await compressImage(file);
      //   console.log('Image compressed successfully');
      // } catch (compressionError) {
      //   console.warn('Could not compress image, using original:', compressionError);
      //   // Continue with the original file if compression fails
      // }

      // --- Convert to Data URL --- 
      const dataUrl = await fileToDataUrl(file); // Use the original or compressed file

      // --- Update State --- 
      setImage(dataUrl);
      setIsImageCaptured(true);
      toast.dismiss();
      toast.success(`Image from ${sourceType} added successfully!`);

    } catch (error) {
      console.error(`Error processing image from ${sourceType}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown processing error.';
      setError(`Failed to process image: ${message}`);
      toast.dismiss();
      toast.error('Image processing failed', { description: message });
      // Reset image state if processing fails
      // setImage('/placeholder.svg'); 
      // setIsImageCaptured(false);
    } finally {
      setIsSubmitting(false); 
    }
  };
  
  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault();
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
              ? 'Image is ready. Fill in remaining details.'
              : 'Take a photo or upload an image of your food item.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {/* Image upload section */}
            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" /> Food Image
              </Label>
              <div className="rounded-md border-2 border-dashed border-gray-300 p-4">
                {
                  showCamera ? (
                    <div className="flex flex-col items-center">
                      <video
                        ref={videoRef}
                        className="w-full h-48 object-cover rounded-md"
                        autoPlay
                        muted
                      />
                      <div className="mt-2 flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={handleCancelCamera}
                          className="flex-1 bg-gray-500 text-white p-2 rounded-md"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCaptureFromCamera}
                          className="flex-1 bg-blue-600 text-white p-2 rounded-md"
                          disabled={isSubmitting}
                        >
                          Capture
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 w-full bg-gray-100 rounded-md text-gray-400">
                      {image && image !== '/placeholder.svg' ? (
                        <img src={image} alt="Preview" className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Camera className="h-12 w-12" />
                      )}
                    </div>
                  )
                }
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {!showCamera && (
                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center gap-1"
                      disabled={isSubmitting}
                    >
                      <Camera className="inline-block" />
                      <span>Take Photo</span>
                    </button>
                  )}
                  {!showCamera && (
                    <div className="relative w-full">
                      <button
                        type="button"
                        className="w-full border border-gray-400 py-2 rounded-md flex items-center justify-center gap-1"
                        disabled={isSubmitting}
                      >
                        <Image className="inline-block" />
                        <span>Upload Image</span>
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isSubmitting || showCamera}
                      />
                    </div>
                  )}
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
                      <span className={star === freshness ? 'text-red-500' : 'text-gray-300'}>
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
              disabled={isSubmitting || showCamera}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || showCamera}
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
