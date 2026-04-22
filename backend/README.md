# Takhaial Backend

FastAPI service powering the Takhaial site. Endpoints are contract-stable so a
proprietary LLM can be dropped into `/chat` later.

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive OpenAPI UI.

## Endpoints

| Method | Path       | Purpose                                            |
| ------ | ---------- | -------------------------------------------------- |
| GET    | `/`        | Service banner                                     |
| GET    | `/health`  | Liveness                                           |
| POST   | `/chat`    | AI chat (1s simulated delay, canned reply)         |
| POST   | `/contact` | Lead capture (returns a `reference_id`)            |

CORS is open for `http://localhost:3000` — extend in `main.py` for staging/prod.
