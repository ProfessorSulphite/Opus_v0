"""
Authentication endpoints
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from loguru import logger

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, verify_token
from app.crud.user import create_user, authenticate_user, get_user_by_username, get_user_by_email, get_user_by_id, set_user_verification_code
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token, TokenData

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get current authenticated user"""
    try:
        payload = verify_token(credentials.credentials)
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        token_data = TokenData(username=username)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Account will be inactive until verified."""
    try:
        # Check if username already exists
        existing_user = get_user_by_username(db, user.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email already exists
        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user (will be inactive by default)
        db_user = create_user(db, user)
        
        # In a real implementation, you would generate a code and send a verification email.
        # from app.core.security import generate_verification_code
        # from app.services.email import send_verification_email
        # verification_code = generate_verification_code() # e.g., "123456"
        # set_user_verification_code(db, db_user.id, verification_code)
        # await send_verification_email(to_email=db_user.email, code=verification_code)
        logger.info(f"New user '{db_user.username}' registered. Verification needed.")
        logger.info(f"Placeholder: Verification code for {db_user.username} is '123456'")

        return UserResponse.from_orm(db_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=Token)
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    try:
        user = authenticate_user(db, username, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account not active. Please verify your email."
            )

        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        logger.info(f"User logged in: {user.username}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """Logout user (client should delete token)"""
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Successfully logged out"}

# --- Placeholder Endpoints for Social Login & Email Verification ---

@router.post("/verify-email")
async def verify_email_endpoint(code: str = Form(...), db: Session = Depends(get_db)):
    """
    Verify a user's email address with a code.
    Placeholder implementation uses a dummy code.
    """
    from app.crud.user import verify_user_by_code
    logger.info(f"Email verification attempt with code: '{code}'.")
    
    user = verify_user_by_code(db, code)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    logger.info(f"User account activated: {user.username}")
    return {"message": "Email verified successfully. You can now log in."}


@router.get("/google/login", include_in_schema=False)
async def google_login():
    """
    Placeholder for Google OAuth2 login.
    In a real implementation, this would redirect the user to Google's consent screen.
    """
    logger.info("Attempted Google login. Endpoint not fully configured.")
    return {"message": "Google login not configured. This is a placeholder."}

@router.get("/google/callback", include_in_schema=False)
async def google_callback():
    """
    Placeholder for Google OAuth2 callback.
    In a real implementation, this would handle the callback from Google,
    exchange the authorization code for an access token, fetch user info,
    and create a session for the user.
    """
    logger.info("Google callback hit. Endpoint not fully configured.")
    return {"message": "Google callback received. This is a placeholder."}
