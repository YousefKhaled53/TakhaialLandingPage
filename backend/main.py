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
import os
import random
import re
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Optional

import aiosmtplib
import httpx
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("takhaial")

app = FastAPI(
    title="Takhaial API",
    description="Deep-tech API fusing Spatial Computing and Artificial Intelligence.",
    version="0.1.0",
)

# CORS: permit the Next.js dev server and production domains.
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://takhaial.com",
    "https://www.takhaial.com",
    "http://takhaial.com",
    "http://www.takhaial.com",
]
_env_origins = os.getenv("CORS_ORIGINS", "").split(",")
_origins = _default_origins + [o.strip() for o in _env_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET_KEY", "")
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "info@takhaial.com")


async def send_lead_email(ref: str, name: str, email: str, company: Optional[str], message: str) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("email.skipped — SMTP_USER or SMTP_PASSWORD not set")
        return
    try:
        msg = EmailMessage()
        msg["Subject"] = f"[Takhaial] New lead · {ref}"
        msg["From"] = SMTP_USER
        msg["To"] = NOTIFY_EMAIL
        msg.set_content(
            f"Reference : {ref}\n"
            f"Name      : {name}\n"
            f"Email     : {email}\n"
            f"Company   : {company or '—'}\n\n"
            f"Message\n-------\n{message}\n"
        )
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("email.sent | ref=%s → %s", ref, NOTIFY_EMAIL)
    except Exception as exc:
        logger.error("email.failed | ref=%s | %s", ref, exc)


async def verify_turnstile(token: str, ip: str) -> bool:
    """Returns True if the Turnstile token is valid. Skips check if no secret is configured."""
    if not TURNSTILE_SECRET:
        return True
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                TURNSTILE_VERIFY_URL,
                data={"secret": TURNSTILE_SECRET, "response": token, "remoteip": ip},
            )
            return resp.json().get("success", False)
    except Exception:
        logger.warning("turnstile.verify_failed — allowing through")
        return True


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


_HTML_TAG_RE = re.compile(r"<[^>]+>")
_NEWLINE_RE = re.compile(r"[\r\n]+")


def _clean(value: str) -> str:
    """Strip HTML tags, collapse newlines, and trim whitespace."""
    value = _HTML_TAG_RE.sub("", value)
    value = _NEWLINE_RE.sub(" ", value)
    return value.strip()


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=160)
    message: str = Field(..., min_length=10, max_length=4000)
    # Honeypot — must be empty; bots fill it, humans don't see it
    website: Optional[str] = Field(default=None, max_length=200)
    # Cloudflare Turnstile token
    cf_turnstile_token: Optional[str] = Field(default=None, max_length=2048)

    @field_validator("name", "message")
    @classmethod
    def must_not_be_blank(cls, v: str) -> str:
        cleaned = _clean(v)
        if not cleaned:
            raise ValueError("Field cannot be empty or whitespace.")
        return cleaned

    @field_validator("company", mode="before")
    @classmethod
    def clean_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = _clean(v)
        return cleaned if cleaned else None


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
async def contact(payload: ContactRequest, request: Request) -> ContactResponse:
    # Option 1 — Honeypot: reject silently if the hidden field was filled
    if payload.website:
        logger.warning("contact.honeypot_triggered | ip=%s", request.client.host if request.client else "unknown")
        raise HTTPException(status_code=400, detail="Invalid submission.")

    # Option 2 — Turnstile: verify the token
    token = payload.cf_turnstile_token or ""
    client_ip = request.headers.get("X-Real-IP") or (request.client.host if request.client else "")
    if not await verify_turnstile(token, client_ip):
        logger.warning("contact.turnstile_failed | ip=%s", client_ip)
        raise HTTPException(status_code=400, detail="Human verification failed. Please try again.")

    reference_id = f"TKH-{int(datetime.now(timezone.utc).timestamp())}-{random.randint(1000, 9999)}"
    logger.info(
        "contact.lead | ref=%s | email=%s | company=%s",
        reference_id,
        payload.email,
        payload.company,
    )

    await send_lead_email(reference_id, payload.name, payload.email, payload.company, payload.message)

    return ContactResponse(
        ok=True,
        reference_id=reference_id,
        received_at=datetime.now(timezone.utc).isoformat(),
    )
