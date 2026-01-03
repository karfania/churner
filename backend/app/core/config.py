import os

class Settings:
    DB_NAME = "churner.db"
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama.com")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemini-3-flash-preview") 
    OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")

settings = Settings()
