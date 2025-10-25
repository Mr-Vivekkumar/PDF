import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface AnalysisPanelProps {
  onReferenceClick: (refNumber: number) => void;
  activeReference: number | null;
}


const AnalysisPanel = ({ onReferenceClick, activeReference }: AnalysisPanelProps) => {
  // draggable / resizable state
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ w: 760, h: 0 });
  const posStart = useRef({ x: 0, y: 50 });


  // default width; height will be derived from viewport
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ w: 760, h: 600 });


  // search state
  const [query, setQuery] = useState('');


  // initialize position to right side and height to viewport-based value
  useEffect(() => {
    const setInitial = () => {
      const vh = window.innerHeight;
      const initialH = Math.max(300, vh - 80); // fixed relative to viewport
      const initialW = size.w;
      const rightX = Math.max(window.innerWidth - initialW - 20, Math.floor(window.innerWidth / 2));
      setSize(s => ({ ...s, h: initialH }));
      setPos({ x: rightX, y: 20 });
    };
    setInitial();
    const onResize = () => {
      const vh = window.innerHeight;
      setSize(s => ({ ...s, h: Math.max(300, vh - 120) }));
      // keep panel on right half when resizing window
      setPos(p => ({ x: Math.max(p.x, Math.floor(window.innerWidth / 2)), y: p.y }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (dragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const rawX = posStart.current.x + dx;
        // enforce panel stays on right half (user requested: not go to left)
        const minX = Math.floor(window.innerWidth / 2);
        const clampedX = Math.max(minX, Math.min(rawX, window.innerWidth - 120));
        const rawY = Math.max(10, posStart.current.y + dy);
        setPos({
          x: clampedX,
          y: rawY,
        });
      } else if (resizing.current) {
        // only resize width (height fixed to viewport)
        const dx = e.clientX - dragStart.current.x;
        setSize({
          w: Math.max(320, sizeStart.current.w + dx),
          h: sizeStart.current.h, // keep height fixed
        });
        // keep panel within right half after resize
        setPos(p => ({ ...p, x: Math.max(Math.floor(window.innerWidth / 2), Math.min(p.x, window.innerWidth - (sizeStart.current.w + dx) - 20)) }));
      }
    };


    const onPointerUp = () => {
      dragging.current = false;
      resizing.current = false;
    };


    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const startDrag = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { x: pos.x, y: pos.y };
  };


  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    resizing.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { w: size.w, h: size.h };
  };


  // Reference component: square brackets, yellow text, transparent bg
  const Reference = ({ num }: { num: number }) => (
    <button
      onClick={() => onReferenceClick(num)}
      aria-label={`Reference ${num}`}
      className={`inline-flex items-center justify-center px-1 text-xs font-semibold transition-all duration-150 cursor-pointer select-none
        text-yellow-400 hover:brightness-110`}
      style={{ background: 'transparent', border: 'none' }}
    >
      [{num}]
    </button>
  );


  // dispatch a custom event that the PDF viewer can listen to and highlight matches in yellow
  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    console.log('[AnalysisPanel] dispatch pdf-search ->', q); // debug
    window.dispatchEvent(new CustomEvent('pdf-search', { detail: { query: q } }));
  };


  return (
    <div
      ref={panelRef}
      // position and sizing for drag/resize
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 40,
      }}
      className="flex flex-col bg-black text-white shadow-lg rounded-md overflow-hidden bg-gradient-to-b from-black via-neutral-900 to-neutral-800 border border-white/10 mt-14"
    >
      {/* draggable header */}
      <div
        onPointerDown={startDrag}
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 cursor-move"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Analysis</h1>
          <Badge variant="secondary" className="font-semibold bg-neutral-800 text-white">
            Q2 2025
          </Badge>
        </div>
        {/* <div className="text-sm text-white/70">Drag to move • Resize from corner</div> */}
      </div>


      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 relative">
        <Card className="p-6 space-y-6 bg-transparent border-none">
          {/* Main Analysis */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Executive Summary</h2>
            <p className="text-base leading-relaxed text-white/90">
              No extraordinary or one-off items affecting EBITDA were reported in Maersk's Q2 2025 results.{' '}
              The report explicitly notes that EBITDA improvements stemmed from operational performance—including
              volume growth, cost control, and margin improvement across Ocean, Logistics & Services, and
              Terminals segments <Reference num={1} /> <Reference num={2} />. Gains or losses from asset sales,
              which could qualify as extraordinary items, are shown separately under EBIT and not included in EBITDA.
              The gain on sale of non-current assets was USD 25m in Q2 2025, significantly lower than USD 208m
              in Q2 2024, but these affect EBIT, not EBITDA <Reference num={3} />. Hence, Q2 2025 EBITDA reflects
              core operating activities without one-off extraordinary adjustments.
            </p>
          </div>


          {/* Findings */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Key Findings</h2>


            <div className="space-y-4">
              <Card className="p-4 bg-transparent border-l-4 border-l-primary">
                <div className="flex items-start gap-3">
                  <Reference num={1} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">
                      <span className="text-blue-400">Page 3</span> — Highlights Q2 2025
                    </h3>
                    <p className="text-sm text-white/90">
                      EBITDA increase (USD 2.3bn vs USD 2.1bn prior year) attributed to operational improvements;
                      no mention of extraordinary or one-off items.
                    </p>
                  </div>
                </div>
              </Card>


              <Card className="p-4 bg-transparent border-l-4 border-l-primary">
                <div className="flex items-start gap-3">
                  <Reference num={2} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">
                      <span className="text-blue-400">Page 5</span> — Review Q2 2025
                    </h3>
                    <p className="text-sm text-white/90">
                      EBITDA rise driven by higher revenue and cost control across all segments; no extraordinary
                      gains or losses included.
                    </p>
                  </div>
                </div>
              </Card>


              <Card className="p-4 bg-transparent border-l-4 border-l-highlight">
                <div className="flex items-start gap-3">
                  <Reference num={3} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">
                      <span className="text-blue-400">Page 15</span> — Condensed Income Statement
                    </h3>
                    <p className="text-sm text-white/90">
                      <span className="font-semibold">Gain on sale of non-current assets</span> USD 25m
                      (vs USD 208m prior year) reported separately below EBITDA; therefore, not part of EBITDA.
                    </p>
                    {activeReference === 3 && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-md border border-yellow-500">
                        <p className="text-xs font-medium text-yellow-400">
                          💡 Click reference [3] highlights this line item in the PDF
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>


        {/* bottom sticky search box inside the scrollable content */}
        <form
          onSubmit={submitSearch}
          className="sticky -mb-4 bottom-0 mt-6"
          style={{ zIndex: 1 }}
          aria-label="PDF search"
        >
          <span className='w-full bg-gradient-to-t from-black via-neutral-900 to-neutral-800 px-4 py-6 block overflow-visible '>
            <div className="flex gap-2 items-center w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search PDF and highlight..."
              className="w-full h-10  px-3 rounded-md bg-white/5 text-white text-sm border border-white/10 focus:outline-none"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)' }}
            />
            <button
              type="submit"
              className="h-10 px-3 rounded-md bg-yellow-400 text-black font-semibold text-sm"
            >
              Search
            </button>
          </div>
          </span>
        </form>
      </div>


      {/* resize handle (horizontal only) */}
      <div
        onPointerDown={startResize}
        className="absolute right-2 bottom-2 w-4 h-4 cursor-ew-resize rounded-sm bg-white/10"
        title="Resize"
      />
    </div>
  );
};


export default AnalysisPanel;
