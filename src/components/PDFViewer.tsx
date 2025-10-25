import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  activeReference: number | null;
}

// Helpers to highlight matching text on the text layer
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function renderHighlighted(str: string, patterns: (RegExp | string)[], searchQuery: string) {
  const allPatterns = [...patterns];

  // Add search query to patterns if it exists
  if (searchQuery && searchQuery.trim()) {
    allPatterns.push(escapeRegExp(searchQuery.trim()));
  }

  if (!allPatterns.length) return str;

  const sources = allPatterns.map((p) => (p instanceof RegExp ? p.source : escapeRegExp(p)));
  const regex = new RegExp(`(${sources.join('|')})`, 'gi');

  const parts = str.split(regex);
  if (parts.length === 1) return str;

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400 text-black rounded-[2px] px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const getActivePatterns = (ref: number | null, page: number) => {
  const map: Record<number, { page: number; patterns: (RegExp | string)[] }> = {
    1: { page: 3, patterns: [/Highlights\s*Q2\s*2025/i, /EBITDA/i] },
    2: { page: 5, patterns: [/Review\s*Q2\s*2025/i, /EBITDA/i] },
    3: { page: 15, patterns: [/Gain on sale of non-current assets/i, /Gain on sale/i] },
  };
  const cfg = ref ? map[ref] : undefined;
  return cfg && cfg.page === page ? cfg.patterns : [];
};

const PDFViewer = ({ activeReference }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(15); // Start at page 15 (Condensed Income Statement)
  const [scale, setScale] = useState<number>(1.5);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  useEffect(() => {
    if (activeReference === 1) {
      // Navigate to page 3 - Highlights Q2 2025
      setPageNumber(3);
    } else if (activeReference === 2) {
      // Navigate to page 5 - Review Q2 2025
      setPageNumber(5);
    } else if (activeReference === 3) {
      // Navigate to page 15 - Condensed Income Statement
      setPageNumber(15);
    }
  }, [activeReference]);

  // Listen to search event from AnalysisPanel
  useEffect(() => {
    const handleSearch = (e: Event) => {
      const ce = e as CustomEvent;
      const query = ce.detail?.query || '';
      // debug
      console.log('[PDFViewer] pdf-search received ->', query);
      setSearchQuery(query);
    };

    window.addEventListener('pdf-search', handleSearch as EventListener);
    return () => {
      window.removeEventListener('pdf-search', handleSearch as EventListener);
    };
  }, []);

  const patterns = getActivePatterns(activeReference, pageNumber);

  // ---------- DOM-based highlighting helpers ----------
  const clearHighlights = (root: HTMLElement | null) => {
    if (!root) return;
    const marks = root.querySelectorAll('mark.cm-pdf-highlight');
    marks.forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent || ''), m);
      parent.normalize();
    });
  };

  const highlightInRoot = (root: HTMLElement | null, query: string) => {
    if (!root || !query) return;
    const textLayer = root.querySelector('.react-pdf__Page__textContent') as HTMLElement | null;
    if (!textLayer) return;

    const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT, null);
    const needle = query.toLowerCase();
    const nodesToProcess: Text[] = [];

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim()) {
        nodesToProcess.push(node as Text);
      }
      node = walker.nextNode();
    }

    nodesToProcess.forEach((textNode) => {
      let txt = textNode.nodeValue || '';
      let lower = txt.toLowerCase();
      let idx = lower.indexOf(needle);
      // handle multiple occurrences within same text node
      while (idx !== -1) {
        const range = document.createRange();
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + needle.length);

        const mark = document.createElement('mark');
        mark.className = 'cm-pdf-highlight';
        mark.style.background = '#f6e05e';
        mark.style.color = '#000';
        mark.style.borderRadius = '2px';
        mark.style.padding = '0 2px';

        try {
          range.surroundContents(mark);
        } catch (err) {
          // surroundContents can fail if range splits elements; skip gracefully
          console.warn('surroundContents failed for range', err);
        }

        // after surrounding, advance: next text node likely after mark
        if (mark.nextSibling && mark.nextSibling.nodeType === Node.TEXT_NODE) {
          textNode = mark.nextSibling as Text;
          txt = textNode.nodeValue || '';
          lower = txt.toLowerCase();
          idx = lower.indexOf(needle);
        } else {
          break;
        }
      }
    });
  };
  // ----------------------------------------------------

  // Apply highlights whenever searchQuery or pageNumber changes
  useEffect(() => {
    const root = containerRef.current;
    clearHighlights(root);

    if (!searchQuery || !searchQuery.trim()) {
      console.log('[PDFViewer] no query -> cleared highlights');
      return;
    }

    // text layer may arrive slightly after render; attempt multiple times
    let attempts = 0;
    const tryHighlight = () => {
      attempts += 1;
      highlightInRoot(root, searchQuery.trim());
      const any = root?.querySelector('mark.cm-pdf-highlight');
      console.log('[PDFViewer] highlight attempt', attempts, 'found?', !!any);
      if (!any && attempts < 6) {
        setTimeout(tryHighlight, 120);
      }
    };

    setTimeout(tryHighlight, 60);

    return () => {
      // cleanup
      setTimeout(() => clearHighlights(root), 20);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pageNumber]);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--pdf-bg))]">
      {/* PDF Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-[hsl(var(--panel-border))]">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-center">
          <div ref={containerRef} className="relative bg-white shadow-lg">
            <Document
              file="/Maersk_Q2_2025_Interim_Report.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-[800px] w-[600px] bg-white">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                // @ts-expect-error - react-pdf customTextRenderer types are permissive
                customTextRenderer={({ str }: { str: string }) => renderHighlighted(str, patterns, searchQuery)}
              />
            </Document>

            {/* Positional highlight overlays */}
            {activeReference === 3 && pageNumber === 15 && (
              <div
                className="absolute bg-highlight/40 border-2 border-highlight animate-pulse"
                style={{
                  top: `36%`,
                  left: `8%`,
                  width: `19%`,
                  height: `2.5%`,
                  transition: 'all 0.3s ease-in-out',
                  pointerEvents: 'none',
                }}
              />
            )}
            {activeReference === 2 && pageNumber === 5 && (
              <div
                className="absolute bg-highlight/40 border-2 border-highlight animate-pulse"
                style={{
                  top: `45%`,
                  left: `7%`,
                  width: `42%`,
                  height: `4.5%`,
                  transition: 'all 0.3s ease-in-out',
                  pointerEvents: 'none',
                }}
              />
            )}
            {activeReference === 1 && pageNumber === 3 && (
              <div
                className="absolute bg-highlight/40 border-2 border-highlight animate-pulse"
                style={{
                  top: `18%`,
                  left: `7%`,
                  width: `42%`,
                  height: `4.8%`,
                  transition: 'all 0.3s ease-in-out',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;