import React, { useState } from 'react';
import { generateDesignAsset, generateLandingPageAssets, type DesignAsset } from '../services/designAssetGenerator';

const DesignAssetPreview: React.FC = () => {
  const [assets, setAssets] = useState<Record<string, DesignAsset>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const handleGenerateAssets = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatedAssets = await generateLandingPageAssets();
      setAssets(generatedAssets);
    } catch (err: any) {
      setError(err.message || 'Failed to generate assets');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCustom = async () => {
    const customPrompt = prompt('Enter a custom design prompt:');
    if (!customPrompt) return;

    setIsGenerating(true);
    setError(null);
    try {
      const dataUrl = await generateDesignAsset(customPrompt, '1:1');
      setAssets(prev => ({
        ...prev,
        custom: {
          name: 'Custom Asset',
          prompt: customPrompt,
          dataUrl,
        },
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to generate custom asset');
    } finally {
      setIsGenerating(false);
    }
  };

  const assetList = Object.entries(assets);

  return (
    <div className="min-h-screen bg-brand-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold gradient-text mb-3">
            🎨 AI Design Asset Generator
          </h1>
          <p className="text-brand-text-secondary text-lg">
            Generate premium design assets using Gemini 2.5 Flash Image
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleGenerateAssets}
            disabled={isGenerating}
            className="btn btn-primary shadow-btn hover:shadow-btn-hover"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Assets...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
                Generate All Assets
              </>
            )}
          </button>

          <button
            onClick={handleGenerateCustom}
            disabled={isGenerating}
            className="btn btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Generate Custom Asset
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Asset Grid */}
        {assetList.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assetList.map(([key, asset]) => (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer border-2 border-brand-border/30 hover:border-brand-primary-300"
                onClick={() => setSelectedAsset(key)}
              >
                <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-display font-semibold text-brand-text-primary mb-2">
                  {asset.name}
                </h3>
                <p className="text-xs text-brand-text-tertiary line-clamp-3">
                  {asset.prompt}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {assetList.length === 0 && !isGenerating && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center text-white text-4xl">
              🎨
            </div>
            <h3 className="font-display text-2xl font-semibold text-brand-text-primary mb-3">
              No assets generated yet
            </h3>
            <p className="text-brand-text-secondary mb-6">
              Click "Generate All Assets" to create premium design elements using AI
            </p>
          </div>
        )}

        {/* Modal for selected asset */}
        {selectedAsset && assets[selectedAsset] && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => setSelectedAsset(null)}
          >
            <div
              className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold gradient-text">
                  {assets[selectedAsset].name}
                </h2>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="btn-icon"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <img
                  src={assets[selectedAsset].dataUrl}
                  alt={assets[selectedAsset].name}
                  className="w-full rounded-2xl shadow-card-lg"
                />
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-brand-text-primary mb-2">Prompt:</h3>
                <p className="text-sm text-brand-text-secondary bg-brand-background p-4 rounded-xl font-mono">
                  {assets[selectedAsset].prompt}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = assets[selectedAsset].dataUrl;
                    a.download = `${selectedAsset}.jpg`;
                    a.click();
                  }}
                  className="btn btn-primary flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Asset
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(assets[selectedAsset].dataUrl);
                    alert('Data URL copied to clipboard!');
                  }}
                  className="btn btn-secondary flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy Data URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignAssetPreview;
