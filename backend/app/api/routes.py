from fastapi import APIRouter, Query
from typing import Optional
from app.models.domain import PromotionResponse
from app.services.scraper import Scraper

router = APIRouter()
scraper = Scraper()

@router.get("/promotions", response_model=PromotionResponse)
async def get_promotions(
    page: int = 1, 
    limit: int = 10, 
    source: str = "reddit", 
    subreddit: Optional[str] = None,
    use_llm: bool = False
):
    result = await scraper.get_promotions(page=page, limit=limit, source=source, subreddit=subreddit, use_llm=use_llm)
    
    return {
        "promotions": result["promotions"],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "has_more": result["has_more"]
    }
