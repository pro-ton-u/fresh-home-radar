import React, { useRef, useState, useEffect } from 'react';
import { useFruitDetection } from '../hooks/useFruitDetection';
import { Camera } from 'lucide-react';

export const FruitDetector: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { predictions, isLoading, error, detectImage } = useFruitDetection();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await detectImage(file);
  };
  
  const startCamera = async () => {
    try {
      console.log('Attempting to access camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        console.log('Setting video srcObject with stream');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            console.log('Video is now playing');
          }
        };
        setStream(mediaStream);
        setIsCameraOpen(true);
        console.log('Camera started successfully.');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please make sure you have given permission.');
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOpen(false);
      console.log('Camera stopped.');
    }
  };
  
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      console.log('Capturing from video element');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          console.log(`Blob created: ${blob.size} bytes`);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          console.log(`Created file: ${file.name}, ${file.size} bytes`);
          await detectImage(file);
          stopCamera();
          console.log('Image captured and processed.');
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/jpeg', 0.95);
    }
  };
  
  const formatConfidence = (confidence: number): string => {
    return (confidence * 100).toFixed(2) + '%';
  };
  
  // Add a cleanup effect to stop camera when component unmounts
  useEffect(() => {
    // This will clean up camera on unmount
    return () => {
      if (stream) {
        console.log('Component unmounting - stopping camera');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Image
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-1"
          onClick={isCameraOpen ? captureImage : startCamera}
        >
          <Camera className="h-5 w-5" />
          {isCameraOpen ? 'Capture Photo' : 'Open Camera'}
        </button>
        
        {isCameraOpen && (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={stopCamera}
          >
            Cancel
          </button>
        )}
      </div>
      
      {isCameraOpen && (
        <div className="mb-4 relative">
          <h3 className="text-lg font-medium mb-2">Camera:</h3>
          <video 
            ref={videoRef}
            autoPlay={true}
            playsInline
            muted={true}
            width={400}
            height={300}
            style={{ display: 'block', backgroundColor: '#000' }}
            className="max-w-md max-h-80 object-contain border rounded"
            onLoadedMetadata={() => console.log("Video metadata loaded")}
          />
          <p className="text-xs text-gray-500 mt-1">
            If camera feed is not visible, please ensure camera permissions are granted.
          </p>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      
      {previewUrl && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Preview:</h3>
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-md max-h-80 object-contain border rounded"
          />
        </div>
      )}
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2">Processing image...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {predictions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Results:</h3>
          <div className="bg-white shadow rounded p-4">
            <div className="mb-4">
              <h4 className="font-medium text-xl mb-2">
                {predictions[0].label.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${predictions[0].confidence * 100}%` }}
                ></div>
              </div>
              <p className="text-right mt-1">{formatConfidence(predictions[0].confidence)}</p>
            </div>
            
            <h4 className="font-medium mb-2">Top Predictions:</h4>
            <ul className="space-y-2">
              {predictions.map((pred, idx) => (
                <li key={idx} className="flex justify-between items-center border-l-4 border-green-500 pl-3 py-2">
                  <span>
                    {pred.label.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                  <span className="font-mono font-medium">
                    {formatConfidence(pred.confidence)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 