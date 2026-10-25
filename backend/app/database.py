from sqlmodel import Session, SQLModel, create_engine

# Creates a local SQLite database file named sapi.db inside the backend folder
sqlite_file_name = "sapi.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# connect_args={"check_same_thread": False} is required for SQLite + FastAPI
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})


def create_db_and_tables():
    """Creates the Client and Invoice tables if they don't exist yet."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Provides a clean database session for each API request."""
    with Session(engine) as session:
        yield session