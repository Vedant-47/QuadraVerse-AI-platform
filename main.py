from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .summarizer import summarize

app = FastAPI()

# Enable frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    text: str

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    summary = summarize(request.text)
    return {"summary": summary}

@app.get("/")
async def root():
    return {"message": "Summarizer API is running!"}
