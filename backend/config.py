from dotenv import load_dotenv
import os
import logging
from supabase import create_client

load_dotenv()

required_env_vars = [
    "SUPABASE_URL",
    "SUPABASE_API_KEY",
    "TOGETHER_API_KEY",
    "JWT_SECRET_KEY",
    "JWT_ALGO",
    "JWT_ACCESS_TOKEN_EXPIRE",
    "JWT_REFRESH_TOKEN_EXPIRE",
    "JWT_REFRESH_SECRET"
]

missing_vars = [var for var in required_env_vars if os.getenv(var) is None]

if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGO = os.getenv("JWT_ALGO")


try:
    JWT_ACCESS_TOKEN_EXPIRE = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE"))
    JWT_REFRESH_TOKEN_EXPIRE = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE"))
except ValueError:
    raise ValueError("JWT_ACCESS_TOKEN_EXPIRE and JWT_REFRESH_TOKEN_EXPIRE must be integers")

JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")

try:
    DB = create_client(supabase_url=SUPABASE_URL, supabase_key=SUPABASE_API_KEY)
except Exception as e:
    logging.error(f"Failed to initialize Supabase client: {e}")
    raise
