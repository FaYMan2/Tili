import jwt 
from fastapi import HTTPException,Security
from fastapi.security import HTTPBearer
from passlib.context import CryptContext    
from datetime import timedelta,datetime,timezone
from config import JWT_SECRET_KEY,JWT_ACCESS_TOKEN_EXPIRE,JWT_REFRESH_TOKEN_EXPIRE,JWT_ALGO,JWT_REFRESH_SECRET
from typing import Optional

class AuthHandler():
    security = HTTPBearer()
    pwd_context = CryptContext(schemes=["bcrypt"],deprecated = "auto")
    secret = JWT_SECRET_KEY
    
    def getPwdHash(self,password : str) -> str :
        return self.pwd_context.hash(password)
    
    def verifyPwd(self,plainPwd : str,hashedPwd) -> bool:
        return self.pwd_context.verify(plainPwd,hashedPwd) 
    
    def createAccessToken(self,data : dict,expiresDelta : Optional[timedelta] = None) -> str:
        toEncode = data.copy()
        expire = datetime.now() + (expiresDelta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE))
        toEncode.update({"exp" : expire})
        return jwt.encode(toEncode,self.secret,algorithm=JWT_ALGO)
    
    def createRefreshToken(self,data : dict,expiresDelta : Optional[timedelta] = None) -> str:
        toEncode = data.copy()
        expire = datetime.now() + (expiresDelta or timedelta(days=JWT_REFRESH_TOKEN_EXPIRE))
        toEncode.update({"exp" : expire})
        return jwt.encode(toEncode,self.secret,algorithm=JWT_ALGO)
    
    def decodeToken(self, token: str, is_refresh: bool = False):
        secret = JWT_REFRESH_SECRET if is_refresh else JWT_SECRET_KEY
        try:
            payload = jwt.decode(token, secret, algorithms=[JWT_ALGO])

            exp = payload.get("exp")
            if exp is not None:
                current_time = datetime.now(tz=timezone.utc).timestamp()
                print(current_time)
                if current_time > exp:
                    raise HTTPException(status_code=401, detail="Token has expired")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.DecodeError:
            raise HTTPException(status_code=401, detail="Token is invalid")
  