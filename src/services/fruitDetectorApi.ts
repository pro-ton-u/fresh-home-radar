interface Prediction {
  label: string;
  confidence: number;
}

interface PredictionsResponse {
  predictions: Prediction[];
}

export const detectFruits = async (file: File): Promise<Prediction[]> => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    console.log('Calling detect API with file:', file.name, file.type, file.size);
    const response = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error response:', errorData);
      throw new Error(`Error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
    }
    
    const data: PredictionsResponse = await response.json();
    console.log('API response:', data);
    return data.predictions;
  } catch (error) {
    console.error('Error detecting fruits:', error);
    throw error;
  }
};

// Optional: Add support for base64 images if needed
export const detectFruitsBase64 = async (base64Image: string): Promise<Prediction[]> => {
  // Convert base64 to file
  const fetchResponse = await fetch(base64Image);
  const blob = await fetchResponse.blob();
  const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
  
  return detectFruits(file);
}; 