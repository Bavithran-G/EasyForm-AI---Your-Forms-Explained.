"""LLM explanation (after retrieval only).

The model receives the field, its form context and numbered evidence blocks, and must return
JSON matching `Explanation`. If no API key / API failure, we return a deterministic extractive
fallback that quotes the official evidence and clearly says the LLM was not used — never a
fabricated "AI" answer.
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import List, Optional, Tuple

from pydantic import ValidationError

from backend.schemas import Evidence, Explanation, FormField, Source

log = logging.getLogger(__name__)

DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = """You are EasyForm AI, a plain-language assistant for government forms.
You explain ONE form field to a citizen using ONLY the official evidence blocks supplied.

Hard rules:
1. The uploaded documents are the only source of truth. Never use outside knowledge about the
   government, the agency, the form, eligibility, fees, deadlines, formats or required documents.
2. Every government-specific statement must be traceable to an evidence block. If the evidence does
   not say it, do not say it. Leave a JSON value as "" rather than guess.
3. Do NOT invent examples. Only give an example if the evidence contains one; otherwise set
   "example" to "" (the UI will say no official example is provided). Never produce realistic-looking
   personal data (names, numbers, addresses).
4. Simplify wording but keep the original meaning and the important official terms (quote them).
5. "meaning" = what the field is, in one or two plain sentences. "what_to_enter" = the concrete
   action for the citizen, only as supported. "format" = format/units only if stated. "note" =
   important source-backed cautions, restrictions or who should leave it blank.
6. Set "evidence_status": "supported" if the evidence directly explains the field; "partial" if
   it is related but incomplete; "insufficient" if it does not really cover this field. Set
   "confidence" accordingly (high / medium / low). Be honest — an "insufficient" answer is a good answer.
7. "source_index" must be the number of the evidence block you relied on most.
Return ONLY a JSON object with keys: simplified_label, meaning, what_to_enter, format, example,
note, source_index, confidence, evidence_status."""

FOLLOWUP_SYSTEM = """You are EasyForm AI. Answer the citizen's follow-up question about ONE form field using ONLY
the evidence blocks. If the evidence does not answer the question, say exactly that you could not
find guidance for the question in the uploaded documents, and set evidence_status to
"insufficient". Never use outside knowledge, never guess, never invent examples or numbers.
Return ONLY JSON: {"answer": "...", "evidence_status": "supported|partial|insufficient",
"confidence": "high|medium|low", "source_index": <int>}"""


def _evidence_block(evidence: List[Evidence]) -> str:
    parts = []
    for i, e in enumerate(evidence, start=1):
        loc = f"{e.document_name} ({e.document_type}), page {e.page}"
        sec = " / ".join(x for x in (e.section, e.subsection) if x)
        parts.append(f"[E{i}] {loc}{' — ' + sec if sec else ''}\n{e.text}")
    return "\n\n".join(parts)


def _field_block(fld: FormField) -> str:
    opts = f"\nOptions in this group: {', '.join(fld.options)}" if fld.options else ""
    return (f"Field label (exact wording on the form): {fld.text}\nField type: {fld.field_type}\n"
            f"Page: {fld.page}\nSection: {fld.section}\nNearby text on the form: {fld.context[:500]}{opts}")


class Explainer:
    def __init__(self, model: Optional[str] = None):
        self.client = None
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        
        if groq_key:
            self.model = model or os.getenv("OPENAI_MODEL", "openai/gpt-oss-120b")
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=groq_key, base_url="https://api.groq.com/openai/v1")
            except Exception as e:
                log.warning("Groq client init failed: %s", e)
        elif openai_key:
            self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=openai_key)
            except Exception as e:
                log.warning("OpenAI client init failed: %s", e)
        else:
            self.model = model or DEFAULT_MODEL

    @property
    def available(self) -> bool:
        return self.client is not None

    # ------------------------------------------------------------------ core call
    def _chat(self, system: str, user: str, max_tokens: int = 700) -> Tuple[dict, dict]:
        resp = self.client.chat.completions.create(
            model=self.model, temperature=0, max_tokens=max_tokens,
            response_format={"type": "json_object"},
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        )
        text = resp.choices[0].message.content or "{}"
        usage = {"prompt_tokens": resp.usage.prompt_tokens, "completion_tokens": resp.usage.completion_tokens,
                 "total_tokens": resp.usage.total_tokens} if resp.usage else {}
        text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
        return json.loads(text), usage

    def explain(self, fld: FormField, evidence: List[Evidence], baseline: bool = False) -> Tuple[Explanation, dict, str]:
        """Returns (explanation, usage, mode) where mode in {'llm','baseline','fallback'}."""
        if not self.available:
            return self._fallback(fld, evidence), {}, "fallback"
        if baseline:
            user = (f"Explain this government form field to a citizen. Return the same JSON keys "
                    f"(simplified_label, meaning, what_to_enter, format, example, note, source_index, "
                    f"confidence, evidence_status).\n\nField label: {fld.text}")
            system = "You are a helpful assistant that explains government form fields. Return only JSON."
        else:
            user = f"{_field_block(fld)}\n\nEVIDENCE BLOCKS:\n{_evidence_block(evidence)}\n\nReturn the JSON now."
            system = SYSTEM_PROMPT
        try:
            data, usage = self._chat(system, user)
        except Exception as e:
            log.error("LLM call failed: %s", e)
            exp = self._fallback(fld, evidence)
            exp.note = (exp.note + " " if exp.note else "") + f"(AI explanation unavailable: {type(e).__name__})"
            return exp, {}, "fallback"
        exp = self._parse(data, evidence)
        return exp, usage, "baseline" if baseline else "llm"

    def followup(self, fld: FormField, question: str, evidence: List[Evidence]) -> Tuple[dict, dict, str]:
        if not self.available:
            return self._fallback_followup(question, evidence), {}, "fallback"
        user = (f"{_field_block(fld)}\n\nCitizen's question: {question}\n\nEVIDENCE BLOCKS:\n"
                f"{_evidence_block(evidence)}\n\nReturn the JSON now.")
        try:
            data, usage = self._chat(FOLLOWUP_SYSTEM, user, max_tokens=400)
        except Exception as e:
            log.error("LLM follow-up failed: %s", e)
            return self._fallback_followup(question, evidence), {}, "fallback"
        idx = data.get("source_index")
        src = evidence[idx - 1] if isinstance(idx, int) and 1 <= idx <= len(evidence) else (evidence[0] if evidence else None)
        return {"answer": str(data.get("answer", "")).strip(),
                "evidence_status": data.get("evidence_status", "insufficient"),
                "confidence": data.get("confidence", "low"), "source": src}, usage, "llm"

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _parse(data: dict, evidence: List[Evidence]) -> Explanation:
        idx = data.pop("source_index", None)
        src = None
        if isinstance(idx, int) and 1 <= idx <= len(evidence):
            e = evidence[idx - 1]
            src = Source(document=e.document_name, document_type=e.document_type, page=e.page,
                         section=" / ".join(x for x in (e.section, e.subsection) if x))
        elif evidence:
            e = evidence[0]
            src = Source(document=e.document_name, document_type=e.document_type, page=e.page,
                         section=" / ".join(x for x in (e.section, e.subsection) if x))
        clean = {k: ("" if v is None else (v if isinstance(v, str) else json.dumps(v))) for k, v in data.items()
                 if k in Explanation.model_fields and k not in ("source",)}
        for k in ("confidence", "evidence_status"):
            v = str(clean.get(k, "")).lower().strip()
            clean[k] = v if v in ("high", "medium", "low", "supported", "partial", "insufficient") else None
        clean = {k: v for k, v in clean.items() if v is not None}
        try:
            exp = Explanation(**clean)
        except ValidationError as e:
            log.warning("LLM output failed validation: %s", e)
            exp = Explanation(meaning=str(data.get("meaning", ""))[:600], confidence="low", evidence_status="partial")
        exp.source = src
        return exp

    @staticmethod
    def _fallback(fld: FormField, evidence: List[Evidence]) -> Explanation:
        label = re.sub(r"^(\d{1,2}[a-z]?|Part\s+[IVX]+)[\.\):]?\s+", "", fld.text, flags=re.I)
        if not evidence:
            return Explanation(simplified_label=label, confidence="low", evidence_status="insufficient")
        e = evidence[0]
        sents = re.split(r"(?<=[\.\?\!])\s+", e.text.replace("\n", " "))
        return Explanation(
            simplified_label=label,
            meaning="",
            what_to_enter="What the official document says: " + " ".join(sents[:3]),
            note="AI simplification is unavailable (no API key), so the official wording is shown verbatim.",
            source=Source(document=e.document_name, document_type=e.document_type, page=e.page,
                          section=" / ".join(x for x in (e.section, e.subsection) if x)),
            confidence="medium", evidence_status="partial")

    @staticmethod
    def _fallback_followup(question: str, evidence: List[Evidence]) -> dict:
        if not evidence:
            return {"answer": "", "evidence_status": "insufficient", "confidence": "low", "source": None}
        e = evidence[0]
        return {"answer": "AI answering is unavailable (no API key). The most relevant official text is: " +
                          e.text[:500], "evidence_status": "partial", "confidence": "low", "source": e}
