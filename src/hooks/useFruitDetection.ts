import { useState } from 'react';
import { detectFruits } from '../services/fruitDetectorApi';

interface Prediction {
  label: string;
  confidence: number;
}

export const useFruitDetection = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const detectImage = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await detectFruits(file);
      setPredictions(results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    predictions,
    isLoading,
    error,
    detectImage
  };
}; 