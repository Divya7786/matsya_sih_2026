from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List

app = FastAPI(title="ORCA PFZ ML Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).parent / "orca_pfz_random_forest.joblib"
model = joblib.load(MODEL_PATH)


class PFZInput(BaseModel):
    sst: float
    sst_gradient: float
    chlorophyll: float


class PFZBatchInput(BaseModel):
    locations: List[PFZInput]


@app.get("/")
def home():
    return {"message": "ORCA PFZ ML API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "features": ["sst", "sst_gradient", "chlorophyll"],
    }


@app.post("/predict/pfz")
def predict_pfz(data: PFZInput):
    input_data = pd.DataFrame([{
        "sst": data.sst,
        "sst_gradient": data.sst_gradient,
        "chlorophyll": data.chlorophyll,
    }])

    prediction = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    confidence = float(max(probabilities))

    return {
        "pfz_prediction": bool(prediction),
        "confidence": round(confidence, 4),
    }


@app.post("/predict/pfz/batch")
def predict_pfz_batch(data: PFZBatchInput):
    rows = [{"sst": loc.sst, "sst_gradient": loc.sst_gradient, "chlorophyll": loc.chlorophyll} for loc in data.locations]
    input_data = pd.DataFrame(rows)

    predictions = model.predict(input_data)
    probabilities = model.predict_proba(input_data)

    results = []
    for i, loc in enumerate(data.locations):
        results.append({
            "sst": loc.sst,
            "sst_gradient": loc.sst_gradient,
            "chlorophyll": loc.chlorophyll,
            "pfz_prediction": bool(predictions[i]),
            "confidence": round(float(max(probabilities[i])), 4),
        })

    return {
        "total": len(results),
        "predictions": results,
    }
