"""Dev-only endpoint to get a JWT by org_id — remove before production."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import create_access_token
from app.models.models import Organization, User, UserRole
from app.models.enums import UserRole
import uuid

router = APIRouter(prefix="/dev", tags=["dev"])

@router.post("/token")
async def dev_token(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get a JWT for an org without credentials. DEV ONLY."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    
    # Create or find a user for this org
    user_result = await db.execute(select(User).where(User.org_id == org.id))
    user = user_result.scalar_one_or_none()
    
    if not user:
        # Create a placeholder user
        user = User(
            org_id=org.id,
            email=org.email,
            hashed_password="dev",
            name="Dev User",
            role=UserRole.ACCOUNT_OWNER,
            can_initiate_takedowns=True,
            can_dismiss_threats=True,
            can_manage_whitelist=True,
            can_manage_keywords=True,
            can_refresh_fingerprints=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    token = create_access_token(str(user.id), str(org.id))
    return {"access_token": token, "org_id": str(org.id), "user_id": str(user.id)}
