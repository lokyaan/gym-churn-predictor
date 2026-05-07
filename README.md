# 🏋️ Gym Customer Churn Predictor

Full-stack ML project — XGBoost pipeline + FastAPI backend + React frontend.

---

## 📁 Project Structure

```
gym-churn/
│
├── data/
│   ├── PUT_DATASET_HERE.md     ← Read this first!
│   └── gym_churn.csv           ← Download from Kaggle & place here
│
├── notebooks/
│   └── churn_analysis.ipynb    ← EDA + feature engineering + model training
│
├── models/                     ← Auto-generated after running notebook
│   ├── xgb_model.pkl
│   ├── scaler.pkl
│   ├── feature_names.pkl
│   └── metrics.json
│
├── api/
│   ├── main.py                 ← FastAPI backend
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             ← Main React app
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Get the Dataset
1. Go to: https://www.kaggle.com/datasets/adrianvinueza/gym-customers-features-and-churn
2. Download & extract the CSV
3. Rename it `gym_churn.csv`
4. Place it in `data/gym_churn.csv`

### Step 2 — Run the Notebook (trains & saves the model)
```bash
pip install pandas numpy scikit-learn xgboost matplotlib seaborn joblib jupyter

cd gym-churn
jupyter notebook notebooks/churn_analysis.ipynb
```
Run all cells top to bottom. This saves the model to `models/`.

### Step 3 — Start the FastAPI Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API runs at: http://localhost:8000
- Interactive docs: http://localhost:8000/docs

### Step 4 — Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend runs at: http://localhost:3000

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/health` | Model load status + AUC |
| GET | `/model/metrics` | CV results + feature importances |
| POST | `/predict` | Single member churn prediction |
| POST | `/predict/batch` | Batch prediction (max 500) |

### Example prediction request
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "gender": 1,
    "Near_Location": 1,
    "Partner": 0,
    "Promo_friends": 0,
    "Phone": 1,
    "Contract_period": 1,
    "Group_visits": 0,
    "Age": 29,
    "Avg_additional_charges_total": 120,
    "Month_to_end_contract": 1,
    "Lifetime": 4,
    "Avg_class_frequency_total": 1.5,
    "Avg_class_frequency_current_month": 0.8
  }'
```

### Response
```json
{
  "churn_probability": 0.7841,
  "churn_prediction": 1,
  "risk_level": "High",
  "recommendation": "Urgent: offer a discounted annual contract + complimentary group class trial.",
  "engineered_features": {
    "freq_drop_ratio": 0.5333,
    "high_engagement": 0,
    "near_contract_end": 1,
    "early_member": 0
  }
}
```

---

## 🧠 ML Pipeline Summary

### Features (raw)
`gender`, `Near_Location`, `Partner`, `Promo_friends`, `Phone`, `Contract_period`,
`Group_visits`, `Age`, `Avg_additional_charges_total`, `Month_to_end_contract`,
`Lifetime`, `Avg_class_frequency_total`, `Avg_class_frequency_current_month`

### Engineered Features
| Feature | Formula | Why |
|---|---|---|
| `freq_drop_ratio` | current_month / lifetime_avg | Detects engagement decline |
| `high_engagement` | freq_total ≥ 3.0 | Strong retention signal |
| `near_contract_end` | months_remaining ≤ 1 | Peak churn window |
| `early_member` | lifetime ≤ 2 months | Onboarding churn risk |

### Models Compared (5-fold Stratified CV, ROC-AUC)
- Logistic Regression (baseline)
- Random Forest
- Gradient Boosting (sklearn)
- **XGBoost** ← winner

### XGBoost Hyperparameters
```python
XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,   # L1
    reg_lambda=1.0,  # L2
    eval_metric='logloss',
)
```

---

## 🎯 Interview Talking Points

**Why XGBoost over sklearn GBM?**
XGBoost parallelizes tree construction (sklearn GBM is sequential), has built-in L1/L2 regularization, handles missing values natively, and is 10-20x faster on larger datasets.

**Why those engineered features?**
`freq_drop_ratio` captures *change* in behavior, not just raw frequency — a member dropping from 4 to 2 visits/week is very different from a stable 2 visits/week member.

**How would you productionize this?**
FastAPI endpoint (already done) + daily batch scoring via cron/Airflow + push high-risk members to CRM → trigger retention campaign. Track intervention outcomes to build a feedback loop.

**What would you do next?**
Add SHAP explainability per prediction, A/B test retention interventions, set probability threshold based on cost-benefit analysis (intervention cost vs LTV).
