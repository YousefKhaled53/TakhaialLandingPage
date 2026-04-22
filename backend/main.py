"""Takhaial backend API.

FastAPI application exposing:
    - POST /chat     -> mock AI response (placeholder for proprietary LLM logic).
    - POST /contact  -> lead generation form capture.

Run locally:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("takhaial")

app = FastAPI(
    title="Takhaial API",
    description="Deep-tech API fusing Spatial Computing and Artificial Intelligence.",
    version="0.1.0",
)

# CORS: permit the Next.js dev server on :3000. Extend origins for staging/prod as needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = Field(default=None, max_length=128)


class ChatResponse(BaseModel):
    reply: str
    session_id: Optional[str] = None
    timestamp: str


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=160)
    message: str = Field(..., min_length=1, max_length=4000)


class ContactResponse(BaseModel):
    ok: bool
    reference_id: str
    received_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "Takhaial API",
        "status": "online",
        "tagline": "Visionary Intelligence.",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


# Canned responses. The endpoint signature is stable so a proprietary LLM
# can be dropped in later without breaking the frontend contract.
_MOCK_REPLIES = [
    (
        "Takhaial fuses Spatial Computing and Artificial Intelligence to build "
        "immersive interfaces between humans and machines. Our stack spans "
        "volumetric capture, real-time neural rendering, and multi-modal agents."
    ),
    (
        "We design and ship eight flagship products — Lucid, Vivid, Bayan, Closr, "
        "Aicon, Aegis, 360-VR Cinematography, and Combining Realities — each "
        "purpose-built for a pillar of the spatial web."
    ),
    (
        "Our mission is to make intelligence feel tangible. From XR headsets to "
        "agentic copilots, we craft systems that see, listen, reason, and respond "
        "inside three-dimensional space."
    ),
    (
        "Tell me which vertical you care about — retail, healthcare, defense, "
        "education, media — and I will outline the Takhaial deployment blueprint."
    ),
]


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    logger.info("chat.request | session=%s | len=%d", payload.session_id, len(payload.message))

    # Simulated inference latency. Replace with real LLM call later.
    await asyncio.sleep(1.0)

    reply = random.choice(_MOCK_REPLIES)
    return ChatResponse(
        reply=reply,
        session_id=payload.session_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/contact", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def contact(payload: ContactRequest) -> ContactResponse:
    if "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    reference_id = f"TKH-{int(datetime.now(timezone.utc).timestamp())}-{random.randint(1000, 9999)}"
    logger.info(
        "contact.lead | ref=%s | email=%s | company=%s",
        reference_id,
        payload.email,
        payload.company,
    )

    # A production build would persist this to a CRM / database here.
    return ContactResponse(
        ok=True,
        reference_id=reference_id,
        received_at=datetime.now(timezone.utc).isoformat(),
    )
