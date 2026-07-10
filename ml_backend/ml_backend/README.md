# ML Backend - Handwritten Digit Recognition

This folder contains the machine learning part of the assignment:

- `train_model.py`: trains a CNN model on the MNIST handwritten digit dataset.
- `api.py`: exposes an API endpoint that receives an uploaded image and returns the predicted digit.
- `requirements.txt`: Python packages needed to run the ML backend.

## 1. Create environment and install packages

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Train the model

```bash
python train_model.py
```

After training, the model will be saved here:

```text
model/mnist_cnn.keras
```

Expected test accuracy is usually around 98-99%.

## 3. Run the API

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

Test in the browser:

```text
http://localhost:8000/health
```

Prediction endpoint:

```text
POST http://localhost:8000/predict
```

The request must be `multipart/form-data` with an image field named `file`.

## 4. React example

```js
async function predictDigit(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch("http://localhost:8000/predict", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return response.json();
}
```

Example response:

```json
{
  "digit": 7,
  "confidence": 0.9981,
  "probabilities": {
    "0": 0.0,
    "1": 0.0,
    "2": 0.0001,
    "3": 0.0,
    "4": 0.0,
    "5": 0.0,
    "6": 0.0,
    "7": 0.9981,
    "8": 0.0018,
    "9": 0.0
  }
}
```

## Project explanation for the submission PDF

The machine learning part uses the MNIST dataset, which contains grayscale images of handwritten digits from 0 to 9. The images are normalized to values between 0 and 1 and reshaped to 28x28x1. A Convolutional Neural Network is trained using convolution, max-pooling, dense, dropout, and softmax output layers. The trained model is saved and loaded by a FastAPI backend. When a user uploads an image from the React frontend, the backend converts it to grayscale, inverts it when needed, centers it on a 28x28 canvas, normalizes the pixels, and sends it to the model. The API returns the predicted digit, confidence score, and probabilities for all classes.
