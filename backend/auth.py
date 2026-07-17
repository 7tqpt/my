"""Authentication utilities: JWT + password hashing."""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import jwt

from database import coll_users

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me-super-secret-property-mgmt-2026')
JWT_ALG = 'HS256'
JWT_EXP_HOURS = 24 * 7  # 7 days

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(password, hashed)
    except Exception:
        return False


def create_token(user_id: str, username: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'username': username,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token')
    user = await coll_users.find_one({'id': payload['sub']})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    if not user.get('is_active', True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='User inactive')
    user.pop('password', None)
    user.pop('_id', None)
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin required')
    return user
