"""Form field detection.

Strategy (generic, no form-specific rules):
1. If the PDF has AcroForm widgets, every widget is a field. Its label is recovered from the
   page text geometry: text on the same row (to the right for checkboxes, to the left for entry
   boxes) or the nearest text block directly above the widget. Wrapped label lines are joined,
   and enumerated labels ("1", "3a", "Part I") stop the upward extension.
   Checkboxes sharing a widget name become a checkbox group with its own clickable label.
   Adjacent entry boxes that resolve to the same label (e.g. segmented number boxes) are merged.
2. If there are no widgets (flat or scanned form), label-like lines followed by empty vertical
   space or underscores are treated as fields (bbox = label line + the blank space below).
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional

import pymupdf as fitz

from backend.ingestion import Document
from backend.schemas import BBox, FormField, TextLine

ENUM_RE = re.compile(r"^(\d{1,2}[a-z]?[\.\):]?|[A-Za-z][\.\)]|[ivx]+[\.\)]|Part\s+[IVX]+[\.\):]?)\s+", re.I)
PUNCT_ONLY_RE = re.compile(r"^[\.\s·•_\-–—]+$")
LEADER_RE = re.compile(r"(\s*\.){2,}\s*$")


def _x0(l: TextLine): return l.bbox.x
def _x1(l: TextLine): return l.bbox.x + l.bbox.width
def _y0(l: TextLine): return l.bbox.y
def _y1(l: TextLine): return l.bbox.y + l.bbox.height


def _v_overlap(a0, a1, b0, b1) -> float:
    return max(0.0, min(a1, b1) - max(a0, b0))


def _same_row(l: TextLine, r: fitz.Rect) -> bool:
    ov = _v_overlap(_y0(l), _y1(l), r.y0, r.y1)
    return ov >= 0.5 * min(l.bbox.height, r.height)


def _clean(text: str) -> str:
    text = LEADER_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip(" .")
    return text.strip()


def _is_heading(l: TextLine, body: float) -> bool:
    if len(l.text) < 4 or len(l.text) > 90:
        return False
    return l.size >= body + 1.5 or (l.bold and l.size >= body + 1 and len(l.text) < 60)


def _heading_block_ok(l: TextLine, lines: List[TextLine]) -> bool:
    """A bold/large line that is part of a wrapped multi-line paragraph of the same style is body
    text (e.g. a bold 3-line note), not a section heading — unless the wrapped lines are large."""
    if l.size >= 12:
        return True
    same = [p for p in lines if p is not l and abs(_x0(p) - _x0(l)) < 3 and abs(p.size - l.size) < 0.3
            and p.bold == l.bold and (-3 <= _y0(p) - _y1(l) < 0.6 * l.bbox.height or -3 <= _y0(l) - _y1(p) < 0.6 * l.bbox.height)]
    return len(same) == 0


class _Page:
    def __init__(self, doc: Document, pno: int):
        self.doc = doc
        self.pno = pno
        self.lines = [l for l in doc.lines.get(pno, []) if not PUNCT_ONLY_RE.match(l.text)]
        self.leaders = [l for l in doc.lines.get(pno, []) if PUNCT_ONLY_RE.match(l.text)]
        self.body = doc.body_size

    # ---- label geometry -------------------------------------------------------------
    def extend_up(self, l: TextLine) -> List[TextLine]:
        """Join wrapped lines above `l` that belong to the same label paragraph."""
        block = [l]
        cur = l
        for _ in range(6):
            if ENUM_RE.match(cur.text):
                break
            cands = [p for p in self.lines if not re.search(r"[\.:;]\)?$", p.text)]
            cands = [p for p in cands
                     if _y1(p) <= _y0(cur) + 1 and (_y0(cur) - _y1(p)) < 0.6 * cur.bbox.height
                     and abs(_x0(p) - _x0(cur)) < 30 and abs(p.size - cur.size) < 0.6
                     and not _is_heading(p, self.body)]
            if not cands:
                break
            p = max(cands, key=_y1)
            block.insert(0, p)
            cur = p
        return block

    def label_right(self, r: fitz.Rect, max_gap: float = 15) -> Optional[List[TextLine]]:
        c = [l for l in self.lines if _same_row(l, r) and 0 <= _x0(l) - r.x1 <= max_gap]
        if not c:
            return None
        l = min(c, key=_x0)
        return [l]

    def label_left(self, r: fitz.Rect, max_gap: float = 25, leader_gap: float = 130) -> Optional[List[TextLine]]:
        row = [l for l in self.lines if _same_row(l, r) and _x1(l) <= r.x0 + 2]
        if not row:
            return None
        l = max(row, key=_x1)
        gap = r.x0 - _x1(l)
        has_leader = any(_same_row(d, r) and _x1(l) - 2 <= _x0(d) <= r.x0 for d in self.leaders)
        if gap > (leader_gap if has_leader else max_gap):
            return None
        # a paragraph (several lines stacked in the widget's vertical band) is not a label
        stacked = [p for p in self.lines if abs(_x0(p) - _x0(l)) < 3 and
                   _v_overlap(_y0(p), _y1(p), r.y0, r.y1) > 0.3 * p.bbox.height]
        if len(stacked) > 1 or len(l.text) > 110:
            return None
        return self.extend_up(l)

    def label_above(self, r: fitz.Rect, max_gap: float = 40) -> Optional[List[TextLine]]:
        c = [l for l in self.lines if _y1(l) <= r.y0 + 2 and (r.y0 - _y1(l)) <= max_gap
             and _v_overlap(_x0(l), _x1(l), r.x0, r.x1) > 0 and not _is_heading(l, self.body)]
        if not c:
            return None
        l = max(c, key=_y1)
        return self.extend_up(l)

    def enumerated_parent(self, r: fitz.Rect, label_lines: List[TextLine], max_gap: float = 80) -> Optional[str]:
        """An enumerated cell header ('4 Exemptions ...') above an un-numbered entry box in the same cell."""
        ids = {id(l) for l in label_lines}
        c = [l for l in self.lines if id(l) not in ids and ENUM_RE.match(l.text) and _y1(l) <= r.y0
             and (r.y0 - _y1(l)) <= max_gap and _x1(l) >= r.x0 and (r.x0 - 100) <= _x0(l) <= r.x1
             and not _is_heading(l, self.body)]
        if not c:
            return None
        top = max(c, key=_y1)
        block = [top]
        for p in sorted(self.lines, key=_y0):          # wrapped continuation lines of the header
            last = block[-1]
            if id(p) in ids or p is top:
                continue
            if 0 <= _y0(p) - _y1(last) < 0.6 * last.bbox.height and abs(_x0(p) - _x0(last)) < 30 and \
                    _y1(p) <= r.y0 and len(block) < 4:
                block.append(p)
        return _clean(" ".join(l.text for l in block))

    def section_for(self, y: float) -> str:
        heads = [l for l in self.lines if _is_heading(l, self.body) and _y1(l) <= y
                 and _heading_block_ok(l, self.lines)]
        if not heads:
            return f"Page {self.pno}"
        h = max(heads, key=_y1)
        # same row (e.g. "Part I" + its title) or wrapped lines of the same large title
        block = [l for l in heads if abs(_y0(l) - _y0(h)) < 4 or
                 (abs(l.size - h.size) < 0.3 and abs(_y0(h) - _y1(l)) < 0.6 * h.bbox.height)]
        block.sort(key=lambda l: (round(_y0(l)), _x0(l)))
        return _clean(" ".join(l.text for l in block))

    def context_for(self, r: fitz.Rect, label_lines: List[TextLine], window: float = 70, limit: int = 700) -> str:
        ids = {id(l) for l in label_lines}
        near = [l for l in self.lines if id(l) not in ids and not _is_heading(l, self.body)
                and _y1(l) >= r.y0 - window and _y0(l) <= r.y1 + window]
        near.sort(key=lambda l: (abs((_y0(l) + _y1(l)) / 2 - (r.y0 + r.y1) / 2)))
        out, n = [], 0
        for l in near:
            if n + len(l.text) > limit:
                break
            out.append(l)
            n += len(l.text)
        out.sort(key=lambda l: (_y0(l), _x0(l)))
        return _clean(" ".join(l.text for l in out))


def _bbox(r: fitz.Rect) -> BBox:
    return BBox(x=r.x0, y=r.y0, width=r.width, height=r.height)


def _union(rects: List[fitz.Rect]) -> fitz.Rect:
    u = fitz.Rect(rects[0])
    for r in rects[1:]:
        u |= r
    return u


def _type_from_label(label: str, widget_type: str) -> str:
    t = label.lower()
    if widget_type == "CheckBox" or widget_type == "RadioButton":
        return "checkbox"
    if "signature" in t or t.startswith("sign"):
        return "signature"
    if re.search(r"\bdate\b", t):
        return "date"
    return "text"


def detect_fields(doc: Document) -> List[FormField]:
    fields: List[FormField] = []
    pdf = fitz.open(doc.path)
    any_widgets = False
    for pno, page in enumerate(pdf, start=1):
        widgets = list(page.widgets())
        if not widgets:
            continue
        any_widgets = True
        P = _Page(doc, pno)
        raw: List[dict] = []
        for w in widgets:
            r = fitz.Rect(w.rect)
            base = re.sub(r"\[\d+\]$", "", w.field_name or "")
            wtype = w.field_type_string
            lines = None
            if wtype in ("CheckBox", "RadioButton"):
                lines = P.label_right(r) or P.label_left(r) or P.label_above(r)
            else:
                lines = P.label_left(r) or P.label_above(r) or P.label_right(r)
            if lines and (w.field_label or "").strip() == "":
                label = _clean(" ".join(l.text for l in lines))
            else:
                label = (w.field_label or "").strip() or (_clean(" ".join(l.text for l in lines)) if lines else "")
            raw.append(dict(rect=r, base=base, wtype=wtype, lines=lines or [], label=label or f"Unlabeled {wtype.lower()} field"))

        # merge segmented entry boxes with identical label on the same row
        merged: List[dict] = []
        for item in sorted(raw, key=lambda d: (d["rect"].y0, d["rect"].x0)):
            m = next((x for x in merged if x["wtype"] == item["wtype"] and item["wtype"] == "Text"
                      and (x["label"] == item["label"] or item["label"].startswith("Unlabeled")) and _v_overlap(x["rect"].y0, x["rect"].y1, item["rect"].y0, item["rect"].y1) > 0
                      and abs(item["rect"].x0 - x["rect"].x1) < 25), None)
            if m:
                m["rect"] |= item["rect"]
            else:
                merged.append(item)

        # checkbox groups
        groups: Dict[str, List[dict]] = {}
        for item in merged:
            if item["wtype"] in ("CheckBox", "RadioButton"):
                groups.setdefault(item["base"], []).append(item)
        for base, items in groups.items():
            if len(items) < 2:
                continue
            u = _union([i["rect"] for i in items])
            glines = P.label_above(fitz.Rect(u.x0, u.y0, u.x1, u.y0 + 1), max_gap=60)
            if not glines:
                continue
            glabel = _clean(" ".join(l.text for l in glines))
            grect = _union([fitz.Rect(_x0(l), _y0(l), _x1(l), _y1(l)) for l in glines] + [u])
            merged.append(dict(rect=grect, base=base, wtype="Group", lines=glines, label=glabel,
                               options=[i["label"] for i in items], group=base))
            for i in items:
                i["group"] = base
                i["group_label"] = glabel
            for x in merged:
                if x["wtype"] == "Text" and not x.get("group_label") and any(x["label"] == i["label"] for i in items):
                    x["group_label"] = glabel

        for item in sorted(merged, key=lambda d: (d["rect"].y0, d["rect"].x0)):
            r = item["rect"]
            ftype = "checkbox_group" if item["wtype"] == "Group" else _type_from_label(item["label"], item["wtype"])
            ctx = P.context_for(r, item["lines"])
            parent = item.get("group_label")
            if not parent and not ENUM_RE.match(item["label"]):
                parent = P.enumerated_parent(r, item["lines"])
            if parent:
                ctx = f"Part of: {parent}. " + ctx
            fields.append(FormField(
                field_id="", text=item["label"], page=pno, field_type=ftype, bbox=_bbox(r),
                section=P.section_for(r.y0), context=ctx, group=item.get("group"),
                options=item.get("options", []), source="acroform"))

    if not any_widgets:
        fields = _layout_fields(doc)

    fields.sort(key=lambda f: (f.page, round(f.bbox.y / 4), f.bbox.x))
    for i, f in enumerate(fields, start=1):
        f.field_id = f"field_{i:03d}"
    return fields


def _layout_fields(doc: Document) -> List[FormField]:
    """Fallback for flat/scanned forms: label-like lines followed by blank space or underscores."""
    out: List[FormField] = []
    for pno, lines in doc.lines.items():
        P = _Page(doc, pno)
        page_info = next(p for p in doc.pages if p.page == pno)
        srt = sorted(P.lines, key=lambda l: (_y0(l), _x0(l)))
        for i, l in enumerate(srt):
            t = l.text
            labelish = (ENUM_RE.match(t) or t.rstrip().endswith(":") or "____" in t) and len(t) < 120
            if not labelish or _is_heading(l, P.body):
                continue
            below = [n for n in srt[i + 1:] if _v_overlap(_x0(n), _x1(n), _x0(l), _x1(l)) > 0 and _y0(n) > _y1(l)]
            gap = (min(_y0(n) for n in below) - _y1(l)) if below else 20.0
            if gap < 10 and "____" not in t:
                continue
            h = min(max(gap, 12.0), 40.0)
            rect = fitz.Rect(_x0(l), _y0(l), max(_x1(l), _x0(l) + 200), _y1(l) + h)
            ftype = "checkbox" if re.match(r"^[\[\(]\s?[\]\)]|^☐|^□", t) else _type_from_label(t, "Text")
            out.append(FormField(field_id="", text=_clean(t), page=pno, field_type=ftype, bbox=_bbox(rect),
                                 section=P.section_for(_y0(l)), context=P.context_for(rect, [l]),
                                 source="ocr" if page_info.ocr else "layout"))
    return out
