FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY backend/ /app
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN mkdir -p /app/staticfiles /app/media /app/logs
EXPOSE 8000
CMD ["gunicorn", "kenya_ecom.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
