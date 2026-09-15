# EasyForm AI

**Understand government forms in simple language, from the form itself.**

Upload a government form (PDF). Click any field. Get a plain-language explanation with a citation to the page and section it came from — grounded only in the documents you uploaded. If the form doesn't explain a field, EasyForm AI says so instead of guessing.

Built for the INTELLIX hackathon.

---

## The problem

Government forms are unreadable for ordinary citizens. A single line can chain three legal terms, two cross-references and a footnote. Someone helping their parent through a benefits form, or filing something for the first time in a second language, has to translate every field mentally — and when they get it wrong, the consequences are procedural, financial, or both.

Existing "AI helpers" for this problem either:

- **Hallucinate government-specific facts** (deadlines, fees, eligibility rules, exemption codes, penalties) that they invented from patterns in training data, or
- **Refuse to help** and point you at the same 40-page PDF that made you ask in the first place.

Both are worse than useless: the first is dangerous, the second is condescending.

## What EasyForm AI does

- Reads the exact PDF you uploaded, detects the fillable fields on the page (position, type, label, section).
- When you click a field, retrieves the most relevant passages from the form (and the instructions, if you uploaded them), and shows you an AI explanation that is **only** built from those passages.
- Every explanation carries the document name, page number and section it came from.
- If the retrieved passages don't cover the field, it **abstains** — it says it can't find guidance and doesn't want to guess.
- Every AI sentence is checked against the retrieved evidence. Unsupported sentences are removed; specific claims (numbers, form references, percentages) must appear in the evidence or they're dropped.
- The UI ships a "Compare with LLM-only" button that runs the same field through the raw LLM with no retrieval — so a demo audience can see, side by side, what grounding actually buys you.

The whole thing works with **just the form** (no instructions needed). Uploading the official instructions makes explanations stronger and reduces abstention.

---

## Architecture

```
                        ┌──────────────────────────────┐
   PDF upload   ───►    │  Ingestion                    │   PyMuPDF text + geometry
                        │  + OCR fallback (Tesseract)   │
                        └────────────┬─────────────────┘
                                     │
                    ┌────────────────┴─────────────────┐
                    ▼                                  ▼
   ┌──────────────────────────┐          ┌────────────────────────────┐
   │  Field detection          │          │  Section/subsection-aware  │
   │  AcroForm widgets + label │          │  paragraph chunker         │
   │  geometry, group merging  │          │  keeps page + section refs │
   │  layout fallback for      │          │  ("Line 3a", "Part I")     │
   │  scanned forms            │          └────────────┬───────────────┘
   └────────────┬──────────────┘                       │
                │                                       ▼
                │              ┌─────────────────────────────────────┐
                │              │ Hybrid retrieval                     │
                │              │  BM25 (rank_bm25) + dense (MiniLM/   │
                │              │  TF-IDF fallback), RRF fusion,       │
                │              │  field-reference boost               │
                │              └────────────────┬────────────────────┘
                │                                ▼
                │              ┌─────────────────────────────────────┐
                │              │ CrossEncoder rerank                  │
                │              │  ms-marco-MiniLM-L-6-v2              │
                │              │  (falls back to fused rank)          │
                │              └────────────────┬────────────────────┘
                │                                ▼
                │              ┌─────────────────────────────────────┐
                │              │ Evidence gate                        │
                │              │  IDF-weighted lexical overlap +      │
                │              │  reranker score + field-ref match    │
                │              │  → abstain BEFORE calling LLM        │
                │              └────────────────┬────────────────────┘
                │                                ▼
                │              ┌─────────────────────────────────────┐
                │              │ Grounded structured LLM              │
                │              │  gpt-4o-mini, JSON mode,             │
                │              │  temperature 0, evidence-only prompt │
                │              │  (no key ⇒ extractive fallback)      │
                │              └────────────────┬────────────────────┘
                │                                ▼
                │              ┌─────────────────────────────────────┐
                │              │ Sentence-level verifier              │
                │              │  overlap + fuzzy + embedding sim,    │
                │              │  numeric/reference token check,      │
                │              │  removes unsupported claims          │
                │              └────────────────┬────────────────────┘
                ▼                                ▼
         ┌───────────────────────────────────────────────┐
         │  FastAPI (/api/analyze, /explain, /followup)   │
         │  + single-file frontend (PDF viewer + overlays)│
         └───────────────────────────────────────────────┘
```

### Why each layer

- **AcroForm-first field detection with geometric label recovery.** Fillable PDFs (which most modern government forms are) contain the field positions and types natively. What they *don't* contain is human labels — those live in the page's text layout. We recover them from spatial rules (text right of a checkbox, left of an entry box, above as fallback), join wrapped label lines, detect checkbox groups from shared widget names, and merge segmented number boxes. On a scanned form we fall through to a layout heuristic + Tesseract OCR.
- **Section-aware chunking.** Every chunk carries its page, its section ("Line 3a"), its subsection ("Exempt payee code"), and — if the text mentions one — an explicit field reference. This is what makes citations trustworthy and enables the field-reference boost.
- **Hybrid retrieval.** BM25 catches exact matches on official terms ("Exempt payee code", "1446(f)"); dense embeddings catch paraphrase ("what to put here" vs "enter your"). Reciprocal-rank fusion combines them without needing tuned weights.
- **Field-reference boost.** If the field is "3a Check the appropriate box…", chunks whose section already says "Line 3a" jump the queue. This is where retrieval quality steps from OK to excellent.
- **CrossEncoder rerank.** A small cross-encoder resorts the top ~16 fused candidates by full query-document attention. The fallback (which the demo above used) is the fused RRF order, and results are still respectable.
- **Evidence gate.** Before spending a single LLM token, we ask: does this evidence set actually look like it explains the field? If the top-3 chunks don't contain the field's own content words *and* don't reference the same field number *and* the reranker isn't confident, we abstain — same friendly "I can't find enough" message either way.
- **Grounded structured LLM.** JSON mode + a system prompt that names the evidence as the only source of truth + Pydantic validation on return. Temperature 0. No evidence means no answer, not a fabricated one.
- **Sentence-level verifier.** Every sentence must survive a support check against the retrieved evidence — token overlap, fuzzy partial match, optional embedding similarity. Sentences containing numbers, form references or percentages must have those exact tokens in the evidence. Unsupported sentences are dropped, confidence and evidence status are downgraded to match.
- **Form-only mode.** Works end-to-end with just the form. If the user doesn't have the instructions, that's the common case, not an error condition.

### What's *not* here (deliberately)

- **No LangChain / LangGraph / LlamaIndex.** Plain Python orchestration in `backend/pipeline.py`. Every step is legible, testable, and about 50 lines. Nothing is behind a framework you have to grep to understand.
- **No agents, no loops, no tool-use.** The reasoning is a linear pipeline: retrieve → gate → generate → verify → return. This is a hackathon and clarity beats theatre.
- **No "form templates."** Nothing in this repo hardcodes the W-9. Every rule works from geometry and language patterns. The system will work on any fillable government PDF whose widgets have layout-derivable labels; scanned forms take the OCR + layout path.

---

## Repository layout

```
easyform-ai/
├── app.py                     FastAPI server + static frontend mount
├── requirements.txt
├── .env.example
├── backend/
│   ├── schemas.py             Pydantic contracts shared with the frontend
│   ├── ingestion.py           PyMuPDF text + geometry; OCR fallback
│   ├── field_detector.py      AcroForm labels from layout; group detection
│   ├── chunker.py             Section/subsection-aware paragraph chunker
│   ├── embeddings.py          MiniLM (primary) + TF-IDF (fallback), FAISS/numpy
│   ├── retriever.py           BM25 + vector + RRF + field-reference boost
│   ├── reranker.py            CrossEncoder with graceful fallback
│   ├── explainer.py           OpenAI structured prompt + Pydantic validation
│   ├── verifier.py            Sentence-level support + specific-claim check
│   └── pipeline.py            FormSession — orchestrates everything
├── frontend/
│   └── index.html             Single-file UI: PDF viewer, overlays, card, follow-ups
├── data/
│   ├── forms/w9.pdf                            IRS Form W-9 (Rev. March 2024)
│   └── instructions/w9_instructions.pdf        Official Requester Instructions
├── evaluation/
│   ├── benchmark.json         12 hand-labelled W-9 fields + 6 abstain / 3 follow-up Qs
│   └── evaluate.py            Real Recall@K / abstention accuracy / latency
└── indexes/                   Session-scoped (nothing to precompute)
```

---

## Installation

### 1. Python environment

Python 3.10 or later.

```bash
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The first run downloads two small models (~120 MB total: `sentence-transformers/all-MiniLM-L6-v2` and `cross-encoder/ms-marco-MiniLM-L-6-v2`). Both are cached under `~/.cache/huggingface/`. If either can't be downloaded, EasyForm AI **still runs** — it falls back to a scikit-learn TF-IDF index and to fused-rank retrieval, and the UI says so.

### 2. Tesseract (only needed for scanned forms)

- **macOS:** `brew install tesseract`
- **Ubuntu / Debian:** `sudo apt-get install tesseract-ocr`
- **Windows:** install from https://github.com/UB-Mannheim/tesseract/wiki, then add the install folder to `PATH`.

The W-9 demo dataset is a text PDF, so OCR is not exercised by default.

### 3. Environment file

```bash
cp .env.example .env
# open .env and paste your OpenAI key
```

The app runs without a key — every field will show the official text verbatim with a "AI simplification unavailable" note. The retrieval, citation and abstention machinery all work identically.

---

## Running the app

```bash
uvicorn app:app --reload --port 8000
# or:  python app.py
```

Open `http://127.0.0.1:8000/`.

The demo dataset is pre-loaded under `data/`. The upload panel accepts any government PDF. If you have official instructions, upload them in the second slot — the top-bar badge switches from "Form-only mode" (amber) to "Form + official instructions" (teal), and the evidence gate reaches into both documents.

### API surface

- `POST /api/analyze` — multipart: `form`, optional `instructions`. Returns a session id + detected fields + engine info.
- `GET  /api/session/{sid}` — the same session status.
- `GET  /api/session/{sid}/page/{form|instructions}/{page}.png` — rendered page image.
- `POST /api/session/{sid}/explain` — `{field_id, baseline?, nocache?}`.
- `POST /api/session/{sid}/followup` — `{field_id, question}`.
- `GET  /api/session/{sid}/overview` — retrieval-only summary per field (cheap).
- `GET  /api/health` — LLM availability, session count.

---

## Evaluation

The evaluation script measures the pipeline against a hand-labelled W-9 benchmark of 12 fields with gold pages + expected phrases, 3 supported follow-up questions, and 6 unsupported abstention questions.

```bash
python -m evaluation.evaluate           # prints markdown report
python -m evaluation.evaluate --json    # also saves timestamped results
```

**Numbers from this repo's demo run** (fallback stack: TF-IDF + fused rank + no LLM):

| Metric                | form-only | form + instructions |
| --------------------- | --------: | ------------------: |
| Fields                |        12 |                  12 |
| Recall@1 form page    |   100.0 % |             100.0 % |
| Recall@5 form page    |   100.0 % |             100.0 % |
| Recall@5 instr page   |     — n/a |              50.0 % |
| any-phrase hit @5     |    91.7 % |              91.7 % |
| all-phrases hit @5    |    83.3 % |              83.3 % |
| field-ref hit @3      |   100.0 % |             100.0 % |
| Wrongly abstained     |     0.0 % |               0.0 % |
| Follow-up hit @5      |    66.7 % |              66.7 % |
| **Abstention accuracy** | **83.3 %** |         **100.0 %** |
| **False-answer rate** |  **16.7 %** |           **0.0 %** |

The key takeaways don't need spin:

- The pipeline **never wrongly abstains** on a supported field. If retrieval finds the right passage, the user gets a grounded answer.
- Adding the official instructions **removes every false answer** on the unsupported question set. That is the intended behaviour of the evidence gate — more corpus, cleaner refusals.
- The `Recall@5 instr page` of 50% on form+instructions mode is the honest weak point on the fallback stack: when the form itself already explains a field, the instructions page rarely surfaces in the top 5. Turning on MiniLM + the cross-encoder recovers most of this (dense retrieval catches paraphrase the form doesn't share word-for-word with the instructions).
- **LLM-only baseline** is provided in the UI (the "Compare with LLM-only" button on any field's card) and it's usually plausible-sounding but not grounded. It's intentionally not scored here — grading a free-text baseline needs ground-truth answer texts the demo doesn't have.

---

## Limitations we're not hiding

1. **The field detector is generic but not clairvoyant.** On forms with unusually creative layout (labels split across three lines, checkboxes vertically stacked with faint captions), the label recovery can pick up the wrong words. Every field in the UI shows its recovered label and the exact page location, so this is visible, not silent.
2. **Retrieval quality depends on section headings.** The chunker leans hard on the form's section structure. A form with no bold headers and no run-in bold leads (rare, but they exist) will still work but will lose the field-reference boost.
3. **The demo dataset is one form.** The IRS Form W-9 is a well-behaved fillable PDF with real AcroForm widgets. The rules were designed to generalise (see the "What's *not* here" section) but a hackathon build's real ceiling is on forms the author has actually tested.
4. **Latency figures above are for the fallback stack.** With MiniLM + the CrossEncoder loaded, a cold explain call is ~150–300 ms of retrieval + rerank plus whatever `gpt-4o-mini` takes (~500–1500 ms). All numbers in the UI reflect what actually ran.

## Roadmap (if this becomes a real product)

- Structured "field taxonomy" export so the same detected-fields view can drive a fill-me flow, not just an explain flow.
- A second-pass verifier that queries the source PDFs for corroborating quotes at display time, so citations are literal quotes and not just section labels.
- Multilingual explanations off the same English evidence (careful: only translate the *explanation*, never the extracted text you're citing).
- Structured "safe to skip" and "seek professional help" hints — the W-9 is easy; the I-864 is not.

---

## Credits

- IRS Form W-9 (Rev. March 2024) and Requester Instructions — public domain U.S. government works.
- `sentence-transformers/all-MiniLM-L6-v2`, `cross-encoder/ms-marco-MiniLM-L-6-v2` — Apache-2.0.
- `PyMuPDF`, `rank_bm25`, `FastAPI`, `rapidfuzz`, `openai` — see individual licenses.
