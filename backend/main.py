from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth import AuthHandler
from config import DB
from pydantic import BaseModel

app = FastAPI()
auth = AuthHandler()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

    
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*'],
)

@app.get("/")
async def main():
    return {"message" : "TILI API"}

fake_users_db = {
    "user@example.com": {
        "username": "user@example.com",
        "password": "$2b$12$yQw.vZjIy8Y9OY1jG4bR4eSiZ2qlQfpLFdZKOyAfXx4WiElGzJHae",  # Hashed password for "password123"
    }
}
    
class UserInput(BaseModel):
    username: str
    email: str
    password: str

@app.post("/signup")
async def signup(user: UserInput):
    try:
        hashed_password = auth.getPwdHash(user.password)
        
        new_user = {
            "username": user.username,
            "Email": user.email,
            "hashed_pwd": hashed_password,
        }
        response = DB.table('User').insert(new_user).execute()
        if hasattr(response, 'data'):
            user_data = response.data[0]
            return {
                "message": "User created successfully",
                "user_data": {
                    "email": user_data.get('Email'),
                    "userId": user_data.get('id'),
                    "userName": user_data.get('username'),
                }
            }
        else:
            raise Exception("Unexpected response format from the database.")
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists."
            )
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = DB.table("User").select("*").eq("Email", form_data.username).execute()
    if not user.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_data = user.data[0]
    if not auth.verifyPwd(form_data.password, user_data["hashed_pwd"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.createAccessToken({"sub": user_data["Email"]})
    refresh_token = auth.createRefreshToken({"sub": user_data["Email"]})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@app.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = auth.decodeToken(refresh_token)
    new_access_token = auth.createAccessToken({"sub": payload["sub"]})
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.get("/protected")
async def protected_route(token: str = Depends(oauth2_scheme)):
    payload = auth.decodeToken(token)
    return {"message": f"Hello {payload['sub']}"}