from io import BytesIO
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "model" / "mnist_cnn.keras"

app = FastAPI(title="Handwritten Digit Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://hw-digit-recognition-web-application-production.up.railway.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


@app.on_event("startup")
def load_model() -> None:
    global model
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model file was not found at {MODEL_PATH}. Run train_model.py first."
        )
    model = tf.keras.models.load_model(MODEL_PATH)


def prepare_image(file_bytes: bytes) -> np.ndarray:
    image = Image.open(BytesIO(file_bytes)).convert("L")

    # MNIST uses white digits on a black background. Invert bright-paper uploads.
    if np.mean(np.asarray(image)) > 127:
        image = ImageOps.invert(image)

    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    image.thumbnail((20, 20), Image.Resampling.LANCZOS)
    canvas = Image.new("L", (28, 28), 0)
    left = (28 - image.width) // 2
    top = (28 - image.height) // 2
    canvas.paste(image, (left, top))

    arr = np.asarray(canvas).astype("float32") / 255.0
    return arr.reshape(1, 28, 28, 1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict[str, object]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    image_bytes = await file.read()
    try:
        prepared = prepare_image(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    probabilities = model.predict(prepared, verbose=0)[0]
    digit = int(np.argmax(probabilities))
    confidence = float(probabilities[digit])

    return {
        "digit": digit,
        "confidence": round(confidence, 4),
        "probabilities": {
            str(index): round(float(probability), 4)
            for index, probability in enumerate(probabilities)
        },
    }
