from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

try:
    p = "123456"
    h = get_password_hash(p)
    print(f"Hash of '{p}': {h}")
except Exception as e:
    print(f"Error: {e}")
