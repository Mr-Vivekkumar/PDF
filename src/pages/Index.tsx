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
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Maersk Financial Analysis</h1>
              <p className="text-sm text-primary-foreground/80">
                Interactive Document Viewer & Analysis Platform
              </p>
            </div>
          </div>
        </div>
      </header>

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
