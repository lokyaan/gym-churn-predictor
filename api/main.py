"""
FastAPI Backend — Gym Churn Predictor
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path

# ─── App setup ───────────────────────────────────────────────
app = FastAPI(
    title="Gym Churn Predictor API",
    description="Predict gym member churn risk using XGBoost ML model",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # tighten in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load artifacts at startup ───────────────────────────────
MODELS_DIR = Path(__file__).parent.parent / "models"

try:
    model         = joblib.load(MODELS_DIR / "xgb_model.pkl")
    scaler        = joblib.load(MODELS_DIR / "scaler.pkl")
    feature_names = joblib.load(MODELS_DIR / "feature_names.pkl")
    with open(MODELS_DIR / "metrics.json") as f:
        metrics = json.load(f)
    print("✅ Model artifacts loaded successfully")
except FileNotFoundError:
    model, scaler, feature_names, metrics = None, None, None, {}
    print("⚠️  Model artifacts not found. Run the notebook first to train and save the model.")


# ─── Schemas ─────────────────────────────────────────────────
class CustomerInput(BaseModel):
    gender: int                             = Field(..., ge=0, le=1,  description="0=Female, 1=Male")
    Near_Location: int                      = Field(..., ge=0, le=1,  description="Lives near gym")
    Partner: int                            = Field(..., ge=0, le=1,  description="Has partner member")
    Promo_friends: int                      = Field(..., ge=0, le=1,  description="Joined via friend promo")
    Phone: int                              = Field(..., ge=0, le=1,  description="Phone number on file")
    Contract_period: int                    = Field(..., ge=1, le=12, description="1 or 12 months")
    Group_visits: int                       = Field(..., ge=0, le=1,  description="Attends group classes")
    Age: float                              = Field(..., ge=18, le=80, description="Customer age")
    Avg_additional_charges_total: float     = Field(..., ge=0,        description="Extra services spend")
    Month_to_end_contract: float            = Field(..., ge=0,        description="Months left on contract")
    Lifetime: float                         = Field(..., ge=0,        description="Months as a member")
    Avg_class_frequency_total: float        = Field(..., ge=0, le=7,  description="Avg visits/week (lifetime)")
    Avg_class_frequency_current_month: float= Field(..., ge=0, le=7,  description="Avg visits/week (this month)")

    class Config:
        json_schema_extra = {
            "example": {
                "gender": 1,
                "Near_Location": 1,
                "Partner": 0,
                "Promo_friends": 0,
                "Phone": 1,
                "Contract_period": 1,
                "Group_visits": 0,
                "Age": 29.0,
                "Avg_additional_charges_total": 120.0,
                "Month_to_end_contract": 1.0,
                "Lifetime": 4.0,
                "Avg_class_frequency_total": 1.5,
                "Avg_class_frequency_current_month": 0.8,
            }
        }


class PredictionResponse(BaseModel):
    churn_probability: float
    churn_prediction: int
    risk_level: str
    recommendation: str
    engineered_features: dict


# ─── Feature engineering (must match notebook) ────────────────
def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['freq_drop_ratio'] = (
        df['Avg_class_frequency_current_month'] /
        (df['Avg_class_frequency_total'] + 1e-5)
    )
    df['high_engagement']   = (df['Avg_class_frequency_total'] >= 3.0).astype(int)
    df['near_contract_end'] = (df['Month_to_end_contract'] <= 1).astype(int)
    df['early_member']      = (df['Lifetime'] <= 2).astype(int)
    return df


def get_recommendation(prob: float, customer: CustomerInput) -> str:
    if prob > 0.70:
        if customer.Contract_period == 1:
            return "Urgent: offer a discounted annual contract + complimentary group class trial."
        return "High risk: assign a personal trainer consultation and send a retention offer."
    elif prob > 0.40:
        if not customer.Group_visits:
            return "Send a personalized invite to group fitness classes to boost engagement."
        return "Medium risk: schedule a check-in call and offer a loyalty reward."
    return "Low risk: member is engaged. Consider a referral bonus to bring in new members."


# ─── Routes ──────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Gym Churn Predictor API is running 🏋️"}


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_type": metrics.get("best_model", "N/A"),
        "test_auc": metrics.get("test_auc", "N/A"),
    }


@app.get("/model/metrics", tags=["Model"])
def get_metrics():
    """Return CV results, test AUC, and top feature importances."""
    if not metrics:
        raise HTTPException(status_code=503, detail="Model not trained yet. Run the notebook first.")
    return metrics


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(customer: CustomerInput):
    """Predict churn probability for a single gym member."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run the notebook first.")

    df = pd.DataFrame([customer.model_dump()])
    df = add_engineered_features(df)
    df = df.reindex(columns=feature_names, fill_value=0)

    X_scaled = scaler.transform(df)
    prob  = float(model.predict_proba(X_scaled)[0][1])
    label = int(prob >= 0.5)

    risk = "High" if prob > 0.70 else ("Medium" if prob > 0.40 else "Low")

    engineered = {
        "freq_drop_ratio":   round(float(df['freq_drop_ratio'].iloc[0]), 4),
        "high_engagement":   int(df['high_engagement'].iloc[0]),
        "near_contract_end": int(df['near_contract_end'].iloc[0]),
        "early_member":      int(df['early_member'].iloc[0]),
    }

    return PredictionResponse(
        churn_probability=round(prob, 4),
        churn_prediction=label,
        risk_level=risk,
        recommendation=get_recommendation(prob, customer),
        engineered_features=engineered,
    )


@app.post("/predict/batch", tags=["Prediction"])
def predict_batch(customers: list[CustomerInput]):
    """Predict churn for a batch of members."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    if len(customers) > 500:
        raise HTTPException(status_code=400, detail="Batch size limit is 500.")

    rows = [c.model_dump() for c in customers]
    df = pd.DataFrame(rows)
    df = add_engineered_features(df)
    df = df.reindex(columns=feature_names, fill_value=0)

    X_scaled = scaler.transform(df)
    probs  = model.predict_proba(X_scaled)[:, 1]
    labels = (probs >= 0.5).astype(int)

    return [
        {
            "index": i,
            "churn_probability": round(float(p), 4),
            "churn_prediction": int(l),
            "risk_level": "High" if p > 0.70 else ("Medium" if p > 0.40 else "Low"),
        }
        for i, (p, l) in enumerate(zip(probs, labels))
    ]
