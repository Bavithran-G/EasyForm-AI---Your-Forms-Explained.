# EasyForm AI Integration Handoff

The existing EasyForm frontend and EasyForm AI backend are now connected without replacing the frontend visual design. Demo mode remains local and continues to use the existing mock form data. Live mode uploads the required government form PDF and optional official-instructions PDF to the real backend.

## API contract used

| Purpose | Method | Endpoint |
|---|---:|---|
| Health | GET | `/api/health` |
| Analyze required form and optional instructions | POST multipart | `/api/analyze` with `form` and optional `instructions` |
| Session metadata and detected fields | GET | `/api/session/{sid}` |
| Render a real form page | GET | `/api/session/{sid}/page/form/{page}.png?zoom=2` |
| Grounded field explanation | POST JSON | `/api/session/{sid}/explain` with `{ "field_id": "..." }` |
| Optional follow-up | POST JSON | `/api/session/{sid}/followup` |
| Field overview | GET | `/api/session/{sid}/overview` |

The frontend normalizes backend fields into the existing `FormField` type. Backend PDF-point bounding boxes are converted to page-relative percentages using the returned page width and height, so overlays stay aligned during zoom, resize, scrolling, and page navigation.

## What changed

The frontend gained `src/lib/easyformApi.ts`, which owns the live API contract, response normalization, page URLs, and explanation mapping. The existing document interaction hook now accepts either the original demo document or a live document and requests an explanation on field selection. The existing viewer and guide/popup layout were preserved; live mode supplies backend-rendered PNG pages and detected-field overlays while demo mode continues to render the original mock form.

The upload modal now requires a PDF government form and allows an optional instructions PDF. The workspace sends real uploads to `/api/analyze`, shows backend processing errors, and keeps demo presets separate. The backend now enables configurable CORS, binds to `HOST`/`PORT`, and serves the built Vite `/assets` directory so one FastAPI process can serve the integrated application.

## Environment

Frontend `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Leave `VITE_API_URL` empty when the frontend is served by the same backend origin or is reverse-proxied to it.

Backend `.env`:

```env
HOST=0.0.0.0
PORT=8000
EASYFORM_CORS_ORIGINS=http://localhost:5173
EASYFORM_MAX_MB=25
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

The backend already supports grounded retrieval, reranking, LLM explanation, verification, and abstention. If the LLM is unavailable or returns an unusable result, the backend still returns the safe grounded fallback/abstention behavior rather than requiring frontend mocks.

## Run

Backend:

```bash
cd backend/easyform-ai
python3 -m pip install -r requirements.txt
cp .env.example .env
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Frontend development server:

```bash
cd frontend/easyform
npm install
cp .env.example .env
npm run dev
```

For the single-process demo, build the frontend and copy `frontend/easyform/dist` into `backend/easyform-ai/frontend`, then run FastAPI. The completed package already includes the built assets in that location.

## Verification performed

`npm run build` passes after repairing the supplied archive's missing Rollup optional Linux dependency. Backend modules compile successfully. The repeatable `smoke_test.py` verified health, form-only processing, valid PNG page rendering, detected fields, grounded explanation evidence, and form-plus-instructions mode. The observed W-9 smoke run returned 21 fields and 5 explanation evidence chunks for the first field.

## Remaining limitations

The current backend process stores sessions in memory and temporary upload files are cleared on restart, as intended for a hackathon demo. LLM availability depends on the configured backend model/proxy; retrieval and safe abstention remain available without it. The existing camera UI is retained visually, but the live backend contract accepts PDFs, so camera capture is not converted into a PDF in this integration.
