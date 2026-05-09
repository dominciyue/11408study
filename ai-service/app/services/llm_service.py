import asyncio
import logging
from typing import Optional

from openai import AsyncOpenAI
from openai import (
    AuthenticationError as OpenAIAuthError,
    BadRequestError as OpenAIBadRequest,
    NotFoundError as OpenAINotFound,
    PermissionDeniedError as OpenAIPermissionDenied,
)
from anthropic import AsyncAnthropic
from anthropic import (
    AuthenticationError as AnthropicAuthError,
    BadRequestError as AnthropicBadRequest,
    NotFoundError as AnthropicNotFound,
    PermissionDeniedError as AnthropicPermissionDenied,
)

from app.config import Settings

logger = logging.getLogger(__name__)


# 不可重试的异常类型集合 —— 4xx 类业务错误，重试无意义。
_NON_RETRYABLE_EXC_TYPES = (
    ValueError,
    OpenAIAuthError,
    OpenAIBadRequest,
    OpenAINotFound,
    OpenAIPermissionDenied,
    AnthropicAuthError,
    AnthropicBadRequest,
    AnthropicNotFound,
    AnthropicPermissionDenied,
)


def _is_retryable(exc: BaseException) -> bool:
    """判断异常是否值得重试。

    不可重试：
      - ValueError（key 未配置等本地配置错误）
      - OpenAI/Anthropic 401/403/400/404（认证、参数、quota 类，重试无用）

    其他异常（5xx、网络抖动、超时）默认可重试。
    """
    return not isinstance(exc, _NON_RETRYABLE_EXC_TYPES)


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._openai_client: Optional[AsyncOpenAI] = None
        self._anthropic_client: Optional[AsyncAnthropic] = None

    def validate_config(self) -> None:
        """启动时调用：校验当前 provider 的 key 已配置。

        缺失则抛 ValueError，由 lifespan 决定是阻断启动还是仅 warn。
        """
        provider = (self.settings.llm_provider or "openai").lower()
        if provider == "anthropic":
            if not self.settings.anthropic_api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY 未配置；当前 LLM_PROVIDER=anthropic 必须设置。"
                    "请在 .env 或环境变量中设置 ANTHROPIC_API_KEY。"
                )
        else:
            if not self.settings.openai_api_key:
                raise ValueError(
                    "OPENAI_API_KEY 未配置；当前 LLM_PROVIDER=openai "
                    "(含 DeepSeek/Moonshot 等 OpenAI 兼容服务) 必须设置。"
                    "请在 .env 或环境变量中设置 OPENAI_API_KEY。"
                )

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai_client is None:
            if not self.settings.openai_api_key:
                raise ValueError(
                    "OpenAI API key 未配置。请在 .env 文件中设置 OPENAI_API_KEY。"
                )
            self._openai_client = AsyncOpenAI(
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url,
            )
        return self._openai_client

    @property
    def anthropic_client(self) -> AsyncAnthropic:
        if self._anthropic_client is None:
            if not self.settings.anthropic_api_key:
                raise ValueError(
                    "Anthropic API key 未配置。请在 .env 文件中设置 ANTHROPIC_API_KEY。"
                )
            self._anthropic_client = AsyncAnthropic(
                api_key=self.settings.anthropic_api_key,
            )
        return self._anthropic_client

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        max_retries = 3
        last_error: Optional[Exception] = None

        for attempt in range(1, max_retries + 1):
            try:
                if self.settings.llm_provider == "anthropic":
                    return await self._generate_anthropic(
                        prompt, system_prompt, temperature
                    )
                else:
                    return await self._generate_openai(
                        prompt, system_prompt, temperature
                    )
            except Exception as e:
                last_error = e
                if not _is_retryable(e):
                    logger.warning(
                        "LLM 调用遇到不可重试错误 (%s)，立即抛出: %s",
                        type(e).__name__,
                        e,
                    )
                    raise
                logger.warning(
                    "LLM 调用失败 (第 %d/%d 次尝试, 可重试): %s",
                    attempt,
                    max_retries,
                    e,
                )
                if attempt < max_retries:
                    await asyncio.sleep(2**attempt)

        raise RuntimeError(
            f"LLM 调用在 {max_retries} 次尝试后仍然失败: {last_error}"
        )

    async def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        logger.debug("调用 OpenAI 模型: %s", self.settings.openai_model)
        response = await self.openai_client.chat.completions.create(
            model=self.settings.openai_model,
            messages=messages,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        logger.debug("OpenAI 响应长度: %d", len(content) if content else 0)
        return content or ""

    async def _generate_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str],
        temperature: float,
    ) -> str:
        kwargs: dict = {
            "model": self.settings.anthropic_model,
            "max_tokens": 4096,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        logger.debug("调用 Anthropic 模型: %s", self.settings.anthropic_model)
        response = await self.anthropic_client.messages.create(**kwargs)
        content = response.content[0].text
        logger.debug("Anthropic 响应长度: %d", len(content) if content else 0)
        return content or ""
