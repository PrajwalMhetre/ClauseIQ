import datetime
import smtplib
import time
from collections import defaultdict, deque
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.database import get_db
from app.db.models import PasswordResetToken, User

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
_attempts: dict[str, deque[float]] = defaultdict(deque)


def password_is_valid(value: str) -> str:
    if len(value) < 12 or not any(c.isupper() for c in value) or not any(c.islower() for c in value) or not any(c.isdigit() for c in value):
        raise ValueError("Password must be at least 12 characters and include upper-case, lower-case, and a number")
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str = Field(min_length=1, max_length=200)
    _password = field_validator("password")(password_is_valid)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=1024)


class ResetRequest(BaseModel):
    email: EmailStr


class ResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    password: str
    _password = field_validator("password")(password_is_valid)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    class Config:
        from_attributes = True


def _rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    entries = _attempts[key]
    while entries and now - entries[0] > 60:
        entries.popleft()
    if len(entries) >= 10:
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    entries.append(now)


def _token_response(user: User) -> dict:
    return {"access_token": security.create_access_token(user.id, user.session_version), "token_type": "bearer", "user": {
        "id": user.id, "email": user.email, "full_name": user.full_name, "is_admin": user.is_admin}}


def _send_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.RESET_URL_BASE}?token={token}"
    if settings.EMAIL_PROVIDER == "console" and settings.ENVIRONMENT != "production":
        print(f"Password reset URL: {reset_url}")
    elif settings.EMAIL_PROVIDER == "smtp":
        message = EmailMessage()
        message["Subject"] = "Reset your ClauseIQ password"
        message["From"] = settings.SMTP_FROM
        message["To"] = email
        message.set_content(f"Use this one-time link within {settings.PASSWORD_RESET_TTL_MINUTES} minutes: {reset_url}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = security.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        user = db.get(User, int(payload["sub"]))
    except (KeyError, TypeError, ValueError):
        user = None
    if not user or not user.is_active or payload.get("sv") != user.session_version:
        raise HTTPException(status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    email = security.normalize_email(str(user_in.email))
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email address already exists.")
    user = User(email=email, hashed_password=security.get_password_hash(user_in.password), full_name=user_in.full_name.strip())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    _rate_limit(request)
    user = db.query(User).filter(User.email == security.normalize_email(str(login_in.email))).first()
    if not user or not user.is_active or not security.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    return _token_response(user)


@router.post("/logout", status_code=204)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.session_version += 1
    db.commit()


@router.post("/password-reset/request", status_code=202)
def request_password_reset(body: ResetRequest, request: Request, db: Session = Depends(get_db)):
    _rate_limit(request)
    user = db.query(User).filter(User.email == security.normalize_email(str(body.email))).first()
    if user and user.is_active:
        token = security.new_reset_token()
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)).update({"used_at": datetime.datetime.utcnow()})
        db.add(PasswordResetToken(user_id=user.id, token_hash=security.token_digest(token), expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.PASSWORD_RESET_TTL_MINUTES)))
        db.commit()
        try:
            _send_reset_email(user.email, token)
        except Exception:
            # Do not reveal account state or delivery details to unauthenticated callers.
            pass
    return {"message": "If an active account exists, reset instructions have been sent."}


@router.post("/password-reset/confirm", status_code=204)
def confirm_password_reset(body: ResetConfirm, db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == security.token_digest(body.token), PasswordResetToken.used_at.is_(None), PasswordResetToken.expires_at > now).first()
    if not record or not record.user.is_active:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    record.user.hashed_password = security.get_password_hash(body.password)
    record.user.session_version += 1
    record.used_at = now
    db.commit()


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
