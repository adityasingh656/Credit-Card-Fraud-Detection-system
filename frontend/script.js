const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const analyzeButton = document.getElementById("analyzeButton");

const statusMessage = document.getElementById("statusMessage");

const resultCard = document.getElementById("resultCard");
const predictionResult = document.getElementById("predictionResult");
const anomalyScore = document.getElementById("anomalyScore");
const threshold = document.getElementById("threshold");


/* Show selected file */

fileInput.addEventListener("change", () => {

    if (fileInput.files.length > 0) {
        fileName.textContent = fileInput.files[0].name;
        statusMessage.textContent = "";
    } else {
        fileName.textContent = "No file selected";
    }

});


/* Analyze transaction */

analyzeButton.addEventListener("click", async () => {

    if (fileInput.files.length === 0) {
        statusMessage.textContent = "Please select a CSV file first.";
        return;
    }

    const file = fileInput.files[0];

    if (!file.name.toLowerCase().endsWith(".csv")) {
        statusMessage.textContent = "Please select a CSV file.";
        return;
    }

    try {

        analyzeButton.disabled = true;
        analyzeButton.textContent = "Analyzing...";

        statusMessage.textContent = "Sending transaction to fraud detection model...";

        /*
         * Read CSV file
         */
        const text = await file.text();

        const rows = text.trim().split(/\r?\n/);

        if (rows.length < 2) {
            throw new Error("CSV file does not contain a transaction.");
        }

        const headers = rows[0].split(",");
        const values = rows[1].split(",");

        if (headers.length !== values.length) {
            throw new Error("Invalid CSV format.");
        }

        const transaction = {};

        headers.forEach((header, index) => {
            transaction[header.trim()] = Number(values[index]);
        });


        /*
         * Send transaction to Flask
         */
        const response = await fetch("/api/predict", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
});

        let result;

try {
    result = await response.json();
} catch {
    throw new Error("Invalid response from server.");
}

        if (!response.ok) {
            throw new Error(result.error || "Prediction failed.");
        }


        /*
         * Display result
         */
        resultCard.classList.remove("hidden");

        predictionResult.textContent = result.prediction;

        anomalyScore.textContent =
            Number(result.anomaly_score).toFixed(6);

        threshold.textContent =
            Number(result.threshold).toFixed(6);

        statusMessage.textContent =
            "Transaction analyzed successfully.";

    } catch (error) {

        statusMessage.textContent =
            "Error: " + error.message;

        resultCard.classList.add("hidden");

    } finally {

        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Transaction";

    }

});