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