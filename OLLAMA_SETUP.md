# Ollama AI Services Setup on GCP

This guide walks through restoring AI features on your Malaika Nest deployment on Google Cloud Platform.

## Overview: Your Current Setup

- **Frontend**: Next.js 15 (hosted via Nginx or Vercel?)
- **Backend**: Django 5.1 (on GCP Compute Engine or Container)
- **Database**: PostgreSQL (Cloud SQL or self-hosted?)
- **AI Service**: Ollama (`llama3.1`, `nomic-embed-text`)
- **Domain**: `malaikanest.duckdns.org` pointing to GCP instance
- **Reverse Proxy**: Likely Nginx or GCP Load Balancer

---

## Step 1: SSH Into Your GCP Instance

```bash
gcloud compute ssh [INSTANCE_NAME] --zone=[ZONE]
```

Or use regular SSH if keys are set up.

---

## Step 2: Install Ollama on GCP VM

> Note: Ollama requires GPU support for fast inference, but CPU mode works fine too.

### Install Ollama:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

Start Ollama service:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

Check status:

```bash
systemctl status ollama
```

Pull required models:

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

Confirm availability:

```bash
curl http://localhost:11434/api/tags
```

Should return:

```json
{
  "models": [
    {"name": "llama3.1:latest"},
    {"name": "nomic-embed-text:latest"}
  ]
}
```

---

## Step 3: Update Environment Variables

Ensure `.env` file contains:

```env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.1
OLLAMA_EMBED_MODEL=nomic-embed-text
```

In Django settings (`config/settings.py`), confirm these are read:

```python
import os

OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.1")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
```

---

## Step 4: Restart Backend Services

### If using systemd (Gunicorn + systemd):

```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### If using Docker:

```bash
cd /path/to/malaika-nest/deployment
docker-compose down
docker-compose up -d --build
```

Wait until containers stabilize.

---

## Step 5: Test the AI Endpoints Remotely

From your local machine:

### Test Chat Endpoint:

```bash
curl -X POST https://malaikanest.duckdns.org/api/ai/chat/ \
-H "Content-Type: application/json" \
-d '{"prompt": "Generate a product description for a baby onesie made of organic cotton."}'
```

Expected response:

```json
{
  "response": "Our premium baby onesie crafted from 100% organic cotton offers softness and breathability for delicate skin..."
}
```

### Test Embedding Generation:

Endpoint: `/api/ai/embedding/`

```bash
curl -X POST https://malaikanest.duckdns.org/api/ai/embedding/ \
-H "Content-Type: application/json" \
-d '{"text": "Baby romper with snap buttons"}'
```

Should return vector array like:

```json
{
  "embedding": [0.123, -0.456, ..., 0.789]
}
```

---

## Security Considerations

Ensure `/api/ai/*` endpoints aren't publicly exposed without rate-limiting or auth:

Add middleware in Django:

```python
# apps/ai/middleware.py
from django.core.cache import cache
from django.http import HttpResponseForbidden

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = request.META.get('REMOTE_ADDR')
        key = f"rate_limit:{ip}"
        count = cache.get(key, 0)

        if count >= 10:  # max 10 requests per minute
            return HttpResponseForbidden("Too Many Requests")

        cache.set(key, count + 1, timeout=60)
        return self.get_response(request)
```

Apply globally or selectively to AI views.

---

## Troubleshooting Checklist

| Problem                                 | Solution |
|----------------------------------------|----------|
| Ollama not starting                   | Check logs: `journalctl -u ollama` |
| Connection refused to `localhost:11434` | Ensure no firewall blocking loopback |
| Slow responses                         | Add GPU acceleration or increase timeout |
| Model missing                          | Run `ollama pull llama3.1` again |
| CORS error (frontend)                 | Add `django-cors-headers` and configure origins |

---

## Optional: Auto-start Ollama on Boot

Enable and start Ollama service permanently:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## Final Verification Steps

1. Visit your site: https://malaikanest.duckdns.org
2. Try asking the AI chatbot a question.
3. Try auto-generating a product description.
4. Check network tab to ensure `/api/ai/chat/` returns valid JSON.
5. Monitor logs for any errors:

   ```bash
   journalctl -u gunicorn -f
   ```
