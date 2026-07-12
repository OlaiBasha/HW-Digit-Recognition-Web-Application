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


def _load_grayscale_mnist_orientation(file_bytes: bytes) -> np.ndarray:
    """Load an image and make sure it's bright-digit-on-dark-background (MNIST style)."""
    image = Image.open(BytesIO(file_bytes)).convert("L")
    arr = np.asarray(image).astype("float32")
    if arr.mean() > 127:
        arr = 255.0 - arr
    return arr


def _center_on_28x28(crop: np.ndarray) -> np.ndarray:
    """Resize a single-digit crop and center it on a 28x28 canvas, MNIST-style."""
    img = Image.fromarray(np.clip(crop, 0, 255).astype("uint8"), mode="L")
    img.thumbnail((20, 20), Image.Resampling.LANCZOS)
    canvas = Image.new("L", (28, 28), 0)
    left = (28 - img.width) // 2
    top = (28 - img.height) // 2
    canvas.paste(img, (left, top))
    return (np.asarray(canvas).astype("float32") / 255.0).reshape(28, 28, 1)


def prepare_image(file_bytes: bytes) -> np.ndarray:
    """Single-digit preprocessing used by /predict (unchanged)."""
    image = Image.open(BytesIO(file_bytes)).convert("L")

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


def segment_digits(
    file_bytes: bytes,
    ink_threshold: float = 20.0,
    max_gap: int = 2,
    min_width: int = 3,
) -> list[np.ndarray]:
    """
    Split an image containing several side-by-side digits into individual
    28x28 tensors, left to right, using a simple column-projection scan
    (no extra dependencies needed).
    """
    arr = _load_grayscale_mnist_orientation(file_bytes)
    mask = arr > ink_threshold
    col_has_ink = mask.any(axis=0)

    segments: list[tuple[int, int]] = []
    start = None
    gap = 0
    for x, has_ink in enumerate(col_has_ink):
        if has_ink:
            if start is None:
                start = x
            gap = 0
        elif start is not None:
            gap += 1
            if gap > max_gap:
                end = x - gap
                if end - start >= min_width:
                    segments.append((start, end))
                start = None
                gap = 0
    if start is not None:
        end = len(col_has_ink) - gap
        if end - start >= min_width:
            segments.append((start, end))

    if not segments:
        raise ValueError("No digits detected in the image.")

    digit_tensors = []
    for left, right in segments:
        col_slice = mask[:, left:right]
        rows_with_ink = np.where(col_slice.any(axis=1))[0]
        top, bottom = int(rows_with_ink.min()), int(rows_with_ink.max()) + 1
        crop = arr[top:bottom, left:right]
        digit_tensors.append(_center_on_28x28(crop))

    return digit_tensors


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


@app.post("/predict-multi")
async def predict_multi(file: UploadFile = File(...)) -> dict[str, object]:
    """
    Recognizes a sequence of digits (e.g. a two-digit number) drawn or
    written side by side, by segmenting the image and reusing the same
    single-digit model for each segment. No retraining required.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    image_bytes = await file.read()
    try:
        digit_tensors = segment_digits(image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    batch = np.stack(digit_tensors, axis=0)  # (n, 28, 28, 1)
    predictions = model.predict(batch, verbose=0)

    digits = []
    for probs in predictions:
        digit = int(np.argmax(probs))
        confidence = float(probs[digit])
        digits.append({"digit": digit, "confidence": round(confidence, 4)})

    number = "".join(str(d["digit"]) for d in digits)

    return {"digits": digits, "number": number}
