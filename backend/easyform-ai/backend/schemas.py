"""Shared data contracts. The frontend only ever sees these shapes — nothing form-specific."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

DocumentType = Literal["form", "instructions"]
FieldType = Literal["text", "date", "checkbox", "checkbox_group", "signature", "unknown"]
Confidence = Literal["high", "medium", "low"]
EvidenceStatus = Literal["supported", "partial", "insufficient"]


class BBox(BaseModel):
    """PDF-point coordinates, origin top-left (PyMuPDF convention)."""
    x: float
    y: float
    width: float
    height: float


class TextLine(BaseModel):
    text: str
    page: int
    bbox: BBox
    size: float
    bold: bool
    bold_prefix: str = ""          # leading bold run (run-in heading like 'Exempt payee code.')
    block_id: int
    column: int = 0


class PageInfo(BaseModel):
    page: int
    width: float
    height: float
    ocr: bool = False


class FormField(BaseModel):
    field_id: str
    text: str                       # human-readable label recovered from the form
    page: int
    field_type: FieldType
    bbox: BBox
    section: str = ""
    context: str = ""               # nearby explanatory text from the form
    group: Optional[str] = None     # e.g. checkbox group id
    options: List[str] = []         # for checkbox groups
    source: Literal["acroform", "layout", "ocr"] = "acroform"


class Chunk(BaseModel):
    chunk_id: str
    document_type: DocumentType
    document_name: str
    page: int
    section: str = ""
    subsection: str = ""
    field: str = ""                 # field label this chunk is directly tied to, if any
    text: str
    ocr: bool = False


class Evidence(BaseModel):
    chunk_id: str
    document_name: str
    document_type: DocumentType
    page: int
    section: str = ""
    subsection: str = ""
    text: str
    score: float                    # final ranking score (reranker if available)
    bm25_rank: Optional[int] = None
    semantic_rank: Optional[int] = None


class Source(BaseModel):
    document: str
    document_type: DocumentType
    page: int
    section: str = ""


class Explanation(BaseModel):
    """What the LLM must return (validated), then adjusted by the verifier."""
    simplified_label: str = ""
    meaning: str = ""
    what_to_enter: str = ""
    format: str = ""
    example: str = ""
    note: str = ""
    source: Optional[Source] = None
    confidence: Confidence = "low"
    evidence_status: EvidenceStatus = "insufficient"


class VerificationReport(BaseModel):
    checked_sentences: int = 0
    supported_sentences: int = 0
    unsupported: List[str] = []
    removed: List[str] = []
    downgraded: bool = False
    notes: List[str] = []


class ExplainResponse(BaseModel):
    field_id: str
    original_field: str
    mode: Literal["form_only", "form_plus_instructions"]
    explanation: Explanation
    evidence: List[Evidence]
    verification: VerificationReport
    query: str
    llm_used: bool
    llm_model: Optional[str] = None
    abstained: bool = False
    message: str = ""
    latency_ms: int = 0
    tokens: Optional[dict] = None
    retrieval: dict = {}


class FollowupResponse(BaseModel):
    field_id: str
    question: str
    answer: str
    evidence: List[Evidence]
    evidence_status: EvidenceStatus
    confidence: Confidence
    llm_used: bool
    abstained: bool = False
    latency_ms: int = 0
