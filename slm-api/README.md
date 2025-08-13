# slm-api

A FastAPI-based REST API for serving a Chinese small language model (SLM) using open-source models:
- THUDM/chatglm2-6b
- Qwen/Qwen1.5-1.8B

## Features
- POST /chat endpoint for chat-style interaction
- Supports conversation history
- GPU acceleration (with half precision if available)
- Basic API key security

## Quickstart

1. Create and activate a virtual environment:

   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:

   ```sh
   pip install -r requirements.txt
   ```

3. Download the model weights (first run will auto-download).

4. Start the API server:

   ```sh
   ./start.sh
   ```

5. Test the API:

   ```sh
   curl -X POST "http://localhost:8000/chat" -H "Authorization: Bearer <API_KEY>" -H "Content-Type: application/json" -d '{"prompt": "你好"}'
   ```

## Configuration
- Set your API key in the `API_KEY` environment variable or `.env` file.

## License
MIT
