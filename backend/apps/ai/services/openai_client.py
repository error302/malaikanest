import os
import json
from typing import Optional, Dict, Any, List
from openai import OpenAI


class OpenAIClient:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            self.client = None
            self.model = os.getenv('OPENAI_MODEL', 'gpt-4o')
            return
        
        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o')
    
    def _check_client(self):
        if not self.client:
            raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    
    def chat(
        self,
        message: str,
        system_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        self._check_client()
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    
    def chat_json(
        self,
        message: str,
        system_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Dict[str, Any]:
        self._check_client()
        response = self.client.chat.completions.create(
            model=self.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON", "raw": content}
    
    def get_embedding(self, text: str) -> List[float]:
        self._check_client()
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    
    def batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        self._check_client()
        response = self.client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        return [item.embedding for item in response.data]


openai_client = OpenAIClient()
