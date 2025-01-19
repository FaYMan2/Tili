from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth import AuthHandler


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
    
@app.post("/signup")
def signup(username: str, password: str):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    hashed_password = auth.getPwdHash(password)
    fake_users_db[username] = {"username": username, "password": hashed_password}
    return {"message": "User created successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = fake_users_db.get(form_data.username)
    if not user or not auth.verifyPwd(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = auth.createAccessToken({"sub": form_data.username})
    refresh_token = auth.createRefreshToken({"sub": form_data.username})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/refresh")
def refresh_token(refresh_token: str):
    username = auth.decodeToken(refresh_token, is_refresh=True)
    new_access_token = auth.createAccessToken({"sub": username})
    return {"access_token": new_access_token, "token_type": "bearer"}

@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    payload = auth.decodeToken(token,is_refresh = False)
    return {"message": payload}
