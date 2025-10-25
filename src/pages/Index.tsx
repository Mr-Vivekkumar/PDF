import { useState } from 'react';
import PDFViewer from '@/components/PDFViewer';
import AnalysisPanel from '@/components/AnalysisPanel';
import { FileText } from 'lucide-react';

const Index = () => {
  const [activeReference, setActiveReference] = useState<number | null>(null);

  const handleReferenceClick = (refNumber: number) => {
    setActiveReference(prevRef => prevRef === refNumber ? null : refNumber);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content - Split View */}
      <div className=" flex overflow-hidden">
        {/* Left Panel - PDF Viewer */}
        <div className="w-full border-r border-[hsl(var(--panel-border))]">
          <PDFViewer activeReference={activeReference} />
        </div>

        {/* Right Panel - Analysis */}
        <div className="w-1/2">
          <AnalysisPanel 
            onReferenceClick={handleReferenceClick} 
            activeReference={activeReference}
          />
        </div>
      </div>

     
    </div>
  );
};

export default Index;
