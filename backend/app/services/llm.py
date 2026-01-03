import json
import httpx
from app.core.config import settings

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.api_key = settings.OLLAMA_API_KEY

    async def extract_promotion_data(self, raw_text: str, url: str) -> dict:
        prompt = f"""
        You are a data extraction assistant. Extract bank promotion details from the following text into a JSON object.
        
        Text:
        {raw_text}
        
        URL: {url}

        Return ONLY a valid JSON object with the following fields:
        - bank_name (string): Name of the bank. If unknown, use "Unknown Bank".
        - offer_type (string): One of "Checking", "Savings", "Credit Card". Default to "Checking".
        - bonus_amount (number): The cash value of the bonus. If points, convert to estimated cash value (e.g. 1 cent per point).
        - description (string): A short summary of the deal (max 200 chars).
        - min_deposit (number): Minimum deposit required to get the bonus. 0 if none.
        - min_balance (number): Minimum balance to maintain. 0 if none.
        - monthly_fees (number): Monthly maintenance fee. 0 if none.
        - direct_deposit_required (boolean): true if direct deposit is required.
        - direct_deposit_amount (number): Amount of direct deposit required. 0 if none.
        - holding_period_days (number): Days funds must be held. 0 if not specified.
        
        If a value is not found, use 0 for numbers, "" for strings, and false for booleans.
        Do not include any markdown formatting or explanations. Just the JSON.
        """

        async with httpx.AsyncClient() as client:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            try:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    headers=headers,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    },
                    timeout=60.0 # Increased timeout for LLM
                )
                response.raise_for_status()
                result = response.json()
                return json.loads(result["response"])
            except Exception as e:
                print(f"Ollama extraction failed: {e}")
                return None
