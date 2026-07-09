import { useRef, useState } from 'react';
import DigitCanvas, { DigitCanvasHandle } from './components/DigitCanvas';
import PredictionScoreboard from './components/PredictionScoreboard';
import { predictDigit } from './api/predictDigit';
import { PredictionResult } from './types';
import './index.css';
export default function App() {
  const canvasRef = useRef<DigitCanvasHandle>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [inputMode, setInputMode] = useState<'draw' | 'upload'>('draw');
const [uploadedImage, setUploadedImage] = useState<string | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setUploadedImage(reader.result as string);
    setResult(null);
    setError(null);
  };

  reader.readAsDataURL(file);
};
  const handlePredict = async () => {
  const canvas = canvasRef.current;

  if (!uploadedImage && (!canvas || canvas.isEmpty())) {
    setError("Draw a digit or upload an image first.");
    return;
  }

  setError(null);
  setIsLoading(true);

  try {
    const image = uploadedImage
      ? uploadedImage
      : canvas!.getImageDataUrl();

    const prediction = await predictDigit(image);
    setResult(prediction);
  } catch {
    setError("Couldn't reach the model. Try again.");
  } finally {
    setIsLoading(false);
  }
};
  const handleClear = () => {
  canvasRef.current?.clear();
  setUploadedImage(null);
  setResult(null);
  setError(null);
};

  return (
    <div className="min-h-screen bg-chalkboard flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-chalkboard-light/40 rounded-lg border-2 border-dashed border-chalk-dust p-6 md:p-8">
        <header className="mb-6 text-center">
          <p className="font-mono text-xs tracking-widest text-chalk-teal uppercase">
            digit recognition
          </p>
          <h1 className="font-display text-4xl text-chalk mt-1">draw a digit or upload an image</h1>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-4">
            <DigitCanvas ref={canvasRef} />
<button
    onClick={() => fileInputRef.current?.click()}
    className="w-70 font-body text-sm text-chalk border border-chalk-dust rounded-md py-2 hover:bg-chalkboard-light transition-colors"
  >
    Upload Image
  </button>
            <div className="flex gap-3 w-full max-w-70">
              <button
                onClick={handleClear}
                className="flex-1 font-body text-sm text-chalk border border-chalk-dust rounded-md py-2 hover:bg-chalkboard-light transition-colors"
              >
                clear
              </button>
             <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleUpload}
    className="hidden"
  />

  
              <button
                onClick={handlePredict}
                disabled={isLoading}
                className="flex-1 font-body text-sm text-chalkboard bg-chalk-yellow rounded-md py-2 font-medium hover:brightness-95 transition disabled:opacity-60"
              >
                {isLoading ? 'reading…' : 'predict'}
              </button>
            </div>

            {error && <p className="font-body text-xs text-red-300 text-center">{error}</p>}
          </div>

          <PredictionScoreboard result={result} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
