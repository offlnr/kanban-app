import re
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# asyncpg doesn't accept sslmode= in the URL — strip it and pass ssl=True instead
_url = re.sub(r'[?&]sslmode=\w+', '', settings.DATABASE_URL)
_ssl = 'sslmode=' in settings.DATABASE_URL
engine = create_async_engine(_url, connect_args={"ssl": True} if _ssl else {}, echo=False)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session