import asyncio
import logging
from typing import Optional

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.config import Settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._openai_client: Optional[AsyncOpenAI] = None
        self._anthropic_client: Optional[AsyncAnthropic] = None

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
                logger.warning(
                    "LLM 调用失败 (第 %d/%d 次尝试): %s", attempt, max_retries, e
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
