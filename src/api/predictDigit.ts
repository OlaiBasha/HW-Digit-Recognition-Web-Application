import { MultiDigitResult } from '../types';

const API_URL = import.meta.env.VITE_PREDICT_API_URL as string | undefined;
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true' || !API_URL;

// The multi-digit endpoint lives next to the single-digit one on the same
// backend, e.g. https://host/predict -> https://host/predict-multi
const MULTI_API_URL = API_URL ? API_URL.replace(/\/predict\/?$/, '/predict-multi') : undefined;

/** Raw shape returned by the FastAPI backend's /predict-multi (api.py). */
interface BackendMultiPredictionResponse {
  digits: { digit: number; confidence: number }[];
  number: string;
}

/**
 * Sends a drawn/uploaded image (containing one or more digits side by side,
 * e.g. a two-digit number) to the backend and returns each digit plus the
 * combined number.
 *
 * Backend contract (ml_backend/api.py, /predict-multi):
 *   POST {MULTI_API_URL}   e.g. http://localhost:8000/predict-multi
 *   body:     multipart/form-data, field name "file" = PNG blob
 *   response: { digits: [{ digit, confidence }, ...], number: "42" }
 *
 * Until the real endpoint is reachable, set VITE_USE_MOCK_API=true (or leave
 * VITE_PREDICT_API_URL unset) in .env to get randomized mock predictions.
 */
export async function predictMultiDigit(imageBlob: Blob): Promise<MultiDigitResult> {
  if (USE_MOCK || !MULTI_API_URL) {
    return mockPredictMulti();
  }

  const formData = new FormData();
  formData.append('file', imageBlob, 'digits.png');

  const response = await fetch(MULTI_API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Prediction request failed with status ${response.status}`);
  }

  const data = (await response.json()) as BackendMultiPredictionResponse;
  return { digits: data.digits, number: data.number };
}

function mockPredictMulti(): Promise<MultiDigitResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const digitCount = 2;
      const digits = Array.from({ length: digitCount }, () => ({
        digit: Math.floor(Math.random() * 10),
        confidence: 0.7 + Math.random() * 0.3,
      }));
      resolve({ digits, number: digits.map((d) => d.digit).join('') });
    }, 600);
  });
}