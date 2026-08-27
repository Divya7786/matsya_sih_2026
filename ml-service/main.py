"""
MATSYA AI — PFZ ML Prediction Service
Model: RandomForestClassifier
Features: sst, sst_gradient, chlorophyll
Label:    0=NOT_PFZ, 1=PFZ (pseudo-label, NOT official INCOIS advisory)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import List, Optional

app = FastAPI(title="MATSYA AI — PFZ ML Prediction Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).parent / "orca_pfz_random_forest.joblib"
META_PATH  = Path(__file__).parent.parent / "server" / "models" / "orca_pfz_metadata.json"

model = joblib.load(MODEL_PATH)
model_meta = {}
if META_PATH.exists():
    with open(META_PATH) as f:
        model_meta = json.load(f)


# ── Input/output schemas ──────────────────────────────────────────────────────

class PFZInput(BaseModel):
    sst: float
    sst_gradient: float
    chlorophyll: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator('sst')
    @classmethod
    def validate_sst(cls, v):
        if v is None or np.isnan(v):
            raise ValueError("sst must not be null or NaN")
        if not (-2.0 <= v <= 35.0):
            raise ValueError(f"sst={v} is outside physically valid range [-2, 35]°C")
        return round(v, 4)

    @field_validator('sst_gradient')
    @classmethod
    def validate_gradient(cls, v):
        if v is None or np.isnan(v):
            raise ValueError("sst_gradient must not be null or NaN")
        if v < 0:
            raise ValueError(f"sst_gradient={v} cannot be negative")
        if v > 10.0:
            raise ValueError(f"sst_gradient={v} exceeds physically plausible maximum (10°C/0.25°)")
        return round(v, 6)

    @field_validator('chlorophyll')
    @classmethod
    def validate_chlorophyll(cls, v):
        if v is None or np.isnan(v):
            raise ValueError("chlorophyll must not be null or NaN")
        if v < 0:
            raise ValueError(f"chlorophyll={v} cannot be negative")
        if v > 100.0:
            raise ValueError(f"chlorophyll={v} exceeds physically plausible maximum (100 mg/m³)")
        return round(v, 6)

    @field_validator('latitude')
    @classmethod
    def validate_lat(cls, v):
        if v is not None and not (-90.0 <= v <= 90.0):
            raise ValueError(f"latitude={v} is invalid (must be -90 to 90)")
        return v

    @field_validator('longitude')
    @classmethod
    def validate_lon(cls, v):
        if v is not None and not (-180.0 <= v <= 180.0):
            raise ValueError(f"longitude={v} is invalid (must be -180 to 180)")
        return v


class PFZBatchInput(BaseModel):
    locations: List[PFZInput]

    @field_validator('locations')
    @classmethod
    def validate_count(cls, v):
        if len(v) == 0:
            raise ValueError("locations must contain at least one entry")
        if len(v) > 2000:
            raise ValueError("locations exceeds maximum batch size of 2000")
        return v


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {
        "service": "MATSYA AI PFZ ML Service",
        "version": "2.0.0",
        "model": model_meta.get("model", "RandomForestClassifier"),
        "features": ["sst", "sst_gradient", "chlorophyll"],
        "status": "RUNNING",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": type(model).__name__,
        "sklearn_version": model_meta.get("sklearn_version", "unknown"),
        "features": ["sst", "sst_gradient", "chlorophyll"],
        "classes": {"0": "NOT_PFZ", "1": "PFZ"},
        "training_samples": model_meta.get("training_samples", "unknown"),
        "label_type": model_meta.get("label_type", "pseudo-label"),
        "warning": model_meta.get("warning", "NOT official INCOIS PFZ advisory"),
    }


@app.get("/model/metadata")
def model_metadata():
    return {
        **model_meta,
        "status": "ML-DERIVED",
        "disclaimer": model_meta.get("disclaimer", "Labels derived from oceanographic rules, not verified catch data or official INCOIS advisories."),
    }


@app.post("/predict/pfz")
def predict_pfz(data: PFZInput):
    try:
        input_df = pd.DataFrame([{
            "sst": data.sst,
            "sst_gradient": data.sst_gradient,
            "chlorophyll": data.chlorophyll,
        }])
        prediction  = int(model.predict(input_df)[0])
        proba       = model.predict_proba(input_df)[0]
        pfz_prob    = float(proba[1])
        not_pfz_prob = float(proba[0])

        return {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "sst": data.sst,
            "sst_gradient": data.sst_gradient,
            "chlorophyll": data.chlorophyll,
            "pfz_prediction": prediction == 1,
            "pfz_class": "PFZ" if prediction == 1 else "NOT_PFZ",
            "probability": round(pfz_prob, 4),
            "not_pfz_probability": round(not_pfz_prob, 4),
            "confidence": round(max(pfz_prob, not_pfz_prob), 4),
            "model": model_meta.get("model", "RandomForestClassifier"),
            "status": "ML-DERIVED",
            "label_type": "pseudo-label",
            "warning": "NOT official INCOIS PFZ advisory",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/pfz/batch")
def predict_pfz_batch(data: PFZBatchInput):
    try:
        rows = [{
            "sst": loc.sst,
            "sst_gradient": loc.sst_gradient,
            "chlorophyll": loc.chlorophyll,
        } for loc in data.locations]

        input_df    = pd.DataFrame(rows)
        predictions = model.predict(input_df)
        probabilities = model.predict_proba(input_df)

        results = []
        for i, loc in enumerate(data.locations):
            pred       = int(predictions[i])
            pfz_prob   = float(probabilities[i][1])
            results.append({
                "index": i,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "sst": loc.sst,
                "sst_gradient": loc.sst_gradient,
                "chlorophyll": loc.chlorophyll,
                "pfz_prediction": pred == 1,
                "pfz_class": "PFZ" if pred == 1 else "NOT_PFZ",
                "probability": round(pfz_prob, 4),
                "confidence": round(max(pfz_prob, 1.0 - pfz_prob), 4),
            })

        pfz_count = sum(1 for r in results if r["pfz_prediction"])
        return {
            "total": len(results),
            "pfz_count": pfz_count,
            "not_pfz_count": len(results) - pfz_count,
            "predictions": results,
            "model": model_meta.get("model", "RandomForestClassifier"),
            "status": "ML-DERIVED",
            "label_type": "pseudo-label",
            "warning": "NOT official INCOIS PFZ advisory",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")
