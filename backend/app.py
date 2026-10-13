from flask import Flask, jsonify, request, send_from_directory
import joblib
from pathlib import Path

app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path=""
)

# Project root
BASE_DIR = Path(__file__).resolve().parent.parent

# Model paths
MODEL_PATH = BASE_DIR / "models" / "final_isolation_forest.pkl"
SCALER_PATH = BASE_DIR / "models" / "final_scaler.pkl"
THRESHOLD_PATH = BASE_DIR / "models" / "fraud_threshold.pkl"

# Load trained model
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
threshold = joblib.load(THRESHOLD_PATH)


@app.route("/")
def home():
    return send_from_directory(
        app.static_folder,
        "index.html"
    )


@app.route("/api/status")
def status():
    return jsonify({
        "status": "running",
        "model": "Isolation Forest",
        "threshold": float(threshold)
    })

from flask import request
import pandas as pd


FEATURES = [
    "Time",
    "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10",
    "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19",
    "V20", "V21", "V22", "V23", "V24", "V25", "V26", "V27", "V28",
    "Amount"
]


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No transaction data provided"
            }), 400

        # Convert input to DataFrame
        transaction = pd.DataFrame([data])

        # Check required features
        missing_features = [
            feature for feature in FEATURES
            if feature not in transaction.columns
        ]

        if missing_features:
            return jsonify({
                "error": "Missing features",
                "missing": missing_features
            }), 400

        # Keep exact feature order
        transaction = transaction[FEATURES]

        # Scale Amount
        transaction["Amount"] = scaler.transform(
            transaction[["Amount"]]
        )

        # Calculate anomaly score
        decision_score = model.decision_function(transaction)
        anomaly_score = float(-decision_score[0])

        # Fraud decision
        predicted_fraud = int(anomaly_score >= threshold)

        prediction = (
            "FRAUD"
            if predicted_fraud == 1
            else "LEGITIMATE"
        )

        return jsonify({
            "prediction": prediction,
            "predicted_fraud": predicted_fraud,
            "anomaly_score": anomaly_score,
            "threshold": float(threshold)
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
if __name__ == "__main__":
    app.run(debug=True)