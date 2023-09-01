import enum

from sqlalchemy import Enum, ForeignKeyConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Country(enum.Enum):
    UKRAINE = "UKRAINE"
    USA = "USA"
    UK = "UK"
    POLAND = "POLAND"
    JAPAN = "JAPAN"
    AUSTRALIA = "AUSTRALIA"


class Address(Base):
    __tablename__ = "addresses"

    street: Mapped[str] = mapped_column(String(255), primary_key=True)
    city: Mapped[str] = mapped_column(String(255), primary_key=True)
    country: Mapped[Country] = mapped_column(Enum(Country), primary_key=True)
    users = relationship("User", backref="address")


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255))
    address_street: Mapped[str] = mapped_column(String(255))
    address_city: Mapped[str] = mapped_column(String(255))
    address_country: Mapped[Country] = mapped_column(Enum(Country))

    __table_args__ = (
        ForeignKeyConstraint(
            [address_street, address_city, address_country],
            [Address.street, Address.city, Address.country],
        ),
    )
