

import React from 'react';
import { Slide } from '../types';

interface SlidePreviewListProps {
  slides: Slide[];
  activeSlideId: string;
  onSlideSelect: (id: string) => void;
  personalizingSlideIds: string[];
  onAddSlideAfter: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
}

const AddSlideButton: React.FC<{ onClick: () => void, isTop?: boolean }> = ({ onClick, isTop = false }) => {
    if (isTop) {
        return (
             <div className="p-3">
                <button
                    onClick={onClick}
                    className="bg-gradient-brand w-full"
                    aria-label="Add new slide"
                    style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all var(--transition-fast)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Slide
                </button>
             </div>
        )
    }

    return (
        <div className="relative h-2 flex items-center justify-center my-2 group px-3">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-border to-transparent group-hover:via-brand-primary-300 transition-all duration-300"></div>
            <button
                onClick={onClick}
                className="absolute z-10 w-7 h-7 bg-white border-2 border-brand-primary-500 rounded-full flex items-center justify-center text-brand-primary-500 text-lg font-bold
                           opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 ease-out
                           shadow-premium hover:shadow-btn hover:bg-brand-primary-500 hover:text-white"
                aria-label="Add new slide here"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};


const SlidePreviewList: React.FC<SlidePreviewListProps> = ({ slides, activeSlideId, onSlideSelect, personalizingSlideIds, onAddSlideAfter, onDeleteSlide }) => {
  return (
    <aside className="w-72 glass border-r border-brand-border/50 flex-shrink-0 flex flex-col shadow-glass">
      <div className="flex-shrink-0 border-b border-brand-border/30 bg-white/50">
          <AddSlideButton onClick={() => onAddSlideAfter('START')} isTop={true} />
      </div>
      <div className="flex-grow overflow-y-auto p-3">
        <div className="space-y-2">
            {slides.map((slide, index) => {
            const isPersonalizing = personalizingSlideIds.includes(slide.id);
            const hasPendingVariations = slide.pendingPersonalization && slide.pendingPersonalization.variations.length > 0;
            const isActive = slide.id === activeSlideId;

            return (
                <React.Fragment key={slide.id}>
                <div
                    onClick={() => onSlideSelect(slide.id)}
                    className={`group relative cursor-pointer rounded-2xl p-3 border-2 transition-all duration-300 ${
                    isActive
                        ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium scale-105'
                        : 'border-brand-border/50 hover:border-brand-primary-300 hover:shadow-card card-hover bg-white/80'
                    }`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            isActive
                                ? 'bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white shadow-md'
                                : 'bg-brand-background text-brand-text-tertiary group-hover:bg-brand-primary-100 group-hover:text-brand-primary-500'
                        }`}>
                            {index + 1}
                        </div>
                        <div className={`aspect-video bg-white rounded-xl overflow-hidden w-full relative border-2 transition-all ${
                            isActive ? 'border-brand-primary-300' : 'border-brand-border/30'
                        }`}>
                            <img src={slide.history[slide.history.length - 1]} alt={slide.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                            {isPersonalizing && (
                                <div className="absolute inset-0 glass-dark flex flex-col items-center justify-center text-white p-2 text-center backdrop-blur-md">
                                    <span role="img" aria-label="Processing" className="text-4xl animate-pulse">✨</span>
                                    <span className="text-xs font-medium mt-2">Processing...</span>
                                </div>
                            )}
                            {hasPendingVariations && !isPersonalizing && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full p-1.5 shadow-lg animate-pulse" title="Variations are ready for this slide!">
                                    <span role="img" aria-label="Variations ready" className="text-base">🌟</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${slide.name}"?`)) {
                                onDeleteSlide(slide.id);
                            }
                        }}
                        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white text-red-400 rounded-full flex items-center justify-center
                                   opacity-0 group-hover:opacity-100 transition-all duration-300
                                   hover:bg-red-500 hover:text-white scale-0 group-hover:scale-100 shadow-md border-2 border-white"
                        title="Delete Slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <AddSlideButton onClick={() => onAddSlideAfter(slide.id)} />
                </React.Fragment>
            )
            })}
        </div>
      </div>
    </aside>
  );
};

export default SlidePreviewList;