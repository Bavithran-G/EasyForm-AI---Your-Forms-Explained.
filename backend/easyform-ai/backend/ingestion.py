"""PDF ingestion: page-aware lines with layout metadata, OCR fallback for image pages.

Output of `ingest_pdf` is a `Document` holding, per page, ordered TextLines (with bbox, font
size, bold flag, block id, column) plus page geometry. Nothing here knows about any specific
government form.
"""
from __future__ import annotations

import logging
import statistics
from dataclasses import dataclass, field
from typing import Dict, List

import pymupdf as fitz

from backend.schemas import BBox, DocumentType, PageInfo, TextLine

log = logging.getLogger(__name__)


@dataclass
class Document:
    name: str
    document_type: DocumentType
    path: str
    pages: List[PageInfo] = field(default_factory=list)
    lines: Dict[int, List[TextLine]] = field(default_factory=dict)  # page -> lines in reading order
    body_size: float = 8.0          # most common font size (used to spot headings)
    has_acroform: bool = False

    def page_text(self, page: int) -> str:
        return "\n".join(l.text for l in self.lines.get(page, []))


class IngestionError(Exception):
    pass


def _lines_from_dict(page: fitz.Page, pno: int) -> List[TextLine]:
    out: List[TextLine] = []
    td = page.get_text("dict")
    for bi, b in enumerate(td.get("blocks", [])):
        if b.get("type") != 0:
            continue
        for l in b.get("lines", []):
            spans = [s for s in l.get("spans", []) if s.get("text", "").strip()]
            if not spans:
                continue
            text = "".join(s["text"] for s in l["spans"]).strip()
            if not text:
                continue
            # rotated text (e.g. vertical "Print or type") is not useful for labels
            d = l.get("dir", (1, 0))
            if abs(d[0]) < 0.9:
                continue
            x0, y0, x1, y1 = l["bbox"]
            main = max(spans, key=lambda s: len(s["text"]))
            isb = [("Bold" in s["font"] or "-Bd" in s["font"] or "Blk" in s["font"] or bool(s["flags"] & 16))
                   for s in spans]
            bold = all(isb)
            prefix = ""
            if not bold and isb[0]:
                k = 0
                while k < len(isb) and isb[k]:
                    prefix += spans[k]["text"]
                    k += 1
            out.append(TextLine(text=text, page=pno, bbox=BBox(x=x0, y=y0, width=x1 - x0, height=y1 - y0),
                                size=round(main["size"], 1), bold=bool(bold), bold_prefix=prefix.strip(),
                                block_id=bi))
    return out


def _ocr_lines(page: fitz.Page, pno: int) -> List[TextLine]:
    """OCR fallback for image-only pages. Returns [] if Tesseract is unavailable."""
    try:
        import pytesseract
        from PIL import Image
        import io
    except Exception as e:  # pragma: no cover
        log.warning("OCR unavailable: %s", e)
        return []
    try:
        zoom = 2.0
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    except Exception as e:
        log.warning("OCR failed on page %d: %s", pno, e)
        return []
    # group words into lines by (block, par, line)
    groups: Dict[tuple, list] = {}
    for i, w in enumerate(data["text"]):
        if not w.strip() or int(data["conf"][i]) < 0:
            continue
        key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        groups.setdefault(key, []).append(i)
    out = []
    for key, idxs in sorted(groups.items()):
        xs0 = min(data["left"][i] for i in idxs) / zoom
        ys0 = min(data["top"][i] for i in idxs) / zoom
        xs1 = max(data["left"][i] + data["width"][i] for i in idxs) / zoom
        ys1 = max(data["top"][i] + data["height"][i] for i in idxs) / zoom
        text = " ".join(data["text"][i] for i in idxs)
        out.append(TextLine(text=text, page=pno, bbox=BBox(x=xs0, y=ys0, width=xs1 - xs0, height=ys1 - ys0),
                            size=max(1.0, (ys1 - ys0) * 0.8), bold=False, block_id=key[0]))
    return out


def _reading_order(lines: List[TextLine], page_width: float) -> List[TextLine]:
    """Column-aware ordering. Full-width lines split the page into vertical regions; inside a
    region the left column is read before the right column."""
    if not lines:
        return lines
    mid = page_width / 2
    for l in lines:
        x0, x1 = l.bbox.x, l.bbox.x + l.bbox.width
        if x0 < mid - 30 and x1 > mid + 30:
            l.column = -1          # spans both columns
        else:
            l.column = 0 if (x0 + x1) / 2 < mid else 1
    lines = sorted(lines, key=lambda l: (l.bbox.y, l.bbox.x))
    ordered: List[TextLine] = []
    region: List[TextLine] = []

    def flush():
        region.sort(key=lambda l: (l.column, l.bbox.y, l.bbox.x))
        ordered.extend(region)
        region.clear()

    for l in lines:
        if l.column == -1:
            flush()
            ordered.append(l)
        else:
            region.append(l)
    flush()
    return ordered


def ingest_pdf(path: str, name: str, document_type: DocumentType) -> Document:
    try:
        pdf = fitz.open(path)
    except Exception as e:
        raise IngestionError(f"Could not open PDF: {e}")
    if pdf.is_encrypted and not pdf.authenticate(""):
        raise IngestionError("PDF is password protected.")
    if len(pdf) == 0:
        raise IngestionError("PDF has no pages.")

    doc = Document(name=name, document_type=document_type, path=path, has_acroform=bool(pdf.is_form_pdf))
    sizes: List[float] = []
    for pno, page in enumerate(pdf, start=1):
        lines = _lines_from_dict(page, pno)
        ocr = False
        if sum(len(l.text) for l in lines) < 40:          # effectively no text layer
            ocr_lines = _ocr_lines(page, pno)
            if ocr_lines:
                lines, ocr = ocr_lines, True
        lines = _reading_order(lines, page.rect.width)
        doc.lines[pno] = lines
        doc.pages.append(PageInfo(page=pno, width=page.rect.width, height=page.rect.height, ocr=ocr))
        sizes.extend(l.size for l in lines if len(l.text) > 30)
    if sizes:
        try:
            doc.body_size = statistics.mode(sizes)
        except statistics.StatisticsError:
            doc.body_size = statistics.median(sizes)
    total = sum(len(l.text) for ls in doc.lines.values() for l in ls)
    if total < 40:
        raise IngestionError("No readable text found in the PDF (text layer missing and OCR produced nothing).")
    return doc


def render_page_png(path: str, page: int, zoom: float = 2.0) -> bytes:
    pdf = fitz.open(path)
    p = pdf[page - 1]
    pix = p.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return pix.tobytes("png")
