import datetime
import secrets
from hashlib import sha256
from typing import Optional, Union, Any
import jwt
import bcrypt
from app.core.config import settings

def normalize_email(email: str) -> str:
    return email.strip().lower()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify standard text password against hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate salted hash of password."""
    # Ensure password is bytes
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")

def create_access_token(subject: Union[str, Any], session_version: int = 0) -> str:
    """Generate dynamic JWT token representing active login session."""
    now = datetime.datetime.now(datetime.timezone.utc)
    to_encode = {"exp": now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "iat": now, "sub": str(subject), "sv": session_version}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Validate JWT token structure and return the subject (e.g. user email or ID) if successful."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, AttributeError):
        return None

def new_reset_token() -> str:
    return secrets.token_urlsafe(32)

def token_digest(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()
