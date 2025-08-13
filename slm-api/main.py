import os
from typing import List, Optional
import json
import re
from fastapi import FastAPI, HTTPException, Request, Header, status
from pydantic import BaseModel
from dotenv import load_dotenv
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load environment variables
load_dotenv()

API_KEY = os.getenv("API_KEY", "changeme")
MODEL_NAME = os.getenv("MODEL_NAME", "Qwen/Qwen1.5-1.8B")  # Default to Qwen, can be changed to THUDM/chatglm2-6b

# Device selection
device = "cuda" if torch.cuda.is_available() else "cpu"
use_half = device == "cuda"

# Model and tokenizer loading
print(f"Loading model: {MODEL_NAME} on {device} (half precision: {use_half})")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
if use_half:
    model = model.half()
model = model.to(device)
model.eval()

# FastAPI app

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SLM API", description="Chat API for Chinese SLMs", version="1.0")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    history: Optional[List[List[str]]] = None  # [[user, bot], ...]

class ChatResponse(BaseModel):
    response: str
    history: Optional[List[List[str]]] = None

# Simple API key security
def check_api_key(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header.")
    token = authorization.split(" ", 1)[1]
    if token != API_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid API key.")

SYSTEM_PROMPT = """
You are an impartial content moderator. Evaluate ONE user comment and decide if it violates policy.

Flag content when it:
- Attacks, dehumanizes, or targets a protected class (e.g., immigrants, race, ethnicity, nationality, religion, gender identity, sexual orientation, disability)
- Advocates exclusion or expulsion toward a protected class (e.g., "kick them out", "deport them", "ban immigrants", "they should be kicked out")
- Uses slurs or hateful/harassing language.

Allowed: political/policy critique that does not target a protected class.

Output exactly one word and nothing else:
- "flagged" if it violates the policy
- "okay" if it does not

Examples (User → Assistant):
User: Immigrants are vermin and should be kicked out. → flagged
User: Immigrants are bad and should be kicked out. → flagged
User: We need to invest more in housing policy. → okay
User: Deport all immigrants now. → flagged
User: I disagree with current immigration policy costs. → okay
User: Refugees are parasites. → flagged
"""

def apply_guardrails(prompt: str, model_text: str) -> str:
    """Normalize model output to one of: "flagged" | "okay". Do not fake classification.

    We trust the model's explicit answer. If the model fails to produce one of the two tokens,
    default to "okay".
    """
    mt = (model_text or "").strip().lower()
    if "flagged" in mt:
        return "flagged"
    if "okay" in mt:
        return "okay"
    return "okay"

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    check_api_key(authorization)
    prompt = request.prompt
    history = request.history or []

    # Model-specific chat logic
    if "chatglm" in MODEL_NAME.lower():
        # ChatGLM2-6B style
        # Prepend system prompt to history if not present
        glm_history = history.copy() if history else []
        if not glm_history or glm_history[0][0] != SYSTEM_PROMPT:
            glm_history = [[SYSTEM_PROMPT, ""]] + glm_history
        response, new_history = model.chat(tokenizer, prompt, history=glm_history, return_history=True)
        response = apply_guardrails(prompt, response)
    else:
        # Qwen1.5-1.8B or similar: ask for a single-word decision
        full_prompt = f"System: {SYSTEM_PROMPT}\nUser: {prompt}\nAssistant:"
        inputs = tokenizer(full_prompt, return_tensors="pt", padding=True)
        input_ids = inputs["input_ids"].to(device)
        attention_mask = inputs["attention_mask"].to(device)
        pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id
        with torch.no_grad():
            output = model.generate(
                input_ids,
                attention_mask=attention_mask,
                max_new_tokens=4,
                do_sample=False,
                eos_token_id=tokenizer.eos_token_id,
                pad_token_id=pad_token_id
            )
        raw = tokenizer.decode(output[0][input_ids.shape[-1]:], skip_special_tokens=True)
        response = apply_guardrails(prompt, raw)
        new_history = history + [[prompt, response]]

    return ChatResponse(response=response.strip(), history=new_history)
