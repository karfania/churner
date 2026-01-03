from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class OfferType(str, Enum):
    CHECKING = "Checking"
    SAVINGS = "Savings"
    CREDIT_CARD = "Credit Card"

class Promotion(BaseModel):
    id: str
    bank_name: str
    offer_type: OfferType
    bonus_amount: float
    currency: str = "$"
    description: str
    promotion_url: str
    
    # Scoring factors
    min_deposit: float
    min_balance: float
    monthly_fees: float
    direct_deposit_required: bool
    direct_deposit_amount: float
    holding_period_days: int
    
    # Calculated fields
    score: Optional[float] = None
    score_breakdown: Optional[str] = None
    
    # Source info
    source: str = "reddit" # reddit, bankrate, google
    subreddit: Optional[str] = None
    created_at: Optional[str] = None # ISO format date string

class PromotionResponse(BaseModel):
    promotions: List[Promotion]
    total: int
    page: int
    limit: int
    has_more: bool
