import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from dotenv import load_dotenv
import requests
import psycopg2

load_dotenv()

AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
API_AUDIENCE = os.environ.get("API_AUDIENCE")
ALGORITHMS = [os.environ.get("ALGORITHMS", "RS256")]

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port={DB_PORT}"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] 
)

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

def get_jwk():
    jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    return requests.get(jwks_url).json()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        jwks = get_jwk()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token")
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=API_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except JWTError as e:
        print("JWT decode error:", e)
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print("Unexpected error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/items/{user_sub}")
def get_items(user_sub: str, 
              user: dict = Depends(get_current_user),
              conn=Depends(get_db_connection)):
    auth_user_sub = user.get("sub")
    if not auth_user_sub or user_sub != auth_user_sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access these items"
        )
    with conn.cursor() as cursor:
        cursor.execute("SELECT item, amount, currency FROM bills WHERE user_sub = %s", (user_sub,))
        rows = cursor.fetchall()
        items = [{"item": row[0], "amount": row[1], "currency": row[2]} for row in rows]
    return {"items": items}