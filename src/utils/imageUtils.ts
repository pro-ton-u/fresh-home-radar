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

/**
 * Take a photo using the device camera: shows a live preview with capture and cancel buttons.
 * Returns a Promise that resolves to a data URL string of the captured image.
 */
export const takePicture = async (): Promise<string> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return Promise.reject(new Error('Camera access not supported by your browser.'));
  }
  return new Promise(async (resolve, reject) => {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    // Create video element
    const video = document.createElement('video');
    video.style.maxWidth = '90%';
    video.style.maxHeight = '70%';
    video.autoplay = true;
    video.playsInline = true;
    overlay.appendChild(video);

    // Create button container
    const btnContainer = document.createElement('div');
    btnContainer.style.marginTop = '20px';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '20px';

    // Capture button
    const btnCapture = document.createElement('button');
    btnCapture.textContent = 'Capture';
    btnCapture.style.padding = '10px 20px';
    btnCapture.style.fontSize = '16px';
    btnCapture.style.cursor = 'pointer';
    btnCapture.style.borderRadius = '4px';
    btnCapture.style.border = 'none';
    btnCapture.style.backgroundColor = '#10B981';
    btnCapture.style.color = 'white';

    // Cancel button
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.style.padding = '10px 20px';
    btnCancel.style.fontSize = '16px';
    btnCancel.style.cursor = 'pointer';
    btnCancel.style.borderRadius = '4px';
    btnCancel.style.border = 'none';
    btnCancel.style.backgroundColor = '#6B7280';
    btnCancel.style.color = 'white';

    btnContainer.appendChild(btnCapture);
    btnContainer.appendChild(btnCancel);
    overlay.appendChild(btnContainer);
    document.body.appendChild(overlay);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error('Failed to access camera'));
      return;
    }

    function cleanup() {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    btnCapture.onclick = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error('Capture failed'));
      }
    };

    btnCancel.onclick = () => {
      cleanup();
      reject(new Error('Camera access cancelled'));
    };
  });
};

/**
 * A fallback function that uses a reliable file upload approach when camera access fails
 * This can be called directly from the AddFoodItemDialog component
 */
export const uploadImageWithFallback = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Add to DOM
    document.body.appendChild(fileInput);
    
    // Setup event handlers
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      // Clean up the file input
      document.body.removeChild(fileInput);
      
      if (!file) {
        reject(new Error('No image selected'));
        return;
      }
      
      try {
        const dataUrl = await fileToDataUrl(file);
        resolve(dataUrl);
      } catch (error) {
        console.error('Error processing image:', error);
        reject(new Error('Failed to process image. Please try again.'));
      }
    };
    
    // Trigger the file input
    fileInput.click();
    
    // Handle cancel
    setTimeout(() => {
      if (document.body.contains(fileInput)) {
        document.body.removeChild(fileInput);
      }
    }, 300000); // 5 minute timeout
  });
};
