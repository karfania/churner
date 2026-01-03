import sqlite3
from app.core.config import settings

def get_db_connection():
    conn = sqlite3.connect(settings.DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Drop table to ensure schema update (Dev only)
    conn.execute("DROP TABLE IF EXISTS promotions")
    conn.execute('''
        CREATE TABLE IF NOT EXISTS promotions (
            id TEXT PRIMARY KEY,
            bank_name TEXT,
            offer_type TEXT,
            bonus_amount REAL,
            description TEXT,
            promotion_url TEXT,
            min_deposit REAL,
            min_balance REAL,
            monthly_fees REAL,
            direct_deposit_required BOOLEAN,
            direct_deposit_amount REAL,
            holding_period_days INTEGER,
            score REAL,
            score_breakdown TEXT,
            source TEXT,
            subreddit TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
