import { PredictionResult } from '../types';

const API_URL = import.meta.env.VITE_PREDICT_API_URL as string | undefined;
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !API_URL;

/** Raw shape returned by the FastAPI backend (api.py). */
interface BackendPredictionResponse {
  digit: number;
  confidence: number;
  probabilities: Record<string, number>; // e.g. { "0": 0.01, "1": 0.0, ... "9": 0.9 }
}

/**
 * Sends the drawn digit to the backend model and returns the prediction.
 *
 * Backend contract (ml_backend/api.py, confirmed with the teammate):
 *   POST {VITE_PREDICT_API_URL}   e.g. http://localhost:8000/predict
 *   body:     multipart/form-data, field name "file" = PNG blob from the canvas
 *   response: { digit, confidence, probabilities: { "0": num, ..., "9": num } }
 *
 * Until the real endpoint is reachable, set VITE_USE_MOCK_API=true (or leave
 * VITE_PREDICT_API_URL unset) in .env to get randomized mock predictions.
 */
export async function predictDigit(imageBlob: Blob): Promise<PredictionResult> {
  if (USE_MOCK) {
    return mockPredict();
  }

  const formData = new FormData();
  formData.append('file', imageBlob, 'digit.png');

  const response = await fetch(API_URL as string, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Prediction request failed with status ${response.status}`);
  }

  const data = (await response.json()) as BackendPredictionResponse;

  // Backend sends probabilities as an object keyed "0".."9" — convert to an
  // ordered array (index = digit) so the rest of the app can stay simple.
  const probabilities = Array.from({ length: 10 }, (_, digit) => data.probabilities[String(digit)] ?? 0);

  return { digit: data.digit, confidence: data.confidence, probabilities };
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