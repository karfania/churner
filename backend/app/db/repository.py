from typing import List, Optional
from app.db.session import get_db_connection
from app.models.domain import Promotion

def save_promotions(promotions: List[Promotion]):
    conn = get_db_connection()
    try:
        # We only want to clear data for the specific source/subreddit we just scraped
        # Otherwise we lose data from other sources
        if not promotions:
            return

        source = promotions[0].source
        subreddit = promotions[0].subreddit
        
        if subreddit:
            conn.execute("DELETE FROM promotions WHERE source = ? AND subreddit = ?", (source, subreddit))
        else:
            conn.execute("DELETE FROM promotions WHERE source = ? AND subreddit IS NULL", (source,))
        
        for p in promotions:
            conn.execute('''
                INSERT INTO promotions (
                    id, bank_name, offer_type, bonus_amount, description, promotion_url,
                    min_deposit, min_balance, monthly_fees, direct_deposit_required,
                    direct_deposit_amount, holding_period_days, score, score_breakdown,
                    source, subreddit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                p.id, p.bank_name, p.offer_type.value, p.bonus_amount, p.description, p.promotion_url,
                p.min_deposit, p.min_balance, p.monthly_fees, p.direct_deposit_required,
                p.direct_deposit_amount, p.holding_period_days, p.score, p.score_breakdown,
                p.source, p.subreddit
            ))
        conn.commit()
    finally:
        conn.close()

def get_promotions_from_db(page: int = 1, limit: int = 10, source: str = "reddit", subreddit: Optional[str] = None):
    conn = get_db_connection()
    offset = (page - 1) * limit
    
    query_base = "FROM promotions WHERE source = ?"
    params = [source]
    
    if subreddit:
        query_base += " AND subreddit = ?"
        params.append(subreddit)
    else:
        if source != "reddit":
             query_base += " AND subreddit IS NULL"

    # Get total count
    total = conn.execute(f"SELECT COUNT(*) {query_base}", params).fetchone()[0]
    
    # Get paginated results, sorted by score
    rows = conn.execute(f'''
        SELECT * {query_base}
        ORDER BY score DESC
        LIMIT ? OFFSET ?
    ''', params + [limit, offset]).fetchall()
    
    promotions = []
    for row in rows:
        promotions.append(Promotion(
            id=row['id'],
            bank_name=row['bank_name'],
            offer_type=row['offer_type'],
            bonus_amount=row['bonus_amount'],
            description=row['description'],
            promotion_url=row['promotion_url'],
            min_deposit=row['min_deposit'],
            min_balance=row['min_balance'],
            monthly_fees=row['monthly_fees'],
            direct_deposit_required=bool(row['direct_deposit_required']),
            direct_deposit_amount=row['direct_deposit_amount'],
            holding_period_days=row['holding_period_days'],
            score=row['score'],
            score_breakdown=row['score_breakdown'],
            source=row['source'],
            subreddit=row['subreddit']
        ))
    
    conn.close()
    
    return {
        "promotions": promotions,
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": (offset + limit) < total
    }
