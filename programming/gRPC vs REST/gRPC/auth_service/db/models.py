from sqlalchemy import TIMESTAMP, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .database import Base


class Login(Base):
    __tablename__ = "logins"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    timestamp: Mapped[int] = mapped_column(
        TIMESTAMP(timezone=True),
        primary_key=True,
        server_default=func.current_timestamp(),
    )
