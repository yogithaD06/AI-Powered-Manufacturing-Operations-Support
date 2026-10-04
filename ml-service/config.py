"""Paths and constants shared by training and serving."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
DB_PATH = BASE_DIR / "ml_store.db"  # SQLite: human feedback + accepted assignments

TICKETS_CSV = DATA_DIR / "tickets.csv"
USERS_CSV = DATA_DIR / "users.csv"
MACHINES_CSV = DATA_DIR / "machines.csv"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

CATEGORIES = ["Mechanical", "Electrical", "Quality", "Safety", "Process", "Automation"]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
ROOT_CAUSE_CATEGORIES = ["Man", "Machine", "Method", "Material", "Measurement", "Environment"]

FRONTEND_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
