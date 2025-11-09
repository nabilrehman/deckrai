import React from 'react';
import { PersonalizationAction, TextReplacementAction, ImageReplacementAction } from '../types';

interface PersonalizationReviewModalProps {
    plan: PersonalizationAction[];
    originalImage: string;
    onAccept: (plan: PersonalizationAction[]) => void;
    onDiscard: () => void;
}

const TextIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 11-2 0V4H6a1 1 0 11-2 0V4zm5 3a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const ImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);

const PersonalizationReviewModal: React.FC<PersonalizationReviewModalProps> = ({ plan, originalImage, onAccept, onDiscard }) => {

    const renderAction = (action: PersonalizationAction, index: number) => {
        if (action.type === 'TEXT_REPLACEMENT') {
            const textAction = action as TextReplacementAction;
            return (
                <li key={index} className="flex items-start gap-4 p-3 bg-brand-background rounded-md">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mt-1">
                        <TextIcon />
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary">Replace text</p>
                        <p className="text-sm text-brand-text-tertiary line-through">"{textAction.originalText}"</p>
                        <p className="text-sm text-brand-text-primary font-medium">with "{textAction.newText}"</p>
                    </div>
                </li>
            );
        }
        if (action.type === 'IMAGE_REPLACEMENT') {
            const imageAction = action as ImageReplacementAction;
            return (
                 <li key={index} className="flex items-start gap-4 p-3 bg-brand-background rounded-md">
                     <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full mt-1">
                        <ImageIcon />
                    </div>
                    <div>
                        <p className="text-sm text-brand-text-secondary">Replace image: <span className="font-medium text-brand-text-primary">{imageAction.areaToReplace}</span></p>
                        <p className="text-sm text-brand-text-secondary">with a new image of: <span className="font-medium text-brand-text-primary">"{imageAction.replacementPrompt}"</span></p>
                    </div>
                </li>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-5xl border border-brand-border flex flex-col max-h-[95vh]">
                 <div className="p-6 border-b border-brand-border flex-shrink-0">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Review Personalization Plan</h2>
                    <p className="text-brand-text-secondary mt-1">The AI has proposed the following changes. Please review them before continuing.</p>
                </div>
                <div className="flex-grow flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
                    {/* Left side: Image with overlays */}
                    <div className="w-full md:w-2/3 flex-shrink-0 bg-brand-background rounded-lg border border-brand-border p-2">
                        <div className="relative w-full h-full">
                             <img src={originalImage} alt="Original slide" className="w-full h-full object-contain" />
                             {plan.map((action, index) => {
                                 const { x, y, width, height } = action.boundingBox;
                                 const isText = action.type === 'TEXT_REPLACEMENT';
                                 return (
                                    <div
                                        key={index}
                                        className={`absolute border-2 rounded-sm pointer-events-none animate-fade-in ${isText ? 'bg-blue-500/20 border-blue-500' : 'bg-purple-500/20 border-purple-500'}`}
                                        style={{
                                            left: `${x * 100}%`,
                                            top: `${y * 100}%`,
                                            width: `${width * 100}%`,
                                            height: `${height * 100}%`,
                                        }}
                                        title={isText ? `Replacing "${action.originalText}"` : `Replacing image of ${action.areaToReplace}`}
                                    />
                                 );
                             })}
                        </div>
                    </div>

                    {/* Right side: List of actions */}
                    <div className="w-full md:w-1/3 flex flex-col overflow-hidden">
                         <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-3 flex-shrink-0">Proposed Edits ({plan.length})</h3>
                         <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                             <ul className="space-y-3">
                                {plan.map(renderAction)}
                             </ul>
                         </div>
                    </div>
                </div>

                <div className="p-6 border-t border-brand-border bg-brand-surface flex justify-end items-center gap-4 flex-shrink-0">
                    <button onClick={onDiscard} className="btn btn-secondary">
                        Discard Plan
                    </button>
                    <button onClick={() => onAccept(plan)} className="btn btn-success text-base px-6 py-3">
                        Accept & Generate Variations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalizationReviewModal;