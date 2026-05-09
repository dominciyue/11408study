from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "11408 AI Service"
    debug: bool = True

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-3.5-turbo"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-haiku-20240307"

    llm_provider: str = "openai"

    # 启动时若 LLM key 缺失，是否放行（仅记录 warn，不阻断）。
    # 默认 true：本地开发友好（可不配 key 跑非 AI 功能）。
    # 生产部署应在 .env 设 ALLOW_MISSING_LLM_KEY=false，让缺 key 直接启动失败。
    allow_missing_llm_key: bool = True

    database_url: str = "postgresql://study11408:study11408_dev@localhost:5432/study11408"

    java_backend_url: str = "http://localhost:8080"

    class Config:
        env_file = ".env"


settings = Settings()
