from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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