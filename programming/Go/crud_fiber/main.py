from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import databases
import sqlalchemy

# Database configuration
DATABASE_URL = "postgresql://postgres:postgres@localhost/main"

database = databases.Database(DATABASE_URL)
metadata = sqlalchemy.MetaData()

# Notes table definition
notes = sqlalchemy.Table(
    "Note",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("title", sqlalchemy.String, nullable=False),
    sqlalchemy.Column("content", sqlalchemy.Text, nullable=False),
)

engine = sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)

# Models
class NoteBase(BaseModel):
    title: str
    content: str

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int

    class Config:
        orm_mode = True

# App initialization
app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "ok"}

@app.get("/api/v1/notes", response_model=List[Note], tags=["Notes"])
async def get_all_notes():
    query = notes.select()
    return await database.fetch_all(query)

@app.get("/api/v1/notes/{note_id}", response_model=Note, tags=["Notes"])
async def get_note(note_id: int):
    query = notes.select().where(notes.c.id == note_id)
    note = await database.fetch_one(query)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@app.post("/api/v1/notes", response_model=Note, tags=["Notes"])
async def create_note(note: NoteCreate):
    query = notes.insert().values(title=note.title, content=note.content)
    last_record_id = await database.execute(query)
    return {**note.dict(), "id": last_record_id}

@app.put("/api/v1/notes/{note_id}", response_model=Note, tags=["Notes"])
async def update_note(note_id: int, note: NoteCreate):
    query = notes.update().where(notes.c.id == note_id).values(title=note.title, content=note.content)
    await database.execute(query)
    return {**note.dict(), "id": note_id}

@app.delete("/api/v1/notes/{note_id}", tags=["Notes"])
async def delete_note(note_id: int):
    query = notes.delete().where(notes.c.id == note_id)
    result = await database.execute(query)
    if not result:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}