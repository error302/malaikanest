ARG PYTHON_VERSION=3.13-slim

FROM node:22-bookworm-slim AS assets
WORKDIR /build/adminapp
COPY adminapp/package.json adminapp/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY adminapp/ ./
COPY templates/ /build/templates/
COPY apps/storefront/ /build/apps/storefront/
RUN npm run build

FROM python:${PYTHON_VERSION}

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

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
COPY --from=assets /build/static/adminapp /code/static/adminapp
COPY --from=assets /build/static/css/storefront.css /code/static/css/storefront.css

ENV DJANGO_SETTINGS_MODULE="config.settings"
# This placeholder exists only in the build command, never in the runtime environment.
RUN SECRET_KEY="build-time-only-static-assets" python manage.py collectstatic --noinput

EXPOSE 8000

ENTRYPOINT ["sh", "/code/deploy/start-web.sh"]

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--timeout", "60"]