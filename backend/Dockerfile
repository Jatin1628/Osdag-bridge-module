FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt /app/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy ONLY backend folder into /app
COPY backend /app

EXPOSE 8000

CMD python manage.py migrate && \
    python manage.py seed_locations && \
    gunicorn config.wsgi:application --bind 0.0.0.0:$PORT