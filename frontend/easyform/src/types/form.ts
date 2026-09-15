export interface FormField {
  id: string;
  text: string;
  sectionTitle?: string;
  bbox: {
    x: number; // percentage (0 - 100) or pixel coordinates on page
    y: number;
    width: number;
    height: number;
  };
  explanation: string;
  whatToEnter: string;
  source?: string;
  page: number;
  required?: boolean;
  exampleValue?: string;
  commonMistake?: string;
}

export interface DocumentPage {
  pageNumber: number;
  title: string;
  formCode: string;
  fields: FormField[];
}

export interface MockDocument {
  id: string;
  name: string;
  officialTitle: string;
  department: string;
  totalPages: number;
  pages: DocumentPage[];
}

export interface LiveDocumentState {
  sid: string;
  pageUrls: Record<number, string>;
  fieldExplanations: Record<string, import('../lib/easyformApi').BackendExplanation>;
  warnings: string[];
  mode: 'form_only' | 'form_plus_instructions';
}

export type UploadState = 'idle' | 'uploading' | 'processing' | 'ready';

export type AnalysisStage = 
  | 'reading' 
  | 'finding_fields' 
  | 'understanding' 
  | 'preparing' 
  | 'completed';

export interface ExplanationSelection {
  type: 'field' | 'text';
  title: string;
  explanation: string;
  whatToEnter: string;
  source: string;
  exampleValue?: string;
  commonMistake?: string;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}
