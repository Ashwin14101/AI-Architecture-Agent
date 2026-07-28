import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "3001"))
    DB_PATH: str = os.getenv("DB_PATH", "./data/arch_agent.sqlite")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey123")
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRY_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRY_DAYS", "7"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    def __init__(self):
        # Validate critical security configurations on startup
        if self.JWT_SECRET == "supersecretkey123":
            print("\n" + "="*80)
            print(" SECURITY WARNING: 'JWT_SECRET' is set to default 'supersecretkey123'!")
            print(" Please configure a strong custom key in your '.env' file in production.")
            print("="*80 + "\n")

    @property
    def get_db_url(self) -> str:
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("sqlite://"):
                url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
            return url
        
        abs_db_path = os.path.abspath(self.DB_PATH)
        db_dir = os.path.dirname(abs_db_path)
        os.makedirs(db_dir, exist_ok=True)
        return f"sqlite+aiosqlite:///{abs_db_path}"

settings = Settings()
