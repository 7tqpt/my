"""Authentication utilities: JWT + password hashing + single-session enforcement."""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
import jwt

from database import coll_users, db

# Sessions collection - tracks the single active session per user
coll_sessions = db.sessions

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = 'HS256'
JWT_EXP_HOURS = 24 * 7  # 7 days
# Idle timeout: force logout if no activity for this many seconds (default 3 min)
SESSION_IDLE_SECONDS = int(os.environ.get('SESSION_IDLE_SECONDS', '180'))

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


async def start_session(user_id: str, token: str):
    """Register a new session; invalidate any previous session for this user."""
    now = datetime.now(timezone.utc).isoformat()
    # Kick out any existing sessions for this user (single-session policy)
    await coll_sessions.delete_many({'user_id': user_id})
    await coll_sessions.insert_one({
        'user_id': user_id,
        'token': token,
        'created_at': now,
        'last_activity': now,
    })


async def end_session(token: str):
    await coll_sessions.delete_many({'token': token})


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='غير مصرح - يرجى تسجيل الدخول')
    token = creds.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='رمز الجلسة غير صالح أو منتهي')

    # Check session record exists and is not idle-timed-out
    session = await coll_sessions.find_one({'token': token})
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='تم تسجيل دخولك من جهاز آخر أو انتهت الجلسة')

    # Idle timeout check
    try:
        last = datetime.fromisoformat(session['last_activity'])
    except Exception:
        last = datetime.now(timezone.utc)
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    idle_seconds = (datetime.now(timezone.utc) - last).total_seconds()
    if idle_seconds > SESSION_IDLE_SECONDS:
        await coll_sessions.delete_one({'token': token})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f'انتهت جلستك بسبب عدم النشاط ({int(SESSION_IDLE_SECONDS/60)} دقيقة). يرجى تسجيل الدخول مرة أخرى')

    # Update last_activity
    await coll_sessions.update_one(
        {'token': token},
        {'$set': {'last_activity': datetime.now(timezone.utc).isoformat()}}
    )

    user = await coll_users.find_one({'id': payload['sub']})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='المستخدم غير موجود')
    if not user.get('is_active', True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='هذا الحساب غير نشط')
    user.pop('password', None)
    user.pop('_id', None)
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='هذه العملية مخصصة لمدير النظام فقط')
    return user
