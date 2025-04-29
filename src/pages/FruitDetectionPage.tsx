import React from 'react';
import { FruitDetector } from '../components/FruitDetector';

export const FruitDetectionPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fruit & Vegetable Detector</h1>
      <p className="mb-6 text-gray-600">
        Upload an image of a fruit or vegetable to identify it. 
        Our AI model will analyze the image and provide predictions.
      </p>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <FruitDetector />
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <h3 className="font-medium text-gray-700 mb-2">About this tool</h3>
        <p>
          This detector uses a machine learning model trained on various fruits and vegetables.
          It can identify common produce items with varying degrees of accuracy.
          For best results, use clear images with good lighting and minimal background clutter.
        </p>
      </div>
    </div>
  );
}; 