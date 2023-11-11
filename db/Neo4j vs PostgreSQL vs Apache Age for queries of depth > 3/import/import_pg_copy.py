from typing import List

from sqlalchemy import Column, ForeignKey, Integer, String, Table, create_engine, select
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship


class Base(DeclarativeBase):
    pass


friendships = Table(
    f"friendship",
    Base.metadata,
    Column(f"friend_a_uid", Integer, ForeignKey("person.uid"), primary_key=True),
    Column(f"friend_b_uid", Integer, ForeignKey("person.uid"), primary_key=True),
)


class Person(Base):
    __tablename__ = "person"
    uid: Mapped[int] = mapped_column(index=True, primary_key=True)
    age: Mapped[int] = mapped_column()
    name: Mapped[str] = mapped_column(String(512), index=True)
    friends: Mapped[List["Person"]] = relationship(
        secondary="friendship",
        primaryjoin="person.c.uid == friendship.c.friend_a_uid",
        secondaryjoin="person.c.uid == friendship.c.friend_a_uid",
    )


if __name__ == "__main__":
    engine = create_engine(
        "postgresql+psycopg2://postgres:testtest@localhost:5432/neo4j"
    )

    Base.metadata.create_all(engine)

    # Connect to your postgres DB
    conn = engine.raw_connection()

    # Open a cursor to perform database operations
    cur = conn.cursor()

    with open("nodes.csv", "r") as f:
        next(f)  # skip header
        cur.copy_from(f, "person", sep=",", columns=("uid", "name", "age"))
        # Commit Changes
        conn.commit()

    with open("edges.csv", "r") as f:
        next(f)  # skip header
        cur.copy_from(
            f, "friendship", sep=",", columns=("friend_a_uid", "friend_b_uid")
        )
        # Commit Changes
        conn.commit()

    # Close connection
    conn.close()
