import React, { useState } from 'react';
import { Slide, StyleLibraryItem } from '../types';
import DeckUploader from './DeckUploader';
import SmartDeckGenerator from './SmartDeckGenerator';

interface GenerationModeSelectorProps {
  onDeckUpload: (slides: Slide[]) => void;
  styleLibrary: StyleLibraryItem[];
  isTestMode: boolean;
  onLibraryUpload?: (items: StyleLibraryItem[]) => void;
}

type GenerationMode = 'smart' | 'classic';

const GenerationModeSelector: React.FC<GenerationModeSelectorProps> = ({
  onDeckUpload,
  styleLibrary,
  isTestMode,
  onLibraryUpload,
}) => {
  const [mode, setMode] = useState<GenerationMode>('smart');

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mode Switcher */}
      <div className="flex justify-center mb-6 animate-slide-down">
        <div className="inline-flex items-center gap-3 p-1.5 glass rounded-2xl border border-brand-border/50 shadow-glass">
          <button
            onClick={() => setMode('smart')}
            className={`relative px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              mode === 'smart'
                ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                : 'text-brand-text-secondary hover:text-brand-primary-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              <span>✨ Smart AI</span>
            </div>
            {mode === 'smart' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setMode('classic')}
            className={`relative px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
              mode === 'classic'
                ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                : 'text-brand-text-secondary hover:text-brand-primary-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Classic Mode</span>
            </div>
          </button>
        </div>
      </div>

      {/* Feature Comparison Hint */}
      <div className="text-center mb-8 animate-fade-in">
        {mode === 'smart' ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary-50 to-brand-accent-50 rounded-xl border border-brand-primary-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-brand-primary-700">
              AI analyzes your content, proposes a plan, and generates slides intelligently
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-gray-700">
              Upload files, paste notes, or write outlines manually
            </span>
          </div>
        )}
      </div>

      {/* Render Selected Mode */}
      <div className="flex-grow">
        {mode === 'smart' ? (
          <SmartDeckGenerator
            onDeckUpload={onDeckUpload}
            styleLibrary={styleLibrary}
            isTestMode={isTestMode}
            onLibraryUpload={onLibraryUpload}
          />
        ) : (
          <DeckUploader
            onDeckUpload={onDeckUpload}
            styleLibrary={styleLibrary}
            isTestMode={isTestMode}
          />
        )}
      </div>
    </div>
  );
};

export default GenerationModeSelector;
