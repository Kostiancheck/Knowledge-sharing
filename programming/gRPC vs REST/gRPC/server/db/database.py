import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine(os.environ["DATABASE_URL"])
session = sessionmaker(engine, expire_on_commit=False, class_=Session)

Base = declarative_base()
