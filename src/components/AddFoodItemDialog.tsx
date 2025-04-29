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
import { detectFruits } from '../services/fruitDetectorApi';

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

  // Improve camera startup in useEffect
  useEffect(() => {
    if (!showCamera) return;
    const startCamera = async () => {
      try {
        console.log('Starting camera in AddFoodItemDialog...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 } 
          } 
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Camera stream set to video element');
        }
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

  // Improve capture function to fix detection issues
  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) {
      console.error('Video reference is null');
      return;
    }
    
    try {
      console.log('Capturing image from camera...');
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
        toast.loading('Analyzing image...');
        
        // Convert the data URL to a File object
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        
        // Use the new ML model to detect fruits/vegetables
        console.log('Sending image to detection API...');
        const results = await detectFruits(file);
        console.log('Detection results:', results);
        
        // If we have results with good confidence
        if (results && results.length > 0 && results[0].confidence > 0.5) {
          const topResult = results[0];
          
          // Format the detected label (e.g., "green_apple" -> "Green Apple")
          const formattedName = topResult.label
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          setName(formattedName);
          
          // Auto-categorize based on detection
          if (topResult.label.includes('fruit') || 
              ['apple', 'banana', 'orange', 'grape', 'mango', 'kiwi', 'pear', 'strawberry', 'blueberry',
               'peach', 'watermelon', 'pineapple', 'lemon', 'avocado'].some(fruit => 
                topResult.label.includes(fruit))) {
            setCategory('fruits');
            console.log(`Set category to fruits based on detection: ${topResult.label}`);
          } else if (topResult.label.includes('vegetable') || 
                   ['carrot', 'broccoli', 'pepper', 'cucumber', 'spinach', 'lettuce', 'potato',
                    'tomato', 'onion', 'garlic', 'cabbage', 'eggplant'].some(veg => 
                     topResult.label.includes(veg))) {
            setCategory('vegetables');
            console.log(`Set category to vegetables based on detection: ${topResult.label}`);
          }
          
          toast.dismiss();
          toast.success(`Detected: ${formattedName} (${Math.round(topResult.confidence * 100)}% confidence)`);
        } else {
          toast.dismiss();
          toast.info("Couldn't confidently detect food item. Please fill details manually.");
        }
      } catch (error) {
        console.error('Failed to detect food item:', error);
        toast.dismiss();
        toast.error("Couldn't detect food item", { 
          description: "Please enter details manually" 
        });
      } finally {
        setIsDetecting(false);
      }
    } catch (err) {
      console.error('Error in capture process:', err);
      toast.error('Failed to capture image');
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

  // Add a detect function
  const handleDetectFromImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (image === '/placeholder.svg') {
      toast.error('Please upload or capture an image first');
      return;
    }

    try {
      setIsDetecting(true);
      toast.loading('Analyzing image...');
      
      // Convert the data URL to a File object
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], "detect.jpg", { type: "image/jpeg" });
      
      // Use the ML model to detect fruits/vegetables
      console.log('Sending existing image to detection API...');
      const results = await detectFruits(file);
      console.log('Detection results:', results);
      
      // If we have results with good confidence
      if (results && results.length > 0 && results[0].confidence > 0.5) {
        const topResult = results[0];
        
        // Format the detected label (e.g., "green_apple" -> "Green Apple")
        const formattedName = topResult.label
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        setName(formattedName);
        
        // Auto-categorize based on detection
        if (topResult.label.includes('fruit') || 
            ['apple', 'banana', 'orange', 'grape', 'mango', 'kiwi', 'pear', 'strawberry', 'blueberry',
             'peach', 'watermelon', 'pineapple', 'lemon', 'avocado'].some(fruit => 
              topResult.label.includes(fruit))) {
          setCategory('fruits');
          console.log(`Set category to fruits based on detection: ${topResult.label}`);
        } else if (topResult.label.includes('vegetable') || 
                 ['carrot', 'broccoli', 'pepper', 'cucumber', 'spinach', 'lettuce', 'potato',
                  'tomato', 'onion', 'garlic', 'cabbage', 'eggplant'].some(veg => 
                   topResult.label.includes(veg))) {
          setCategory('vegetables');
          console.log(`Set category to vegetables based on detection: ${topResult.label}`);
        }
        
        toast.dismiss();
        toast.success(`Detected: ${formattedName} (${Math.round(topResult.confidence * 100)}% confidence)`);
      } else {
        toast.dismiss();
        toast.info("Couldn't confidently detect food item. Please fill details manually.");
      }
    } catch (error) {
      console.error('Failed to detect food item:', error);
      toast.dismiss();
      toast.error("Couldn't detect food item", { 
        description: "Please enter details manually" 
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          // Stop camera when dialog is closed
          if (cameraStream) {
            console.log('Dialog closing - stopping camera');
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
            setShowCamera(false);
          }
          onClose();
        }
      }}
    >
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
                        autoPlay={true}
                        muted={true}
                        playsInline={true}
                        style={{ backgroundColor: '#000' }}
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            videoRef.current.play();
                            console.log('Video element is playing in AddFoodItemDialog');
                          }
                        }}
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
                      <p className="text-xs text-gray-500 mt-1">
                        If camera feed is not visible, please check camera permissions.
                      </p>
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
                {!showCamera && image && image !== '/placeholder.svg' && (
                  <div className="mt-2 flex justify-between">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-red-500 text-sm flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </button>
                    <button
                      type="button"
                      onClick={handleDetectFromImage}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      disabled={isSubmitting || isDetecting}
                    >
                      {isDetecting ? 'Detecting...' : 'Detect Food Type'}
                    </button>
                  </div>
                )}
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
