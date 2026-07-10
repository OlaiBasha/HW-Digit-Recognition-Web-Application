import { useState } from "react";

export default function DigitPredictor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
    setResult(null);
    setError("");
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : "");
  }

  async function handlePredict() {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Could not predict this image.");
      }

      setResult(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {preview && <img src={preview} alt="Uploaded digit" width="180" />}

      <button type="button" onClick={handlePredict} disabled={!file || loading}>
        {loading ? "Predicting..." : "Predict"}
      </button>

      {error && <p>{error}</p>}

      {result && (
        <div>
          <h2>Digit: {result.digit}</h2>
          <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </section>
  );
}
