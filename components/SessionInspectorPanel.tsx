
import React, { useState, useCallback } from 'react';
import { DebugSession } from '../types';
import { analyzeDebugSession } from '../services/geminiService';

interface SessionInspectorPanelProps {
  session: DebugSession | null;
  onClose: () => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ImagePlaceholder: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full h-full object-contain rounded-md border border-brand-border bg-brand-background flex items-center justify-center">
        <p className="text-xs text-brand-text-tertiary text-center p-2">{text}</p>
    </div>
);


const VisualPipelineInspector: React.FC<{ session: DebugSession; onClose: () => void; }> = ({ session, onClose }) => {
    const artDirectorLog = (session.logs || []).find(log => log.title === "Art Director: Extracted Content Blueprint (JSON)")?.content;
    const designerInputLog = (session.logs || []).find(log => log.title === "Designer Input")?.content;
    
    let briefingContent = "No blueprint found.";
    if(session.workflow === 'Create New Slide') {
        briefingContent = `The AI Designer was given the high-level prompt:\n\n"${session.initialPrompt}"`;
    } else if (artDirectorLog) {
        briefingContent = artDirectorLog;
    } else if (designerInputLog) {
        briefingContent = designerInputLog;
    }

    const showArtDirectorBriefing = session.workflow !== 'Create New Slide';


    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center flex-shrink-0 mb-4">
                <h2 className="text-2xl font-bold text-white">Visual Pipeline Inspector</h2>
                 <button onClick={onClose} className="px-4 py-2 text-sm text-white bg-black/50 rounded-lg hover:bg-black/80">
                    Close
                </button>
            </div>
            <div className="flex-grow overflow-auto p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-brand-surface rounded-lg p-3 border border-brand-border flex flex-col">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2">
                            {session.workflow === 'Create New Slide' ? '1. User Intent' : '1. Initial Input'}
                        </h3>
                        {session.initialImage ? (
                            <img src={session.initialImage} className="w-full h-auto object-contain rounded-md border border-brand-border mb-2"/>
                        ): (
                            <div className="flex-grow flex items-center justify-center">
                                <ImagePlaceholder text="No initial image for this workflow." />
                            </div>
                        )}
                        <p className="text-xs text-brand-text-secondary mt-1 flex-grow"><strong>Prompt:</strong> {session.initialPrompt}</p>
                    </div>

                    <div className="bg-brand-surface rounded-lg p-3 border border-brand-border flex flex-col">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2">2. Style Scout Selection</h3>
                        {session.styleReferenceImage ? (
                            <img src={session.styleReferenceImage} className="w-full h-auto object-contain rounded-md border border-brand-border"/>
                        ) : (
                             <div className="flex-grow flex items-center justify-center text-brand-text-tertiary text-sm">
                                <ImagePlaceholder text="Reference image not available for this session." />
                            </div>
                        )}
                        <p className="text-xs text-brand-text-secondary mt-2 flex-grow">{(session.logs || []).find(l => l.title.includes("Style Scout") && l.content.includes("best matching"))?.content}</p>
                    </div>

                    { showArtDirectorBriefing && (
                         <div className="bg-brand-surface rounded-lg p-3 border border-brand-border flex flex-col">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2">3. Art Director Briefing</h3>
                            <div className="bg-brand-background p-2 rounded-md flex-grow overflow-y-auto border border-brand-border">
                                <pre className="text-xs text-brand-text-secondary whitespace-pre-wrap break-words font-mono">
                                    <code>{briefingContent}</code>
                                </pre>
                            </div>
                        </div>
                    )}

                    <div className={`bg-brand-surface rounded-lg p-3 border border-brand-border flex flex-col ${!showArtDirectorBriefing ? 'lg:col-start-4' : ''}`}>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2">4. Final Output ({(session.finalImages || []).length})</h3>
                        <div className="flex-grow grid grid-cols-2 gap-2">
                             {(session.finalImages || []).length > 0 ? (
                                (session.finalImages || []).map((img, i) => (
                                    <img key={i} src={img} className="w-full h-auto object-contain rounded-md border border-brand-border"/>
                                ))
                             ) : (
                                <div className="col-span-2">
                                    <ImagePlaceholder text="No final images were generated or saved." />
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SessionDetailView: React.FC<{ session: DebugSession; onClose: () => void; }> = ({ session, onClose }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPipeline, setShowPipeline] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        try {
            const result = await analyzeDebugSession(session);
            setAnalysis(result);
        } catch (e: any) {
            setAnalysis(`Error during analysis: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (showPipeline) {
        return <VisualPipelineInspector session={session} onClose={() => setShowPipeline(false)} />;
    }

    const logs = session.logs || [];
    const finalImages = session.finalImages || [];

    return (
        <div className="flex flex-col h-full bg-brand-surface">
            <div className="p-4 border-b border-brand-border flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-brand-text-primary">Session Details</h3>
                        <p className="text-xs text-brand-text-tertiary">{session.id}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {(session.workflow === 'Remake' || session.workflow === 'Create New Slide') && (
                            <button onClick={() => setShowPipeline(true)} className="px-4 py-2 text-sm font-semibold text-white bg-brand-accent rounded-lg hover:opacity-90">
                            View Visual Pipeline
                            </button>
                        )}
                         <button onClick={onClose} className="text-brand-text-tertiary hover:text-brand-text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto bg-brand-background/70">
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border">
                        <span className="text-xs text-brand-text-secondary block">Status</span>
                        <span className={`font-semibold ${session.status === 'Success' ? 'text-green-600' : 'text-red-600'}`}>
                            {session.status}
                        </span>
                    </div>
                     <div className="bg-brand-surface p-3 rounded-lg border border-brand-border">
                        <span className="text-xs text-brand-text-secondary block">Workflow</span>
                        <span className="font-semibold text-brand-text-primary">{session.workflow}</span>
                    </div>
                     <div className="bg-brand-surface p-3 rounded-lg border border-brand-border">
                        <span className="text-xs text-brand-text-secondary block">Timestamp</span>
                        <span className="font-semibold text-brand-text-primary">{new Date(session.timestamp).toLocaleString()}</span>
                    </div>
                </div>

                {session.error && (
                    <div className="mb-4">
                         <h4 className="text-sm font-semibold text-red-600 mb-2">Error Message</h4>
                         <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                             <p className="text-sm text-red-800 font-mono">{session.error}</p>
                         </div>
                    </div>
                )}
                
                {session.status === 'Failed' && (
                     <div className="mb-4">
                        <h4 className="text-sm font-semibold text-amber-600 mb-2">AI Debug Analysis</h4>
                        <div className="bg-brand-surface p-3 rounded-lg border border-brand-border">
                            {isAnalyzing ? (
                                <div className="flex items-center text-brand-text-secondary">
                                    <Spinner />
                                    <span className="ml-2">Debug Analyst is thinking...</span>
                                </div>
                            ) : analysis ? (
                                <div className="prose prose-sm text-brand-text-secondary" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}/>
                            ) : (
                                <button onClick={handleAnalyze} className="text-sm text-amber-600 hover:text-amber-700 font-semibold">
                                    Click here to get an AI-powered analysis of this failure
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-brand-primary mb-2">Input & Output</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <p className="text-xs text-center text-brand-text-secondary mb-1">Initial Image</p>
                             {session.initialImage ? (
                                <img src={session.initialImage} className="w-full h-auto object-contain rounded-md border border-brand-border"/>
                             ) : (
                                <ImagePlaceholder text="Initial image not available for this session." />
                             )}
                        </div>
                         <div>
                             <p className="text-xs text-center text-brand-text-secondary mb-1">Final Images ({finalImages.length})</p>
                             <div className="grid grid-cols-2 gap-2">
                                {finalImages.length > 0 ? (
                                    finalImages.map((img, i) => (
                                        <img key={i} src={img} className="w-full h-auto object-contain rounded-md border border-brand-border"/>
                                    ))
                                ) : (
                                    <div className="col-span-2">
                                         <ImagePlaceholder text="No final images were generated or saved." />
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-brand-primary mb-2">Full Log Transcript</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto p-2 bg-brand-surface rounded-lg border border-brand-border">
                        {logs.map((log, index) => (
                            <div key={index} className="bg-brand-background rounded-md">
                                <h5 className="text-xs font-semibold text-brand-primary px-3 py-1.5 bg-brand-primary-light rounded-t-md">{log.title}</h5>
                                <pre className="text-xs text-brand-text-secondary p-3 whitespace-pre-wrap break-words font-mono">
                                    <code>{log.content}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


const SessionInspectorPanel: React.FC<SessionInspectorPanelProps> = ({ session, onClose }) => {
    if (!session) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end animate-fade-in">
            <div 
                className="absolute inset-0"
                onClick={onClose}
            ></div>
            <div 
                className="w-full max-w-4xl h-full bg-brand-surface border-l border-brand-border shadow-2xl flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <SessionDetailView session={session} onClose={onClose} />
            </div>
        </div>
    );
};

export default SessionInspectorPanel;
