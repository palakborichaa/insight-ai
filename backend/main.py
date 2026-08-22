from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from pathlib import Path
import os
from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# ENVIRONMENT
# --------------------------------------------------

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")

if not gemini_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

gemini_client = genai.Client(api_key=gemini_key)


# --------------------------------------------------
# AI REQUEST MODEL
# --------------------------------------------------

class AIRequest(BaseModel):
    segment: str
    question: str
    customers: int
    avg_recency: float
    avg_frequency: float
    avg_monetary: float
    total_revenue: float
    revenue_share: float


# --------------------------------------------------
# APP
# --------------------------------------------------

app = FastAPI(
    title="InsightAI API",
    description="AI-powered customer intelligence API",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://insight-ai.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# DATA
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

RFM_PATH = BASE_DIR / "data" / "processed" / "rfm_customers.csv"
SEGMENT_PATH = BASE_DIR / "data" / "processed" / "segment_summary.csv"

rfm = pd.read_csv(RFM_PATH)
segment_summary = pd.read_csv(SEGMENT_PATH)


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "InsightAI API is running"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }


# --------------------------------------------------
# SEGMENTS
# --------------------------------------------------

@app.get("/api/segments")
def get_segments():

    return segment_summary.to_dict(
        orient="records"
    )


# --------------------------------------------------
# OVERVIEW
# --------------------------------------------------

@app.get("/api/overview")
def get_overview():

    champions = segment_summary[
        segment_summary["Segment"] == "Champions"
    ].iloc[0]

    return {
        "total_customers": int(len(rfm)),

        "total_revenue": float(
            segment_summary["Total_Revenue"].sum()
        ),

        "champions": int(
            champions["Customers"]
        ),

        "champion_revenue_share": float(
            champions["Revenue_Share"]
        )
    }


# --------------------------------------------------
# CUSTOMERS
# --------------------------------------------------

@app.get("/api/customers")
def get_customers(
    segment: str = "All",
    search: str = "",
    sort_by: str = "Monetary",
    order: str = "desc"
):

    customers = rfm.copy()

    # Create display ID
    customers = customers.reset_index(drop=True)

    customers["CustomerID"] = [
        f"CUST-{i + 1:04d}"
        for i in range(len(customers))
    ]

    # Filter by segment
    if segment != "All":

        customers = customers[
            customers["Segment"] == segment
        ]

    # Search by customer ID
    if search:

        customers = customers[
            customers["CustomerID"].str.contains(
                search,
                case=False,
                na=False
            )
        ]

    # Sort
    if sort_by in [
        "Recency",
        "Frequency",
        "Monetary"
    ]:

        customers = customers.sort_values(
            sort_by,
            ascending=(order == "asc")
        )

    # Return first 100
    customers = customers.head(100)

    return customers.to_dict(
        orient="records"
    )


# --------------------------------------------------
# AI ANALYST
# --------------------------------------------------

@app.post("/api/ai/analyze")
def analyze_segment(request: AIRequest):

    prompt = f"""
You are a customer analytics assistant.

Answer the user's question using ONLY the RFM data provided.

Segment: {request.segment}
Customers: {request.customers}
Average Recency: {request.avg_recency:.1f} days
Average Frequency: {request.avg_frequency:.1f}
Average Monetary: £{request.avg_monetary:,.2f}
Total Revenue: £{request.total_revenue:,.2f}
Revenue Share: {request.revenue_share:.1f}%

Question: {request.question}

Rules:
- Give a short, direct answer.
- Usually answer in 2-4 sentences.
- Use bullet points only when they make the answer clearer.
- Do not give unnecessary explanations.
- Do not invent data.
- Give detailed recommendations only when the question specifically asks for them.
"""

    try:

        response = gemini_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return {
            "answer": response.text
        }

    except Exception as e:

        return {
            "error": str(e)
        }