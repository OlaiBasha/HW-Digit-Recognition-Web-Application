import { PredictionResult } from '../types';

const API_URL = import.meta.env.VITE_PREDICT_API_URL as string | undefined;
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !API_URL;

/**
 * Sends the drawn digit to the backend model and returns the prediction.
 *
 * Expected backend contract (confirm the exact shape with your teammate):
 *   POST {VITE_PREDICT_API_URL}
 *   body:     { image: string }              // base64 PNG data URL from the canvas
 *   response: { digit: number; confidence: number; probabilities: number[] }
 *
 * Until the real endpoint exists, set VITE_USE_MOCK_API=true (or leave
 * VITE_PREDICT_API_URL unset) in .env to get randomized mock predictions,
 * so the UI can be built and tested independently of the model.
 */
export async function predictDigit(imageDataUrl: string): Promise<PredictionResult> {
  if (USE_MOCK) {
    return mockPredict();
  }

  const response = await fetch(API_URL as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!response.ok) {
    throw new Error(`Prediction request failed with status ${response.status}`);
  }

  return response.json() as Promise<PredictionResult>;
}

function mockPredict(): Promise<PredictionResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const raw = Array.from({ length: 10 }, () => Math.random() ** 2);
      const sum = raw.reduce((a, b) => a + b, 0);
      const probabilities = raw.map((p) => p / sum);
      const digit = probabilities.indexOf(Math.max(...probabilities));
      resolve({ digit, confidence: probabilities[digit], probabilities });
    }, 600);
  });
}
