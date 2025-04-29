from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import io

# --- Response models ---
class Prediction(BaseModel):
    label: str
    confidence: float

class PredictionsResponse(BaseModel):
    predictions: List[Prediction]

# --- Initialize app ---
app = FastAPI(
    title="Fruit and Vegetable Detector API",
    description="A FastAPI service for classifying fruits and vegetables using a HuggingFace model.",
    version="1.0.0"
)

# Root handler that redirects to docs
@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

# Allow CORS for integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and processor
model = None
processor = None

# Load model during startup
@app.on_event("startup")
def load_model():
    global model, processor
    model_id = "jazzmacedo/fruits-and-vegetables-detector-36"
    processor = AutoImageProcessor.from_pretrained(model_id)
    model = AutoModelForImageClassification.from_pretrained(model_id)
    model.eval()

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/predict", response_model=PredictionsResponse)
async def predict(file: UploadFile = File(...)):
    """Predict top 3 fruit/vegetable classes with confidence scores."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Preprocess and run inference
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1)
        top3_prob, top3_ids = torch.topk(probs, 3)

    labels = [model.config.id2label[idx] for idx in top3_ids[0].tolist()]
    confidences = top3_prob[0].tolist()

    results = [Prediction(label=labels[i], confidence=float(confidences[i])) for i in range(len(labels))]
    return PredictionsResponse(predictions=results)
