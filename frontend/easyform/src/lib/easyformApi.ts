import type { DocumentPage, FormField, MockDocument } from '../types/form';

export interface BackendBBox { x: number; y: number; width: number; height: number; }
export interface BackendField { field_id: string; text: string; page: number; field_type: string; bbox: BackendBBox; section?: string; context?: string; source?: string; }
export interface BackendPage { page: number; width: number; height: number; ocr?: boolean; }
export interface BackendStatus {
  sid: string;
  session_id: string;
  mode: 'form_only' | 'form_plus_instructions';
  form: { name: string; pages: BackendPage[]; acroform: boolean; chunks: number; ocr_pages: number[] };
  instructions: { name: string; pages: BackendPage[]; chunks: number; ocr_pages: number[] } | null;
  fields: BackendField[];
  engine: { retrieval: string; reranker: string; llm: string | null; llm_available: boolean; build_ms: number };
  warnings: string[];
}

export interface BackendExplanation {
  field_id: string;
  original_field: string;
  mode: 'form_only' | 'form_plus_instructions';
  explanation: {
    simplified_label: string; meaning: string; what_to_enter: string; format: string; example: string; note: string;
    source: { document: string; document_type: string; page: number; section?: string } | null;
    confidence: 'high' | 'medium' | 'low'; evidence_status: 'supported' | 'partial' | 'insufficient';
  };
  evidence: Array<{ chunk_id: string; document_name: string; document_type: string; page: number; section?: string; text: string; score: number }>;
  verification: { notes: string[]; removed: string[]; downgraded: boolean };
  query: string; llm_used: boolean; abstained: boolean; message: string; retrieval: Record<string, unknown>;
}

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const endpoint = (path: string) => `${API_URL}${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(endpoint(path), init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
  return body as T;
}

export async function analyzeForm(form: File, instructions?: File | null): Promise<BackendStatus> {
  const data = new FormData();
  data.append('form', form);
  if (instructions) data.append('instructions', instructions);
  return request<BackendStatus>('/api/analyze', { method: 'POST', body: data });
}
export async function explainField(sid: string, fieldId: string): Promise<BackendExplanation> {
  return request<BackendExplanation>(`/api/session/${encodeURIComponent(sid)}/explain`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field_id: fieldId }),
  });
}
export const pageUrl = (sid: string, page: number) => endpoint(`/api/session/${encodeURIComponent(sid)}/page/form/${page}.png?zoom=2`);

export function statusToDocument(status: BackendStatus): MockDocument {
  const pages: DocumentPage[] = status.form.pages.map((page) => ({
    pageNumber: page.page,
    title: `${status.form.name} — Page ${page.page}`,
    formCode: status.form.name,
    fields: status.fields.filter((field) => field.page === page.page).map((field): FormField => ({
      id: field.field_id, text: field.text, sectionTitle: field.section || undefined, page: field.page,
      bbox: {
        x: (field.bbox.x / page.width) * 100,
        y: (field.bbox.y / page.height) * 100,
        width: (field.bbox.width / page.width) * 100,
        height: (field.bbox.height / page.height) * 100,
      }, explanation: '', whatToEnter: '', source: field.source, required: false,
    })),
  }));
  return { id: status.sid, name: status.form.name, officialTitle: status.form.name, department: status.mode === 'form_plus_instructions' ? 'Form + official instructions' : 'Government form', totalPages: pages.length, pages };
}

export function applyExplanation(field: FormField, result: BackendExplanation): FormField {
  const exp = result.explanation;
  return { ...field, explanation: result.abstained ? result.message : (exp.meaning || exp.simplified_label), whatToEnter: exp.what_to_enter || 'No entry guidance was supported by the uploaded evidence.', exampleValue: exp.example || undefined, source: exp.source ? `${exp.source.document} · page ${exp.source.page}` : field.source, commonMistake: exp.note || undefined };
}
