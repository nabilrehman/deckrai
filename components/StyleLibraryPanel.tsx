
import React, { useState, useCallback } from 'react';
import { StyleLibraryItem, DebugSession } from '../types';

declare const pdfjsLib: any;

interface StyleLibraryPanelProps {
  isVisible: boolean;
  library: StyleLibraryItem[];
  onRemove: (slideId: string) => void;
  onToggleVisibility: () => void;
  onLibraryUpload: (items: StyleLibraryItem[]) => void;
  sessionHistory: DebugSession[];
  onClearSessionHistory: () => void;
  onSelectSession: (session: DebugSession) => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChevronLeftIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);
const ChevronRightIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const StyleLibraryPanel: React.FC<StyleLibraryPanelProps> = ({ 
    isVisible, 
    library, 
    onRemove, 
    onToggleVisibility, 
    onLibraryUpload,
    sessionHistory,
    onClearSessionHistory,
    onSelectSession
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'style' | 'history'>('style');

  const handleFilesSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    const processPdf = async (file: File): Promise<StyleLibraryItem[]> => {
      const fileReader = new FileReader();
      return new Promise<StyleLibraryItem[]>((resolve, reject) => {
        fileReader.onload = async (event) => {
          try {
            const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const pagePromises: Promise<StyleLibraryItem | null>[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
              pagePromises.push((async (pageNum): Promise<StyleLibraryItem | null> => {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const context = canvas.getContext('2d');
                if (context) {
                  await page.render({ canvasContext: context, viewport }).promise;
                  const id = `${file.name}-p${pageNum}-${Date.now() + pageNum}`;
                  const src = canvas.toDataURL('image/png');
                  return { id, src, name: `${file.name.replace(/\.pdf$/i, '')} - Page ${pageNum}` };
                }
                return null;
              })(i));
            }
            const resolvedItems = await Promise.all(pagePromises);
            resolve(resolvedItems.filter((item): item is StyleLibraryItem => item !== null));
          } catch (err) {
            console.error("PDF processing error:", err);
            reject(new Error("Failed to process PDF file. It may be corrupted."));
          }
        };
        fileReader.readAsArrayBuffer(file);
      });
    };

    const processImage = (file: File): Promise<StyleLibraryItem[]> => {
      return new Promise<StyleLibraryItem[]>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          const id = `${file.name}-${Date.now()}`;
          resolve([{ id, src, name: file.name.split('.')[0] }]);
        };
        reader.readAsDataURL(file);
      });
    };

    const filePromises: Promise<StyleLibraryItem[]>[] = [];
    for (const file of Array.from(files) as File[]) {
      if (file.type === 'application/pdf') {
        filePromises.push(processPdf(file));
      } else if (file.type.startsWith('image/')) {
        filePromises.push(processImage(file));
      }
    }

    try {
      const itemArrays = await Promise.all(filePromises);
      const newLibraryItems = itemArrays.flat();

      if (newLibraryItems.length > 0) {
        onLibraryUpload(newLibraryItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
      } else if (filePromises.length > 0) {
        setError("No valid image or PDF files were selected.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  }, [onLibraryUpload]);


  const renderStyleLibrary = () => (
    <>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {isLoading ? (
            <div className="text-center text-brand-text-secondary pt-10">
                <Spinner />
                <p className="mt-4 text-sm">Processing...</p>
            </div>
        ) : library.length === 0 ? (
          <div className="text-center text-brand-text-tertiary pt-10 px-4">
            <p className="text-sm">Your style library is empty.</p>
            <p className="text-xs mt-2">Add slides to your library to use them as a style reference for new creations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {library.map(item => (
              <div key={item.id} className="group relative">
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden border border-brand-border">
                  <img src={item.src} alt={item.name} className="w-full h-full object-cover"/>
                </div>
                <p className="text-xs text-brand-text-secondary mt-1 truncate" title={item.name}>{item.name}</p>
                <button 
                    onClick={() => onRemove(item.id)}
                    className="absolute top-1 right-1 bg-white/80 text-brand-text-tertiary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    title="Remove from library"
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-brand-border flex-shrink-0">
          {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
          <label 
              htmlFor="style-library-upload" 
              className={`cursor-pointer w-full inline-block text-center px-4 py-2.5 text-sm font-semibold text-brand-primary bg-brand-primary-light rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-primary hover:text-white'}`}
          >
              {isLoading ? 'Processing...' : 'Import Styles'}
          </label>
          <input 
              id="style-library-upload" 
              type="file" 
              className="sr-only" 
              multiple 
              accept="application/pdf,image/*" 
              onChange={handleFilesSelected}
              disabled={isLoading}
          />
      </div>
    </>
  );

  const renderSessionHistory = () => (
    <>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          {sessionHistory.length === 0 ? (
              <div className="text-center text-brand-text-tertiary pt-10 px-4">
                  <p className="text-sm">No debug sessions recorded yet.</p>
                  <p className="text-xs mt-2">Run an AI generation task to see its detailed log here.</p>
              </div>
          ) : (
              <ul className="space-y-2">
                  {sessionHistory.map(session => (
                      <li
                          key={session.id}
                          onClick={() => onSelectSession(session)}
                          className="bg-brand-background p-2.5 rounded-lg border border-brand-border hover:border-brand-primary cursor-pointer transition-colors"
                      >
                          <div className="flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-xs text-brand-text-primary truncate pr-2" title={session.initialPrompt}>{session.initialPrompt}</p>
                                  <p className="text-xs text-brand-text-tertiary mt-1">
                                      {session.workflow}
                                  </p>
                              </div>
                              <div className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                  session.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                  {session.status}
                              </div>
                          </div>
                      </li>
                  ))}
              </ul>
          )}
      </div>
      <div className="mt-4 pt-4 border-t border-brand-border flex-shrink-0">
          <button
              onClick={onClearSessionHistory}
              disabled={sessionHistory.length === 0}
              className="w-full text-center px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-100"
          >
              Clear History
          </button>
      </div>
    </>
  );


  return (
    <>
      <div 
        className={`absolute top-1/2 -right-0 transform -translate-y-1/2 z-30 bg-brand-surface p-2 rounded-l-lg cursor-pointer hover:bg-gray-100 transition-colors border-l border-t border-b border-brand-border shadow-md ${isVisible ? 'hidden' : 'block'}`}
        onClick={onToggleVisibility}
      >
        <ChevronLeftIcon />
      </div>
      <aside 
        className={`flex flex-col flex-shrink-0 bg-brand-surface border-l border-brand-border transition-all duration-300 z-40 ${
          isVisible ? 'w-80' : 'w-0'
        }`}
      >
        <div className={`p-4 flex flex-col flex-grow overflow-hidden transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-brand-text-primary">
                {activeTab === 'style' ? 'Style Library' : 'Session History'}
            </h3>
            <button onClick={onToggleVisibility} className="text-brand-text-tertiary hover:text-brand-text-primary">
              <ChevronRightIcon />
            </button>
          </div>
          
          <div className="flex-shrink-0 mb-4 border-b border-brand-border">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                  <button onClick={() => setActiveTab('style')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'style' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-300'}`}>
                    Style Library
                  </button>
                  <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-gray-300'}`}>
                    History
                  </button>
              </nav>
          </div>

          {activeTab === 'style' ? renderStyleLibrary() : renderSessionHistory()}
          
        </div>
      </aside>
    </>
  );
};

export default StyleLibraryPanel;
