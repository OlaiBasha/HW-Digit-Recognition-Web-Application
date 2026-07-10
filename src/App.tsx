import { useRef, useState } from 'react';
import DigitCanvas, { DigitCanvasHandle } from './components/DigitCanvas';
import PredictionScoreboard from './components/PredictionScoreboard';
import { predictDigit } from './api/predictDigit';
import { PredictionResult } from './types';
import './index.css';

export default function App() {
  const canvasRef = useRef<DigitCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the raw File (it's already a Blob) instead of a base64 string,
  // so we can hand it straight to predictDigit(). previewUrl is only for
  // showing a thumbnail in the UI.
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    canvasRef.current?.clear(); // uploading replaces whatever was drawn
  };

  const handlePredict = async () => {
    const canvas = canvasRef.current;
    if (!uploadedFile && (!canvas || canvas.isEmpty())) {
      setError('draw a digit or upload an image first.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const imageBlob = uploadedFile ?? (await canvas!.toBlob());
      const prediction = await predictDigit(imageBlob);
      setResult(prediction);
    } catch {
      setError("couldn't reach the model. try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    resetUpload();
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded digit preview"
                className="w-full max-w-70 aspect-square object-contain rounded-md border-2 border-dashed border-chalk-dust bg-chalkboard"
              />
            ) : (
              <DigitCanvas ref={canvasRef} />
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-70 font-body text-sm text-chalk border border-chalk-dust rounded-md py-2 hover:bg-chalkboard-light transition-colors"
            >
              upload image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />

            <div className="flex gap-3 w-full max-w-70">
              <button
                onClick={handleClear}
                className="flex-1 font-body text-sm text-chalk border border-chalk-dust rounded-md py-2 hover:bg-chalkboard-light transition-colors"
              >
                clear
              </button>
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
