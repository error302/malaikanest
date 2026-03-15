import os
import json
import requests
from typing import Optional, Dict, Any, List


class OllamaClient:
    def __init__(self):
        self.api_key = os.getenv("OLLAMA_API_KEY")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama2")

        # Set up headers for authentication if API key is provided
        self.headers = {"Content-Type": "application/json"}
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"

    def _check_client(self):
        if not self.api_key:
            raise Exception(
                "Ollama API key not configured. Please set OLLAMA_API_KEY environment variable."
            )

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

        response = requests.post(
            f"{self.base_url}/api/chat", headers=self.headers, json=payload
        )
        response.raise_for_status()

        result = response.json()
        return result["message"]["content"]

    def chat_json(
        self,
        message: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1500,
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
            "format": "json",  # Ollama uses format parameter for JSON mode
        }

        response = requests.post(
            f"{self.base_url}/api/chat", headers=self.headers, json=payload
        )
        response.raise_for_status()

        result = response.json()
        content = result["message"]["content"]

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": content}

    def get_embedding(self, text: str) -> List[float]:
        self._check_client()

        payload = {"model": self.model, "prompt": text}

        response = requests.post(
            f"{self.base_url}/api/embeddings", headers=self.headers, json=payload
        )
        response.raise_for_status()

        result = response.json()
        return result["embedding"]

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
