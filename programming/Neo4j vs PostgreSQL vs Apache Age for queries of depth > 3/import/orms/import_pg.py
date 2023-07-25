import csv
from typing import List

from sqlalchemy import Column, ForeignKey, Integer, String, Table, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship
from sqlalchemy.ext.declarative import declared_attr


class Base(DeclarativeBase):
    pass


class PersonMixin(object):
    uid: Mapped[int] = mapped_column(index=True, primary_key=True)
    age: Mapped[int] = mapped_column()
    name: Mapped[str] = mapped_column(String(512), index=True)


def create_friendship_table(table_name):
    return Table(
        f"{table_name}_friendships",
        Base.metadata,
        Column(
            f"friend_a_uid", Integer, ForeignKey(f"{table_name}.uid"), primary_key=True
        ),
        Column(
            f"friend_b_uid", Integer, ForeignKey(f"{table_name}.uid"), primary_key=True
        ),
    )


class Person_1_mil(Base, PersonMixin):
    __tablename__ = "person_1_mil"
    friends: Mapped[List["Person_1_mil"]] = relationship(
        secondary="person_1_mil_friendships",
        primaryjoin="person_1_mil.c.uid == person_1_mil_friendships.c.friend_a_uid",
        secondaryjoin="person_1_mil.c.uid == person_1_mil_friendships.c.friend_a_uid",
    )

    def __repr__(self) -> str:
        return f"Person(uid={self.uid!r}, name={self.name!r}, friend_uids={self.friends})"


friendship_1_mil = create_friendship_table("person_1_mil")


# class Person_10_mil(Base, PersonMixin):
#     __tablename__ = "person_10_mil"
#     friends: Mapped[List["Person_10_mil"]] = relationship(
#         secondary="person_10_mil_friendships",
#         primaryjoin="person_10_mil.c.uid == person_10_mil_friendships.c.friend_a_uid",
#         secondaryjoin="person_10_mil.c.uid == person_10_mil_friendships.c.friend_a_uid",
#     )


# friendship_10_mil = create_friendship_table("person_10_mil")


def find_obj(uid, model):
    found = session.execute(select(model).where(model.uid == uid)).first()
    if found:
        return found[0]
    return False


def create_nodes(
    session: Session,
    fname: str,
    person_class: Person_1_mil ,
):
    with open(fname, "r") as f:
        k = 0
        reader = csv.reader(f)
        headers = next(reader)
        for row in reader:
            data = {headers[i]: row[i] for i in range(len(row))}
            data["friends"] = []
            person = person_class(
                uid=int(data["uid"]), name=data["name"], age=int(data["age"])
            )
            session.add(person)
            if k % 10000 == 0:
                session.commit()
                print(f"processed {k}", end="\r")


if __name__ == "__main__":
    engine = create_engine(
        "postgresql+psycopg2://postgres:testtest@localhost:5432/neo4j"
    )

    # Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        print(f"Engine {engine} connected with session {session}.")

        create_nodes(session, "one_mil_nodes.csv", Person_1_mil)
        # create_nodes(session, "ten_mil.csv", Person_10_mil)
