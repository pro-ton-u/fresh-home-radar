// Convert a File to a data URL
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

// Compress an image file
export const compressImage = async (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: file.type,
                lastModified: Date.now(),
              }
            );
            
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = event.target.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Take a photo using the device camera - improved to ensure capture works reliably
export const takePicture = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if the browser supports the required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error('Camera access not supported by your browser'));
        return;
      }
      
      // Create HTML elements for the camera UI
      const videoElement = document.createElement('video');
      videoElement.setAttribute('autoplay', 'true');
      videoElement.style.width = '100%';
      videoElement.style.maxHeight = '70vh';
      videoElement.style.objectFit = 'cover';
      videoElement.style.borderRadius = '8px';
      
      const cameraContainer = document.createElement('div');
      cameraContainer.style.position = 'fixed';
      cameraContainer.style.top = '0';
      cameraContainer.style.left = '0';
      cameraContainer.style.width = '100%';
      cameraContainer.style.height = '100%';
      cameraContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      cameraContainer.style.display = 'flex';
      cameraContainer.style.flexDirection = 'column';
      cameraContainer.style.justifyContent = 'center';
      cameraContainer.style.alignItems = 'center';
      cameraContainer.style.zIndex = '100000'; // Highest possible z-index
      cameraContainer.style.padding = '20px';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-around';
      buttonContainer.style.width = '100%';
      buttonContainer.style.maxWidth = '400px';
      buttonContainer.style.marginTop = '20px';
      buttonContainer.style.gap = '16px';
      
      // Create the capture button - larger and easier to tap
      const captureButton = document.createElement('button');
      captureButton.textContent = 'Take Photo';
      captureButton.style.padding = '20px 40px'; // Larger button
      captureButton.style.backgroundColor = '#3B82F6';
      captureButton.style.color = 'white';
      captureButton.style.border = 'none';
      captureButton.style.borderRadius = '8px';
      captureButton.style.cursor = 'pointer';
      captureButton.style.fontWeight = 'bold';
      captureButton.style.fontSize = '18px'; // Larger text
      captureButton.style.flex = '1';
      captureButton.style.maxWidth = '200px';
      captureButton.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      captureButton.style.touchAction = 'manipulation';
      
      // Create the cancel button - larger and easier to tap
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '20px 40px'; // Larger button
      cancelButton.style.backgroundColor = '#6B7280';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '8px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.fontSize = '18px'; // Larger text
      cancelButton.style.flex = '1';
      cancelButton.style.maxWidth = '200px';
      cancelButton.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      cancelButton.style.touchAction = 'manipulation';
      
      // Add status message
      const statusMessage = document.createElement('p');
      statusMessage.textContent = 'Camera is active. Please allow camera access if prompted.';
      statusMessage.style.color = 'white';
      statusMessage.style.textAlign = 'center';
      statusMessage.style.marginBottom = '15px';
      
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(captureButton);
      
      cameraContainer.appendChild(statusMessage);
      cameraContainer.appendChild(videoElement);
      cameraContainer.appendChild(buttonContainer);
      
      document.body.appendChild(cameraContainer);
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      videoElement.srcObject = stream;
      
      // Wait for video to be loaded and playable
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve);
        };
      });
      
      // Improved button event handling to ensure clicks work properly
      const handleCapture = () => {
        try {
          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }
          
          // Draw the video frame to canvas
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Clean up
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          document.body.removeChild(cameraContainer);
          
          resolve(dataUrl);
        } catch (error) {
          console.error('Error capturing photo:', error);
          reject(error);
        }
      };
      
      const handleCancel = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        document.body.removeChild(cameraContainer);
        reject(new Error('Camera access cancelled'));
      };
      
      // Add button click event listeners with both click and touch handling
      captureButton.addEventListener('click', handleCapture);
      captureButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleCapture();
      });
      
      cancelButton.addEventListener('click', handleCancel);
      cancelButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleCancel();
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      reject(error);
    }
  });
};
