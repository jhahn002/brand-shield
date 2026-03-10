"""Dev-only endpoint to get a JWT by org_id — remove before production."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Organization, User, UserRole, PlanTier

router = APIRouter(prefix="/dev", tags=["dev"])


@router.post("/token")
async def dev_token(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get a JWT for an org without credentials. DEV ONLY."""
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
            role=UserRole.ACCOUNT_OWNER,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Import auth here to avoid circular imports
    from app.auth import create_access_token
    token = create_access_token(str(user.id), str(org.id))
    return {"access_token": token, "org_id": str(org.id), "user_id": str(user.id)}
