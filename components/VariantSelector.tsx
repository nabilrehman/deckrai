import React, { useState } from 'react';

interface VariantSelectorProps {
    variantsData: {
        images: string[];
        prompts: string[];
    };
    onSelect: (variantSrc: string, variantIndex: number) => void;
    onCancel: () => void;
    onRegenerate: () => void;
    isDebugMode: boolean;
}

const InspectIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.414l2.26-2.26a4 4 0 10-1.414-7.446zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const VariantSelector: React.FC<VariantSelectorProps> = ({ variantsData, onSelect, onCancel, onRegenerate, isDebugMode }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [debuggedVariant, setDebuggedVariant] = useState<{ image: string, prompt: string } | null>(null);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-brand-surface rounded-2xl shadow-2xl w-full max-w-5xl p-6 md:p-8 border border-brand-border flex flex-col">
                <h2 className="text-2xl font-bold text-center mb-2 text-brand-text-primary">Choose Your Favorite</h2>
                <p className="text-center text-brand-text-secondary mb-6">Select the version you like best, or regenerate to get new options.</p>

                <div className="w-full aspect-video bg-brand-background rounded-lg mb-6 flex items-center justify-center overflow-hidden border border-brand-border">
                    <img src={variantsData.images[activeIndex]} alt={`Selected Variant ${activeIndex + 1}`} className="w-full h-full object-contain" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {variantsData.images.map((src, index) => (
                        <div 
                            key={index} 
                            className={`group cursor-pointer aspect-video bg-brand-background rounded-lg overflow-hidden relative transition-all duration-200 border ${
                                activeIndex === index ? 'ring-4 ring-brand-primary border-brand-primary' : 'border-brand-border hover:border-brand-primary'
                            }`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <img src={src} alt={`Variant ${index + 1}`} className="w-full h-full object-contain" />
                             <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                                 activeIndex === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                             }`}>
                                <p className="text-white font-semibold text-lg">View Version {index + 1}</p>
                            </div>
                            {isDebugMode && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDebuggedVariant({ image: src, prompt: variantsData.prompts[index] });
                                    }}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-brand-primary transition-colors"
                                    title="Inspect Variation Prompt"
                                >
                                    <InspectIcon />
                                </button>
                            )}
                        </div>
                    ))}
                </div>


                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        Cancel
                    </button>
                     <button
                        onClick={() => onSelect(variantsData.images[activeIndex], activeIndex)}
                        className="btn btn-primary text-base px-8 py-3 order-first sm:order-none w-full sm:w-auto"
                    >
                        Select this Version
                    </button>
                    <button
                        onClick={onRegenerate}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        Regenerate
                    </button>
                </div>
            </div>

            {debuggedVariant && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setDebuggedVariant(null)}>
                    <div className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] border border-brand-border flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-brand-border flex-shrink-0">
                            <h3 className="text-xl font-bold text-brand-text-primary">Variation Inspector</h3>
                            <button onClick={() => setDebuggedVariant(null)} className="text-brand-text-tertiary hover:text-brand-text-primary transition-colors">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
                            <div className="w-full md:w-1/2 flex items-center justify-center bg-brand-background rounded-md flex-shrink-0 p-2 border border-brand-border">
                                <img src={debuggedVariant.image} className="max-w-full max-h-full object-contain" alt="Inspected variation" />
                            </div>
                            <div className="w-full md:w-1/2 flex flex-col">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-primary mb-2 flex-shrink-0">Prompt Used to Generate this Variation:</h4>
                                <div className="bg-brand-background p-4 rounded-md flex-grow overflow-y-auto border border-brand-border">
                                    <pre className="text-sm text-brand-text-secondary whitespace-pre-wrap break-words font-mono">
                                        <code>{debuggedVariant.prompt}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantSelector;