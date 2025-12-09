/**
 * EmbedWidget - Universal embed widget for Digital Sales Rooms
 *
 * Supports: Figma, Airtable, PandaDoc, Google Slides/Docs/Sheets,
 * Calendly, Notion, Typeform, Miro, Pitch, Canva, and generic URLs
 *
 * Features:
 * - Smart URL detection and conversion
 * - Provider-specific optimizations
 * - Responsive iframe sizing
 * - Loading states
 */

import React, { useState, useEffect } from 'react';
import { EmbedBlock } from '../../types';

type EmbedProvider =
    | 'figma'
    | 'airtable'
    | 'pandadoc'
    | 'google_slides'
    | 'google_docs'
    | 'google_sheets'
    | 'calendly'
    | 'notion'
    | 'typeform'
    | 'miro'
    | 'pitch'
    | 'canva'
    | 'coda'
    | 'other';

interface EmbedWidgetProps {
    block: EmbedBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<EmbedBlock>) => void;
    onInteraction?: () => void; // Analytics callback
}

// Provider configuration
const providerConfig: Record<EmbedProvider, {
    name: string;
    icon: string;
    color: string;
    defaultHeight: number;
    placeholder: string;
    urlPattern?: RegExp;
}> = {
    figma: {
        name: 'Figma',
        icon: '🎨',
        color: 'bg-purple-100 text-purple-700',
        defaultHeight: 600,
        placeholder: 'https://www.figma.com/file/...',
        urlPattern: /figma\.com/
    },
    airtable: {
        name: 'Airtable',
        icon: '📊',
        color: 'bg-yellow-100 text-yellow-700',
        defaultHeight: 533,
        placeholder: 'https://airtable.com/embed/...',
        urlPattern: /airtable\.com/
    },
    pandadoc: {
        name: 'PandaDoc',
        icon: '📝',
        color: 'bg-green-100 text-green-700',
        defaultHeight: 800,
        placeholder: 'https://app.pandadoc.com/s/...',
        urlPattern: /pandadoc\.com/
    },
    google_slides: {
        name: 'Google Slides',
        icon: '📽️',
        color: 'bg-yellow-100 text-yellow-700',
        defaultHeight: 480,
        placeholder: 'https://docs.google.com/presentation/d/.../embed',
        urlPattern: /docs\.google\.com\/presentation/
    },
    google_docs: {
        name: 'Google Docs',
        icon: '📄',
        color: 'bg-blue-100 text-blue-700',
        defaultHeight: 600,
        placeholder: 'https://docs.google.com/document/d/.../edit',
        urlPattern: /docs\.google\.com\/document/
    },
    google_sheets: {
        name: 'Google Sheets',
        icon: '📈',
        color: 'bg-green-100 text-green-700',
        defaultHeight: 500,
        placeholder: 'https://docs.google.com/spreadsheets/d/.../edit',
        urlPattern: /docs\.google\.com\/spreadsheets/
    },
    calendly: {
        name: 'Calendly',
        icon: '📅',
        color: 'bg-blue-100 text-blue-700',
        defaultHeight: 700,
        placeholder: 'https://calendly.com/your-username',
        urlPattern: /calendly\.com/
    },
    notion: {
        name: 'Notion',
        icon: '📓',
        color: 'bg-gray-100 text-gray-700',
        defaultHeight: 600,
        placeholder: 'https://notion.site/...',
        urlPattern: /notion\.(so|site)/
    },
    typeform: {
        name: 'Typeform',
        icon: '📋',
        color: 'bg-indigo-100 text-indigo-700',
        defaultHeight: 600,
        placeholder: 'https://form.typeform.com/to/...',
        urlPattern: /typeform\.com/
    },
    miro: {
        name: 'Miro',
        icon: '🎯',
        color: 'bg-yellow-100 text-yellow-700',
        defaultHeight: 600,
        placeholder: 'https://miro.com/app/board/...',
        urlPattern: /miro\.com/
    },
    pitch: {
        name: 'Pitch',
        icon: '🎬',
        color: 'bg-purple-100 text-purple-700',
        defaultHeight: 500,
        placeholder: 'https://pitch.com/public/...',
        urlPattern: /pitch\.com/
    },
    canva: {
        name: 'Canva',
        icon: '🖼️',
        color: 'bg-cyan-100 text-cyan-700',
        defaultHeight: 600,
        placeholder: 'https://www.canva.com/design/.../view',
        urlPattern: /canva\.com/
    },
    coda: {
        name: 'Coda',
        icon: '📑',
        color: 'bg-orange-100 text-orange-700',
        defaultHeight: 600,
        placeholder: 'https://coda.io/d/...',
        urlPattern: /coda\.io/
    },
    other: {
        name: 'Website',
        icon: '🌐',
        color: 'bg-gray-100 text-gray-700',
        defaultHeight: 500,
        placeholder: 'https://example.com'
    }
};

const EmbedWidget: React.FC<EmbedWidgetProps> = ({
    block,
    isEditing,
    updateBlock,
    onInteraction
}) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    // Detect provider from URL
    const detectProvider = (url: string): EmbedProvider => {
        if (!url) return 'other';

        for (const [provider, config] of Object.entries(providerConfig)) {
            if (config.urlPattern && config.urlPattern.test(url)) {
                return provider as EmbedProvider;
            }
        }
        return 'other';
    };

    // Convert URL to embed-friendly format
    const getEmbedUrl = (url: string, provider: EmbedProvider): string => {
        if (!url) return '';

        switch (provider) {
            case 'figma':
                // Convert Figma file URL to embed URL
                if (url.includes('figma.com/file/') && !url.includes('embed')) {
                    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
                }
                return url;

            case 'google_slides':
                // Convert to embed URL
                if (url.includes('/edit') || url.includes('/view')) {
                    return url.replace(/\/(edit|view).*$/, '/embed');
                }
                if (!url.includes('/embed')) {
                    return url + '/embed';
                }
                return url;

            case 'google_docs':
            case 'google_sheets':
                // Add embedded=true parameter
                if (!url.includes('embedded=true')) {
                    return url.includes('?') ? `${url}&embedded=true` : `${url}?embedded=true`;
                }
                return url;

            case 'calendly':
                // Ensure proper embed format
                if (!url.includes('/embed')) {
                    return url;
                }
                return url;

            case 'notion':
                // Notion URLs usually work as-is when public
                return url;

            case 'typeform':
                // Convert share URL to embed
                if (url.includes('typeform.com/to/')) {
                    return url;
                }
                return url;

            case 'miro':
                // Convert to embed URL
                if (url.includes('/board/') && !url.includes('embedId')) {
                    const boardId = url.match(/\/board\/([^/?]+)/)?.[1];
                    if (boardId) {
                        return `https://miro.com/app/live-embed/${boardId}/`;
                    }
                }
                return url;

            case 'canva':
                // Convert to embed view
                if (url.includes('/design/') && !url.includes('/view')) {
                    return url.replace(/\/design\//, '/design/').replace(/\/?$/, '/view?embed');
                }
                return url;

            default:
                return url;
        }
    };

    const provider = block.provider as EmbedProvider || detectProvider(block.url);
    const config = providerConfig[provider] || providerConfig.other;
    const embedUrl = getEmbedUrl(block.url, provider);

    // Handle iframe load events
    const handleIframeLoad = () => {
        setIsLoading(false);
        setLoadError(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setLoadError(true);
    };

    // Reset loading state when URL changes
    useEffect(() => {
        if (block.url) {
            setIsLoading(true);
            setLoadError(false);
        }
    }, [block.url]);

    // Empty state - URL input
    if (isEditing && !block.url) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    🔗
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800">Add Embed</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Embed content from your favorite tools
                    </p>
                </div>

                {/* Provider pills */}
                <div className="flex gap-2 flex-wrap justify-center max-w-lg">
                    {['Figma', 'Calendly', 'Notion', 'Google Slides', 'Miro', 'Typeform'].map((p) => (
                        <span key={p} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                            {p}
                        </span>
                    ))}
                </div>

                {/* Provider selector */}
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-lg">
                    <select
                        className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm bg-white"
                        value={block.provider || 'other'}
                        onChange={(e) => updateBlock({ provider: e.target.value as EmbedProvider })}
                    >
                        {Object.entries(providerConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>
                                {cfg.icon} {cfg.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder={providerConfig[block.provider as EmbedProvider || 'other'].placeholder}
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
                    />
                </div>

                <button
                    onClick={() => {
                        if (inputUrl.trim()) {
                            const detectedProvider = detectProvider(inputUrl.trim());
                            updateBlock({
                                url: inputUrl.trim(),
                                provider: detectedProvider
                            });
                            setInputUrl('');
                        }
                    }}
                    disabled={!inputUrl.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Add Embed
                </button>
            </div>
        );
    }

    // Embed viewer
    return (
        <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${config.color}`}>
                        {config.icon}
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900">{config.name}</h4>
                        <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[300px]">
                            {block.url}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Open in new tab */}
                    <a
                        href={block.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open in new tab"
                        onClick={() => onInteraction?.()}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>

                    {/* Edit button */}
                    {isEditing && (
                        <button
                            onClick={() => updateBlock({ url: '' })}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Change embed"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Embed container */}
            <div className="relative bg-slate-50" style={{ minHeight: block.height || config.defaultHeight }}>
                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Loading {config.name}...</p>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                        <div className="flex flex-col items-center gap-3 text-center px-6">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${config.color}`}>
                                {config.icon}
                            </div>
                            <p className="text-gray-700 font-medium">Unable to load embed</p>
                            <p className="text-sm text-gray-500">
                                This content may require authentication or doesn't allow embedding.
                            </p>
                            <a
                                href={block.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                            >
                                Open in {config.name}
                            </a>
                        </div>
                    </div>
                )}

                {/* Iframe */}
                <iframe
                    src={embedUrl}
                    className="w-full bg-white"
                    style={{ height: block.height || config.defaultHeight }}
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    title={`${config.name} embed`}
                />
            </div>
        </div>
    );
};

export default EmbedWidget;
