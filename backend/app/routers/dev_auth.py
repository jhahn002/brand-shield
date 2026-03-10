"""Dev-only endpoint to mint a JWT by org_id — no credentials needed."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Organization, User, UserRole
from app.auth import create_access_token

router = APIRouter(prefix="/dev", tags=["dev"])

@router.post("/token")
async def dev_token(org_id: str, db: AsyncSession = Depends(get_db)):
    """Mint a JWT for an existing org. DEV ONLY."""
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Org not found")
    user_result = await db.execute(select(User).where(User.org_id == org.id))
    user = user_result.scalar_one_or_none()
    if not user:
        user = User(
            org_id=org.id,
            email=org.email,
            hashed_password="dev",
            name="Dev User",
            role=UserRole.account_owner,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    token = create_access_token(str(user.id), str(org.id))
    return {"access_token": token, "org_id": str(org.id), "user_id": str(user.id)}
