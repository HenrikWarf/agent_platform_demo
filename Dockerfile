# ADK Agent Runtime Container
# This Dockerfile is used by `agents-cli deploy` for Agent Runtime deployment.
# Agent Engine builds the container image from this file.
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ app/
COPY fast_api_app.py .
COPY skills/ skills/

ENV PYTHONPATH=/app
ENV PORT=8080

EXPOSE 8080

CMD ["uvicorn", "fast_api_app:app", "--host", "0.0.0.0", "--port", "8080"]
