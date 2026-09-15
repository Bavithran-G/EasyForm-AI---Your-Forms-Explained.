"""EasyForm AI — API + static frontend.

Run:  uvicorn app:app --reload --port 8000   (or:  python app.py)
"""
from __future__ import annotations

import logging
import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles

load_dotenv()

from backend.ingestion import IngestionError, render_page_png  # noqa: E402
from backend.pipeline import FormSession  # noqa: E402

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("easyform")

ROOT = Path(__file__).parent
app = FastAPI(title="EasyForm AI", version="0.1")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in os.getenv("EASYFORM_CORS_ORIGINS", "*").split(",") if x.strip()], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
SESSIONS: Dict[str, FormSession] = {}
UPLOAD_DIR = Path(tempfile.mkdtemp(prefix="easyform_"))   # temporary, wiped on restart
MAX_MB = int(os.getenv("EASYFORM_MAX_MB", "25"))


def _save(upload: UploadFile) -> str:
    if not upload.filename or not upload.filename.lower().endswith(".pdf"):
        raise HTTPException(400, f"'{upload.filename}' is not a PDF.")
    dest = UPLOAD_DIR / f"{uuid.uuid4().hex}.pdf"
    with dest.open("wb") as f:
        shutil.copyfileobj(upload.file, f)
    if dest.stat().st_size == 0:
        dest.unlink(); raise HTTPException(400, f"'{upload.filename}' is empty.")
    if dest.stat().st_size > MAX_MB * 1024 * 1024:
        dest.unlink(); raise HTTPException(400, f"'{upload.filename}' exceeds {MAX_MB} MB.")
    return str(dest)


def _session(sid: str) -> FormSession:
    s = SESSIONS.get(sid)
    if not s:
        raise HTTPException(404, "Unknown or expired session. Please re-upload the form.")
    return s


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    log.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": f"Something went wrong ({type(exc).__name__}). Please try again."})


# ------------------------------------------------------------------------- API
@app.post("/api/analyze")
async def analyze(form: UploadFile = File(...), instructions: Optional[UploadFile] = File(None)):
    form_path = _save(form)
    instr_path = _save(instructions) if instructions and instructions.filename else None
    try:
        session = FormSession(form_path, form.filename, instr_path, instructions.filename if instr_path else None)
    except IngestionError as e:
        raise HTTPException(422, f"The government form could not be processed: {e}")
    sid = uuid.uuid4().hex[:12]
    SESSIONS[sid] = session
    st = session.status()
    st["sid"] = sid
    return st


@app.get("/api/session/{sid}")
def session_status(sid: str):
    st = _session(sid).status(); st["sid"] = sid
    return st


@app.get("/api/session/{sid}/page/{doc}/{page}.png")
def page_png(sid: str, doc: str, page: int, zoom: float = 2.0):
    s = _session(sid)
    d = s.form if doc == "form" else s.instructions
    if d is None or page < 1 or page > len(d.pages):
        raise HTTPException(404, "Page not found")
    zoom = max(1.0, min(zoom, 3.0))
    return Response(render_page_png(d.path, page, zoom), media_type="image/png",
                    headers={"Cache-Control": "private, max-age=3600"})


@app.post("/api/session/{sid}/explain")
async def explain(sid: str, request: Request):
    body = await request.json()
    s = _session(sid)
    fid = body.get("field_id", "")
    try:
        s.field(fid)
    except KeyError:
        raise HTTPException(404, f"Unknown field {fid}")
    resp = s.explain(fid, baseline=bool(body.get("baseline", False)), use_cache=not body.get("nocache", False))
    return resp.model_dump()


@app.post("/api/session/{sid}/followup")
async def followup(sid: str, request: Request):
    body = await request.json()
    s = _session(sid)
    q = (body.get("question") or "").strip()
    if not q:
        raise HTTPException(400, "Question is empty.")
    if len(q) > 500:
        raise HTTPException(400, "Question is too long.")
    try:
        s.field(body.get("field_id", ""))
    except KeyError:
        raise HTTPException(404, "Unknown field")
    return s.followup(body["field_id"], q).model_dump()


@app.get("/api/session/{sid}/overview")
def overview(sid: str):
    return {"fields": _session(sid).overview()}


@app.get("/api/health")
def health():
    from backend.pipeline import Models
    return {"ok": True, "llm_available": Models.explainer().available, "model": Models.explainer().model,
            "sessions": len(SESSIONS)}


# ------------------------------------------------------------------------- frontend
FRONTEND = ROOT / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")
if (FRONTEND / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND / "assets")), name="assets")


@app.get("/")
def index():
    return FileResponse(str(FRONTEND / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "8000")), reload=False)
