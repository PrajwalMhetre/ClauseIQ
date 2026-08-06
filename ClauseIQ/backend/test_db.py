from sqlalchemy import create_engine

DATABASE_URL = "postgresql://clauseiq_user:password123@localhost:5432/clauseiq"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Database Connected Successfully!")