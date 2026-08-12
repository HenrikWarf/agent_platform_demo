FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV PYTHONPATH=/app
ENV PORT=8080

EXPOSE 8080

CMD ["python", "backend/app.py"]
