import { useState, useCallback, useEffect, useRef } from 'react';
import type { FormField, ExplanationSelection, MockDocument } from '../types/form';
import { mockGovernmentDocument } from '../data/mockFormFields';

interface InteractionOptions {
  documentData?: MockDocument;
  onFieldSelected?: (field: FormField) => Promise<FormField | void> | FormField | void;
}

export function useDocumentInteraction(options: InteractionOptions = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [activeSelection, setActiveSelection] = useState<ExplanationSelection | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentData = options.documentData || mockGovernmentDocument;
  const currentPageData = documentData.pages.find((p) => p.pageNumber === currentPage) || documentData.pages[0];

  const zoomIn = useCallback(() => setZoomLevel((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.2)), []);
  const zoomOut = useCallback(() => setZoomLevel((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.6)), []);
  const resetZoom = useCallback(() => setZoomLevel(1), []);
  const fitToScreen = useCallback(() => {
    const width = containerRef.current?.clientWidth;
    setZoomLevel(width ? Math.min(Math.max(Number(((width - 48) / 760).toFixed(2)), 0.65), 1.15) : 1);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen?.().catch(() => {}); setIsFullscreen(true); }
    else { document.exitFullscreen?.().catch(() => {}); setIsFullscreen(false); }
  }, []);
  useEffect(() => { const fn = () => setIsFullscreen(!!document.fullscreenElement); document.addEventListener('fullscreenchange', fn); return () => document.removeEventListener('fullscreenchange', fn); }, []);

  const selectField = useCallback(async (field: FormField, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedField(field);
    setActiveSelection({ type: 'field', title: field.text, explanation: field.explanation || 'Loading grounded explanation…', whatToEnter: field.whatToEnter || 'Loading…', source: field.source || 'Uploaded government form', exampleValue: field.exampleValue, commonMistake: field.commonMistake, position: { ...field.bbox } });
    const updated = await options.onFieldSelected?.(field);
    const finalField = updated || field;
    setSelectedField(finalField);
    setActiveSelection({ type: 'field', title: finalField.text, explanation: finalField.explanation || 'Not enough evidence to explain this field safely.', whatToEnter: finalField.whatToEnter || 'Not enough evidence to recommend an entry.', source: finalField.source || 'Uploaded government form', exampleValue: finalField.exampleValue, commonMistake: finalField.commonMistake, position: { ...finalField.bbox } });
  }, [options.onFieldSelected]);
  const clearSelection = useCallback(() => { setSelectedField(null); setActiveSelection(null); }, []);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {
    const selection = window.getSelection(); if (!selection || selection.isCollapsed || selection.toString().trim().length < 2) return;
    if (containerRef.current && containerRef.current.contains(selection.anchorNode)) {
      const text = selection.toString().trim(); const rect = selection.getRangeAt(0).getBoundingClientRect(); const cr = containerRef.current.getBoundingClientRect();
      setActiveSelection({ type: 'text', title: `Selected: "${text.slice(0, 25)}${text.length > 25 ? '…' : ''}"`, explanation: 'Text selection explanations are available for detected fields. Select a highlighted field for grounded guidance.', whatToEnter: 'Select a detected field to request a verified explanation.', source: 'Uploaded documents', position: { x: Math.max(5, Math.min(((rect.left - cr.left) / cr.width) * 100, 70)), y: Math.max(10, Math.min(((rect.top - cr.top) / cr.height) * 100, 80)), width: 20, height: 4 } });
      setSelectedField(null);
    }
  }, []);
  const copyExplanation = useCallback((text: string, key = 'explanation') => { navigator.clipboard?.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2400); }).catch(() => {}); }, []);
  useEffect(() => { const fn = (e: KeyboardEvent) => e.key === 'Escape' && clearSelection(); window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn); }, [clearSelection]);

  return { currentPage, setCurrentPage, totalPages: documentData.totalPages, currentPageData, zoomLevel, zoomIn, zoomOut, resetZoom, fitToScreen, isFullscreen, toggleFullscreen, selectedField, activeSelection, selectField, clearSelection, handleMouseUp, copyExplanation, copiedKey, containerRef, documentData };
}
