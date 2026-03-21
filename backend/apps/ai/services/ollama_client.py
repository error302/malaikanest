import os
import json
import logging
import requests
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)


class OllamaClient:
    def __init__(self):
        self.api_key = os.getenv("OLLAMA_API_KEY")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama2")

        self.headers = {"Content-Type": "application/json"}
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"

    def _check_client(self):
        if not self.api_key:
            logger.warning(
                "Ollama API key not set. Proceeding without authentication (local Ollama)."
            )

    def _make_request(self, endpoint: str, payload: Dict[str, Any], timeout: float = 180.0) -> Dict[str, Any]:
        try:
            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                json=payload,
                timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        except requests.ConnectionError:
            logger.warning(f"Ollama offline at {self.base_url} — returning empty response")
            return {}
        except requests.Timeout:
            logger.warning(f"Ollama request timed out at {self.base_url}")
            return {}
        except requests.RequestException as e:
            logger.error(f"Ollama request failed: {e}")
            return {}

    def chat(
        self,
        message: str,
        system_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        self._check_client()

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        result = self._make_request("/api/chat", payload)
        if not result:
            return ""
        
        return result.get("message", {}).get("content", "")

    def chat_json(
        self,
        message: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 500,
    ) -> Dict[str, Any]:
        self._check_client()

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
            "format": "json",
        }

        result = self._make_request("/api/chat", payload)
        if not result:
            return {"error": "AI service unavailable", "raw": ""}

        content = result.get("message", {}).get("content", "")

        try:
            return json.loads(content) if content else {}
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": content}

    def get_embedding(self, text: str) -> List[float]:
        self._check_client()

        payload = {"model": self.model, "prompt": text}

        result = self._make_request("/api/embeddings", payload)
        if not result:
            return []
        
        return result.get("embedding", [])

    def batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        self._check_client()

        embeddings = []
        for text in texts:
            embedding = self.get_embedding(text)
            embeddings.append(embedding)
        return embeddings


# Global instance
ollama_client = OllamaClient()
