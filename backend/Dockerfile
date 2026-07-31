ARG PYTHON_VERSION=3.13-slim

FROM python:${PYTHON_VERSION}

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install psycopg2 dependencies.
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /code

WORKDIR /code

COPY requirements.txt /tmp/requirements.txt
RUN set -ex && \
    pip install --upgrade pip && \
    pip install -r /tmp/requirements.txt && \
    rm -rf /root/.cache/
COPY . /code

ENV DJANGO_SETTINGS_MODULE="config.settings"
# Build-only SECRET_KEY so `collectstatic` can run inside the image. This is
# ALWAYS overridden at runtime by docker-compose.yml (or your orchestrator of
# choice). Never use this default for actual deployment.
ENV SECRET_KEY="build-time-only-not-a-real-secret-you-must-override-this-in-production"
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["daphne","-b","0.0.0.0","-p","8000","config.asgi:application"]