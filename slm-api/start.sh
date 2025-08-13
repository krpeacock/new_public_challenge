#!/bin/bash
set -e

# Activate venv if exists
test -d venv && source venv/bin/activate

# Export API_KEY from .env if exists
if [ -f .env ]; then
  export $(grep API_KEY .env | xargs)
fi

# Start the FastAPI server
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
