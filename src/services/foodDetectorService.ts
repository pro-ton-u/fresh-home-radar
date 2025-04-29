const API_URL = 'http://localhost:5000'; // Change to your Flask app URL

export async function detectFoodItem(imageDataUrl: string): Promise<{ 
  class: string; 
  confidence: number 
}> {
  try {
    const response = await fetch(`${API_URL}/predict_base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageDataUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to detect food item');
    }

    return await response.json();
  } catch (error) {
    console.error('Error detecting food item:', error);
    throw error;
  }
}

export type Prediction = {
  label: string;
  confidence: number;
};

export type PredictionsResponse = {
  predictions: Prediction[];
};

const API_URL_FASTAPI = 'http://localhost:8000'; // Update if your FastAPI runs on a different host/port

/**
 * Send an image file (Blob) to the FastAPI /predict endpoint for detection.
 * @param fileBlob The image Blob to analyze (e.g. from canvas or file input).
 * @returns The parsed PredictionsResponse JSON.
 */
export async function detectFoodItemFromFile(
  fileBlob: Blob
): Promise<PredictionsResponse> {
  const formData = new FormData();
  // Append the blob under the key 'file' as expected by FastAPI
  formData.append('file', fileBlob, 'capture.jpg');

  const response = await fetch(`${API_URL_FASTAPI}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.json().then((d) => d.detail || d.error || 'Unknown error');
    throw new Error(`Detection API failed: ${detail}`);
  }

  const data = (await response.json()) as PredictionsResponse;
  return data;
}