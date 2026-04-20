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

    database_url: str = "postgresql://study11408:study11408_dev@localhost:5432/study11408"

    java_backend_url: str = "http://localhost:8080"

    class Config:
        env_file = ".env"


settings = Settings()
