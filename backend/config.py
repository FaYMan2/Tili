from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGO = os.getenv("JWT_ALGO")
JWT_ACCESS_TOKEN_EXPIRE = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE"))
JWT_REFRESH_TOKEN_EXPIRE = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE"))
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")

