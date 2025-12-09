/**
 * VideoWidget - Enhanced video player for Digital Sales Rooms
 *
 * Supports: YouTube, Vimeo, Loom, Wistia, direct MP4/WebM links
 * Features: Thumbnail preview, autoplay controls, view tracking ready
 */

import React, { useState, useRef } from 'react';
import { VideoBlock } from '../../types';

interface VideoWidgetProps {
    block: VideoBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<VideoBlock>) => void;
    onPlay?: () => void; // Analytics callback
}

type VideoProvider = 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'direct' | 'unknown';

const VideoWidget: React.FC<VideoWidgetProps> = ({ block, isEditing, updateBlock, onPlay }) => {
    const [showThumbnail, setShowThumbnail] = useState(true);
    const [inputUrl, setInputUrl] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Detect video provider from URL
    const detectProvider = (url: string): VideoProvider => {
        if (!url) return 'unknown';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('vimeo.com')) return 'vimeo';
        if (url.includes('loom.com')) return 'loom';
        if (url.includes('wistia.com') || url.includes('wistia.net')) return 'wistia';
        if (url.match(/\.(mp4|webm|ogg)$/i)) return 'direct';
        return 'unknown';
    };

    // Convert watch URLs to embed URLs
    const getEmbedUrl = (url: string): string => {
        if (!url) return '';

        // YouTube
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }

        // Vimeo
        if (url.includes('vimeo.com/') && !url.includes('/video/')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            return `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0`;
        }

        // Loom
        if (url.includes('loom.com/share/')) {
            return url.replace('loom.com/share/', 'loom.com/embed/');
        }

        // Wistia
        if (url.includes('wistia.com/medias/')) {
            const videoId = url.split('/medias/')[1]?.split('?')[0];
            return `https://fast.wistia.net/embed/iframe/${videoId}`;
        }

        return url;
    };

    // Get thumbnail URL for preview
    const getThumbnailUrl = (url: string): string | null => {
        const provider = detectProvider(url);

        if (provider === 'youtube') {
            let videoId = '';
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1]?.split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            }
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
        }

        // For other providers, we'd need their APIs - return null for now
        return null;
    };

    const provider = detectProvider(block.url);
    const embedUrl = getEmbedUrl(block.url);
    const thumbnailUrl = getThumbnailUrl(block.url);

    // Handle play click
    const handlePlay = () => {
        setShowThumbnail(false);
        onPlay?.();
    };

    // Provider icon
    const ProviderIcon = ({ provider }: { provider: VideoProvider }) => {
        const icons: Record<VideoProvider, string> = {
            youtube: '▶️',
            vimeo: '🎬',
            loom: '🎥',
            wistia: '📹',
            direct: '🎞️',
            unknown: '📺'
        };
        return <span>{icons[provider]}</span>;
    };

    // Empty state - URL input
    if (isEditing && !block.url) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    ▶️
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800">Add Video</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Paste a link from YouTube, Vimeo, Loom, or Wistia
                    </p>
                </div>

                {/* Provider pills */}
                <div className="flex gap-2 flex-wrap justify-center">
                    {['YouTube', 'Vimeo', 'Loom', 'Wistia'].map((p) => (
                        <span key={p} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                            {p}
                        </span>
                    ))}
                </div>

                <div className="flex gap-2 w-full max-w-md">
                    <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=..."
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-sm"
                    />
                    <button
                        onClick={() => {
                            if (inputUrl.trim()) {
                                updateBlock({ url: inputUrl.trim() });
                                setInputUrl('');
                            }
                        }}
                        disabled={!inputUrl.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Add
                    </button>
                </div>
            </div>
        );
    }

    // Direct video (MP4/WebM)
    if (provider === 'direct') {
        return (
            <div className="w-full rounded-2xl overflow-hidden bg-black shadow-xl relative group">
                {isEditing && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/80 uppercase">Video</span>
                            <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white/70">Direct</span>
                        </div>
                        <button
                            onClick={() => updateBlock({ url: '' })}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg backdrop-blur-sm"
                        >
                            Change
                        </button>
                    </div>
                )}
                <video
                    src={block.url}
                    controls
                    className="w-full aspect-video"
                    poster={block.thumbnailUrl}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    }

    // Embedded video (YouTube, Vimeo, etc.)
    return (
        <div className="w-full rounded-2xl overflow-hidden bg-black shadow-xl relative group">
            {/* Edit overlay */}
            {isEditing && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center z-20">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/80 uppercase">Video</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white/70 capitalize">{provider}</span>
                    </div>
                    <button
                        onClick={() => updateBlock({ url: '' })}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg backdrop-blur-sm"
                    >
                        Change Video
                    </button>
                </div>
            )}

            {/* Thumbnail preview with play button */}
            {showThumbnail && thumbnailUrl && !isEditing && (
                <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={handlePlay}
                >
                    <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                        onError={() => setShowThumbnail(false)}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-red-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Video iframe */}
            <div className="aspect-video w-full">
                <iframe
                    ref={iframeRef}
                    src={(!showThumbnail || isEditing || !thumbnailUrl) ? embedUrl : undefined}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    title={block.title || 'Video'}
                />
            </div>

            {/* Video title bar (viewer mode) */}
            {!isEditing && block.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-medium truncate">{block.title}</h3>
                </div>
            )}
        </div>
    );
};

export default VideoWidget;
