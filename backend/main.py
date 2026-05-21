from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from transformers import pipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = pipeline("sentiment-analysis")

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    df = pd.read_excel(file.file, engine="openpyxl")

    feedbacks = df["Feedback"].dropna().tolist()

    results = []

    positive = 0
    negative = 0

    for text in feedbacks:

        prediction = classifier(text[:512])[0]

        sentiment = prediction["label"]

        if sentiment == "POSITIVE":
            positive += 1
        else:
            negative += 1

        results.append({
            "feedback": text,
            "sentiment": sentiment,
            "score": float(prediction["score"])
        })

    return {
        "total_feedbacks": len(results),
        "positive": positive,
        "negative": negative,
        "results": results
    }