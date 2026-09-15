"""Section-aware, page-aware chunking.

Paragraph boundaries come from layout (headings, run-in bold leads, bullets, vertical gaps,
first-line indents). Paragraphs are grouped under (section, subsection) and packed into chunks
of ~MAX_CHARS with one-sentence overlap when a paragraph must be split. Every chunk keeps
page, section, subsection and document identity.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional

from backend.field_detector import PUNCT_ONLY_RE, _heading_block_ok, _is_heading, _x0, _y0, _y1
from backend.ingestion import Document
from backend.schemas import Chunk, TextLine

MAX_CHARS = 900
MIN_CHARS = 40
SENT_RE = re.compile(r"(?<=[\.\?\!;:])\s+(?=[A-Z0-9•\(\"“])")
FIELD_REF_RE = re.compile(r"\b(line\s+\d{1,2}[a-z]?|part\s+[ivx]+|item\s+\d+|box\s+\d+[a-z]?)\b", re.I)


@dataclass
class _Para:
    page: int
    section: str
    subsection: str
    text: str
    ocr: bool


def _paragraphs(doc: Document) -> List[_Para]:
    paras: List[_Para] = []
    section, subsection = "", ""
    cur: Optional[_Para] = None
    prev: Optional[TextLine] = None
    prev_head: Optional[TextLine] = None
    for page in doc.pages:
        lines = doc.lines.get(page.page, [])
        col_x0 = {}
        for l in lines:
            col_x0.setdefault(l.column, []).append(_x0(l))
        col_left = {c: min(v) for c, v in col_x0.items()}
        for l in lines:
            t = l.text.strip()
            if re.match(r"^(Form\s+[\w-]+\s*\(Rev\.|Cat\. No\.|Page \d+$|Instr\. for)", t) or re.match(r"^\d+\s+Instr\.", t) \
                    or PUNCT_ONLY_RE.match(t):
                continue  # running headers/footers, leader dots
            top_banner = page.page == 1 and _y1(l) < 0.12 * page.height and l.size < doc.body_size + 4
            if _is_heading(l, doc.body_size) and _heading_block_ok(l, lines) and not top_banner:
                if cur:
                    paras.append(cur); cur = None
                # wrapped heading lines of the same size are joined
                ph = prev_head
                if ph is not None and ph.size == l.size and ph.page == l.page and \
                        -3 <= _y0(l) - _y1(ph) < 0.6 * l.bbox.height:
                    section = (section + " " + t).strip()
                elif ph is not None and ph.page == l.page and abs(_y0(ph) - _y0(l)) < 4:
                    section = (section + " " + t).strip()   # "Part I" + title on the same row
                else:
                    section = t
                subsection = ""
                prev = l
                prev_head = l
                continue
            new_para = False
            runin_open = prev is not None and prev.bold and cur is not None and prev.page == l.page \
                and -3 <= _y0(l) - _y1(prev) < 0.6 * l.bbox.height and cur.text == prev.text
            if l.bold_prefix and len(l.bold_prefix) > 3 and runin_open:
                subsection = (cur.subsection + " " + l.bold_prefix).rstrip(".:")   # wrapped run-in heading
                cur.subsection = subsection
                cur.text += " " + t
                prev = l
                continue
            if l.bold and len(t) > 3:
                subsection = t.rstrip(".:")     # fully bold body-size lead line
                new_para = True
            elif l.bold_prefix and len(l.bold_prefix) > 3:
                subsection = l.bold_prefix.rstrip(".:")
                new_para = True
            elif t.startswith(("•", "·", "-", "–")) or re.match(r"^\d{1,2}[\.\)]\s", t) or re.match(r"^[A-M]—", t):
                new_para = True
            elif prev is None or prev.page != l.page or prev.column != l.column:
                new_para = True
            elif _y0(l) - _y1(prev) > 0.8 * l.bbox.height:
                new_para = True
            elif _x0(l) - col_left.get(l.column, _x0(l)) > 6 and _x0(prev) - col_left.get(prev.column, _x0(prev)) <= 6:
                new_para = True     # first-line indent
            if new_para or cur is None:
                if cur:
                    paras.append(cur)
                cur = _Para(page=l.page, section=section, subsection=subsection, text=t, ocr=page.ocr)
            else:
                cur.text += " " + t
            prev = l
    if cur:
        paras.append(cur)
    return [p for p in paras if len(p.text.strip()) >= 3]


def _split_long(text: str) -> List[str]:
    sents = SENT_RE.split(text)
    out, buf = [], ""
    for s in sents:
        if len(buf) + len(s) + 1 > MAX_CHARS and buf:
            out.append(buf.strip())
            buf = (sents[max(0, sents.index(s) - 1)] + " " + s) if len(s) < MAX_CHARS else s  # 1-sentence overlap
        else:
            buf = (buf + " " + s).strip()
    if buf:
        out.append(buf.strip())
    return out


def chunk_document(doc: Document, field_labels: Optional[List[str]] = None) -> List[Chunk]:
    paras = _paragraphs(doc)
    chunks: List[Chunk] = []
    buf: Optional[_Para] = None

    def flush():
        nonlocal buf
        if buf is None:
            return
        for piece in _split_long(buf.text):
            if len(piece) < MIN_CHARS and chunks and chunks[-1].page == buf.page and chunks[-1].section == buf.section:
                chunks[-1].text += " " + piece
                continue
            ref = FIELD_REF_RE.search(buf.subsection or "") or FIELD_REF_RE.search(buf.section or "")
            chunks.append(Chunk(chunk_id="", document_type=doc.document_type, document_name=doc.name,
                                page=buf.page, section=buf.section, subsection=buf.subsection,
                                field=ref.group(0) if ref else "", text=piece, ocr=buf.ocr))
        buf = None

    for p in paras:
        if buf is not None and (p.section, p.subsection) == (buf.section, buf.subsection) \
                and p.page == buf.page and len(buf.text) + len(p.text) < MAX_CHARS:
            buf.text += "\n" + p.text
        else:
            flush()
            buf = _Para(**p.__dict__)
    flush()
    prefix = "F" if doc.document_type == "form" else "I"
    for i, c in enumerate(chunks, start=1):
        c.chunk_id = f"{prefix}{i:04d}"
    return chunks
