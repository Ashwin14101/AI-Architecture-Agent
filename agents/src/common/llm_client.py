# agents/src/common/llm_client.py

import os
from openai import OpenAI, RateLimitError
from dotenv import load_dotenv

load_dotenv()

class LlmClient:
    def __init__(self):
        # 1. Determine active provider
        self.provider = os.getenv("LLM_PROVIDER", "groq").lower()
        self._load_provider_config()
        self.current_key_index = 0
        self._init_client()

    def _load_provider_config(self):
        """Loads URL, Model, and Keys list based on selected provider."""
        if self.provider == "gemini":
            self.base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai")
            self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            keys = os.getenv("GEMINI_API_KEYS")
        else: # default is groq
            self.base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
            self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            keys = os.getenv("GROQ_API_KEYS")

        if keys:
            self.api_keys = [key.strip() for key in keys.split(',') if key.strip()]
        else:
            self.api_keys = []

        if not self.api_keys:
            raise ValueError(f"No API Keys found for provider '{self.provider}'. Set {self.provider.upper()}_API_KEYS.")

    def _init_client(self):
        current_key = self.api_keys[self.current_key_index]
        masked_key = f"{current_key[:6]}...{current_key[-4:]}" if len(current_key) > 10 else "invalid_key"

        print(f"[LlmClient] Activating Provider: {self.provider.upper()}")
        print(f"[LlmClient] Endpoint: {self.base_url}")
        print(f"[LlmClient] Key Index: {self.current_key_index} ({masked_key})")
        print(f"[LlmClient] Model: {self.model}")

        self.client = OpenAI(
            api_key=current_key,
            base_url=self.base_url
        )
        
    def _rotate_key(self) -> bool:
        """Rotates to next key for current provider."""
        if len(self.api_keys) <= 1:
            return False
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        self._init_client()
        return True

    def _switch_provider_fallback(self) -> bool:
        """Attempts to switch to alternative provider if active one is rate-limited."""
        new_provider = "gemini" if self.provider == "groq" else "groq"
        print(f"[LlmClient] WARNING: Exhausted keys for {self.provider.upper()}. Attempting fallback to {new_provider.upper()}...")
        try:
            self.provider = new_provider
            self._load_provider_config()
            self.current_key_index = 0
            self._init_client()
            return True
        except Exception as e:
            print(f"[LlmClient] Fallback to {new_provider.upper()} failed: {str(e)}")
            return False

    def call_with_meta(self, system_prompt: str, user_prompt: str, json_mode: bool = False, temperature: float = 0.2):
        """
        Runs completions and returns tuple: (content_str, usage_dict, model_name).
        """
        while True:
            try:
                response_format = {"type": "json_object"} if json_mode else None
                completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    response_format=response_format
                )
                content = completion.choices[0].message.content or ""
                prompt_tokens = getattr(completion.usage, "prompt_tokens", 0) if completion.usage else 0
                completion_tokens = getattr(completion.usage, "completion_tokens", 0) if completion.usage else 0
                usage = {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens
                }
                return content, usage, self.model

            except RateLimitError as e:
                print(f"[LlmClient] Rate Limit hit on {self.provider.upper()} key {self.current_key_index}")
                if self._rotate_key():
                    continue
                if self._switch_provider_fallback():
                    continue
                raise e
            except Exception as e:
                print(f"[LlmClient] Exception: {str(e)}")
                raise e

    def call(self, system_prompt: str, user_prompt: str, json_mode: bool = False, temperature: float = 0.2) -> str:
        """
        Runs completions. If rate limit hits, rotates keys. 
        If all keys rate-limit, attempts fallback to the other provider.
        """
        content, _, _ = self.call_with_meta(system_prompt, user_prompt, json_mode, temperature)
        return content
