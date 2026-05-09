"""P0-13: LLMService.validate_config() + retry 不可重试错误识别 单元测试。"""

import pytest

from app.config import Settings
from app.services.llm_service import LLMService, _is_retryable


# ---------- validate_config ----------

def test_validate_config_raises_when_openai_key_missing():
    settings = Settings(openai_api_key="", llm_provider="openai")
    service = LLMService(settings)
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        service.validate_config()


def test_validate_config_passes_when_openai_key_set():
    settings = Settings(openai_api_key="sk-test-fake", llm_provider="openai")
    service = LLMService(settings)
    # 不应抛
    service.validate_config()


def test_validate_config_raises_when_anthropic_key_missing():
    settings = Settings(
        openai_api_key="sk-ignored",
        anthropic_api_key="",
        llm_provider="anthropic",
    )
    service = LLMService(settings)
    with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
        service.validate_config()


def test_validate_config_passes_when_anthropic_key_set():
    settings = Settings(
        anthropic_api_key="ant-test-fake",
        llm_provider="anthropic",
    )
    service = LLMService(settings)
    service.validate_config()


def test_validate_config_provider_case_insensitive():
    """LLM_PROVIDER=ANTHROPIC（大小写不敏感）应走 anthropic 分支。"""
    settings = Settings(
        anthropic_api_key="",
        openai_api_key="sk-irrelevant",
        llm_provider="ANTHROPIC",
    )
    service = LLMService(settings)
    with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
        service.validate_config()


# ---------- _is_retryable ----------

def test_is_retryable_returns_false_for_value_error():
    assert _is_retryable(ValueError("missing key")) is False


def test_is_retryable_returns_true_for_generic_exception():
    """RuntimeError、network glitch 等应可重试。"""
    assert _is_retryable(RuntimeError("network glitch")) is True
    assert _is_retryable(TimeoutError("timeout")) is True


def test_is_retryable_returns_false_for_openai_auth_error():
    """OpenAI AuthenticationError 是 401，重试无用，应判为不可重试。"""
    from openai import AuthenticationError as OpenAIAuthError

    # AuthenticationError 真实构造需要 response，这里用子类 + 跳过 __init__
    class _FakeAuth(OpenAIAuthError):
        def __init__(self):
            pass

    assert _is_retryable(_FakeAuth()) is False


def test_is_retryable_returns_false_for_openai_bad_request():
    from openai import BadRequestError as OpenAIBadRequest

    class _FakeBad(OpenAIBadRequest):
        def __init__(self):
            pass

    assert _is_retryable(_FakeBad()) is False


def test_is_retryable_returns_false_for_anthropic_auth_error():
    from anthropic import AuthenticationError as AnthropicAuthError

    class _FakeAuth(AnthropicAuthError):
        def __init__(self):
            pass

    assert _is_retryable(_FakeAuth()) is False
