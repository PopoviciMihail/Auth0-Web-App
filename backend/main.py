import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
API_AUDIENCE = os.environ.get("API_AUDIENCE")
ALGORITHMS = [os.environ.get("ALGORITHMS", "RS256")]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] 
)

@app.get("/")
def read_root():
    return {"message":"Hello World"}