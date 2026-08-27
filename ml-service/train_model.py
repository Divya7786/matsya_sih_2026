"""
MATSYA AI — PFZ RandomForest Model Training
============================================
Retrains the model with the current sklearn version and corrected pseudo-labels.

Pseudo-label definition (domain-knowledge based, Indian Ocean PFZ criteria):
  PFZ = 1 if:
    - SST in [26°C, 30°C]     : optimal range for Indian pelagic species
    - sst_gradient > 0.2       : significant thermal front (°C / 0.25° grid)
    - chlorophyll > 0.4 mg/m³  : above-baseline marine productivity

  PFZ = 0 otherwise

Training data: synthetic samples drawn from realistic Indian Ocean distributions
(Bay of Bengal, Arabian Sea, Indian Ocean open water).

Label type: PSEUDO-LABEL (NOT official INCOIS PFZ advisory data)
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

np.random.seed(42)
N = 6000  # total samples


# ── Region sampling ───────────────────────────────────────────────────────────
# Bay of Bengal (high SST, moderate-high chlorophyll, variable gradients)
n_bob = 2400
sst_bob   = np.random.uniform(26.5, 30.5, n_bob)
grad_bob  = np.abs(np.random.normal(0.4, 0.3, n_bob)).clip(0.01, 3.0)
chl_bob   = np.abs(np.random.exponential(0.8, n_bob)).clip(0.05, 8.0)

# Arabian Sea (upwelling, cooler SST, very high chlorophyll)
n_as = 1800
sst_as   = np.random.uniform(22.0, 29.5, n_as)
grad_as  = np.abs(np.random.normal(0.5, 0.4, n_as)).clip(0.01, 3.5)
chl_as   = np.abs(np.random.exponential(1.2, n_as)).clip(0.05, 12.0)

# Indian Ocean (mixed, including open-ocean low-productivity)
n_io = 1800
sst_io   = np.random.uniform(20.0, 32.0, n_io)
grad_io  = np.abs(np.random.normal(0.2, 0.25, n_io)).clip(0.0, 2.0)
chl_io   = np.abs(np.random.exponential(0.4, n_io)).clip(0.01, 5.0)

sst_all  = np.concatenate([sst_bob, sst_as, sst_io])
grad_all = np.concatenate([grad_bob, grad_as, grad_io])
chl_all  = np.concatenate([chl_bob, chl_as, chl_io])


# ── Pseudo-label rule ─────────────────────────────────────────────────────────
def pfz_label(sst, gradient, chlorophyll):
    """
    PFZ = 1 if SST in optimal range AND thermal front present AND productive.
    Matches the primary criteria used by INCOIS PFZ advisory methodology.
    """
    sst_ok  = (sst >= 26.0) & (sst <= 30.5)
    front   = gradient >= 0.2
    product = chlorophyll >= 0.4
    return ((sst_ok & front & product)).astype(int)

labels = pfz_label(sst_all, grad_all, chl_all)

df = pd.DataFrame({
    'sst': sst_all,
    'sst_gradient': grad_all,
    'chlorophyll': chl_all,
    'pfz': labels,
})

print(f"Dataset: {len(df)} samples")
print(f"PFZ=1: {labels.sum()} ({labels.mean()*100:.1f}%)")
print(f"PFZ=0: {(labels==0).sum()} ({(labels==0).mean()*100:.1f}%)")

X = df[['sst', 'sst_gradient', 'chlorophyll']]
y = df['pfz']


# ── Train/test split ──────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=3,
    class_weight='balanced',
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc   = accuracy_score(y_test, y_pred)
prec  = precision_score(y_test, y_pred)
rec   = recall_score(y_test, y_pred)
f1    = f1_score(y_test, y_pred)

print(f"\nTest accuracy : {acc:.4f}")
print(f"Precision     : {prec:.4f}")
print(f"Recall        : {rec:.4f}")
print(f"F1            : {f1:.4f}")
print("\nClassification report:")
print(classification_report(y_test, y_pred))


# ── Spot checks ───────────────────────────────────────────────────────────────
spot = pd.DataFrame([
    {'sst': 28.4, 'sst_gradient': 0.8,  'chlorophyll': 0.35},
    {'sst': 28.0, 'sst_gradient': 0.5,  'chlorophyll': 0.8},
    {'sst': 27.5, 'sst_gradient': 0.3,  'chlorophyll': 1.5},
    {'sst': 29.0, 'sst_gradient': 0.2,  'chlorophyll': 0.15},
    {'sst': 25.0, 'sst_gradient': 0.05, 'chlorophyll': 0.1},
    {'sst': 28.5, 'sst_gradient': 1.2,  'chlorophyll': 2.0},
    {'sst': 31.0, 'sst_gradient': 0.8,  'chlorophyll': 1.0},
    {'sst': 23.0, 'sst_gradient': 1.5,  'chlorophyll': 3.0},
])
preds = model.predict(spot)
probas = model.predict_proba(spot)
print("\nSpot checks:")
for i, row in spot.iterrows():
    print(f"  SST={row['sst']}, grad={row['sst_gradient']}, chl={row['chlorophyll']} "
          f"=> PFZ={preds[i]}, P(PFZ)={probas[i][1]:.3f}")


# ── Save model ────────────────────────────────────────────────────────────────
model_path = Path(__file__).parent / "orca_pfz_random_forest.joblib"
joblib.dump(model, model_path)
print(f"\nModel saved: {model_path}")


# ── Save metadata ─────────────────────────────────────────────────────────────
import sklearn
meta = {
    "model": "RandomForestClassifier",
    "sklearn_version": sklearn.__version__,
    "n_estimators": 200,
    "max_depth": 12,
    "features": ["sst", "sst_gradient", "chlorophyll"],
    "feature_order": "sst, sst_gradient, chlorophyll",
    "classes": [0, 1],
    "class_meaning": {"0": "NOT_PFZ", "1": "PFZ"},
    "training_samples": int(len(X_train)),
    "testing_samples": int(len(X_test)),
    "total_samples": int(len(df)),
    "pfz_predictions": int(labels.sum()),
    "pfz_ratio_percent": round(float(labels.mean()) * 100, 1),
    "test_accuracy": round(float(acc), 4),
    "test_precision": round(float(prec), 4),
    "test_recall": round(float(rec), 4),
    "test_f1": round(float(f1), 4),
    "data_date": "2026-08-28",
    "sst_source": "Synthetic (Indian Ocean distribution — Bay of Bengal, Arabian Sea, Indian Ocean)",
    "chlorophyll_source": "Synthetic (exponential distribution, Indian Ocean baseline)",
    "label_type": "pseudo-label",
    "label_rule": "PFZ=1 if SST in [26,30.5]°C AND sst_gradient >= 0.2 AND chlorophyll >= 0.4",
    "warning": "PSEUDO-LABEL model. NOT official INCOIS PFZ advisory. For demonstration and research only.",
    "disclaimer": "Labels derived from oceanographic rules, not verified catch data or official INCOIS advisories.",
}

meta_path = Path(__file__).parent.parent / "server" / "models" / "orca_pfz_metadata.json"
meta_path.parent.mkdir(parents=True, exist_ok=True)
with open(meta_path, "w") as f:
    json.dump(meta, f, indent=2)
print(f"Metadata saved: {meta_path}")
