/**
 * DocumentWidget - PDF Viewer with Slide Carousel for Digital Sales Rooms
 *
 * Features:
 * - Slide-by-slide carousel navigation (like deck viewer)
 * - Thumbnail strip at bottom for quick navigation
 * - PDF.js for rendering individual pages as images
 * - Keyboard navigation (arrow keys)
 * - Fullscreen mode
 * - Download controls
 * - View tracking ready for analytics
 * - Firebase Storage upload for persistent URLs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PDFBlock } from '../../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

// Declare pdf.js types
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

interface DocumentWidgetProps {
    block: PDFBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<PDFBlock>) => void;
    allowDownload?: boolean;
    onView?: () => void;
    onSlideChange?: (pageIndex: number, timeSpentMs: number) => void; // Analytics callback
    workspaceId?: string; // For storage path
    userId?: string; // For storage path
}

interface ExtendedPDFBlock extends PDFBlock {
    allowDownload?: boolean;
    pageCount?: number;
}

interface PageImage {
    pageNumber: number;
    dataUrl: string;
    thumbnailUrl: string;
}

const DocumentWidget: React.FC<DocumentWidgetProps> = ({
    block,
    isEditing,
    updateBlock,
    allowDownload = true,
    onView,
    onSlideChange,
    workspaceId,
    userId
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [pages, setPages] = useState<PageImage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsReupload, setNeedsReupload] = useState(false); // Blob URL expired

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);
    const slideStartTime = useRef<number>(Date.now());

    const extendedBlock = block as ExtendedPDFBlock;

    // Load PDF.js from CDN
    useEffect(() => {
        if (window.pdfjsLib) return;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Render PDF pages when URL changes
    const renderPDF = useCallback(async (pdfUrl: string) => {
        // Early detection of expired blob URLs
        if (pdfUrl.startsWith('blob:')) {
            console.log('[DocumentWidget] Detected blob URL - these expire after page refresh');
            setNeedsReupload(true);
            setError('This PDF was uploaded using a temporary link that has expired. Please re-upload the PDF.');
            setLoading(false);
            return;
        }

        if (!window.pdfjsLib) {
            // Wait for pdf.js to load
            setTimeout(() => renderPDF(pdfUrl), 500);
            return;
        }

        setLoading(true);
        setLoadingProgress(0);
        setError(null);
        setPages([]);
        setPdfLoaded(false);

        try {
            const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            const pageImages: PageImage[] = [];

            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);

                // Render main image (larger)
                const mainScale = 2;
                const mainViewport = page.getViewport({ scale: mainScale });
                const mainCanvas = document.createElement('canvas');
                const mainContext = mainCanvas.getContext('2d');
                mainCanvas.height = mainViewport.height;
                mainCanvas.width = mainViewport.width;

                await page.render({
                    canvasContext: mainContext,
                    viewport: mainViewport
                }).promise;

                // Render thumbnail (smaller)
                const thumbScale = 0.3;
                const thumbViewport = page.getViewport({ scale: thumbScale });
                const thumbCanvas = document.createElement('canvas');
                const thumbContext = thumbCanvas.getContext('2d');
                thumbCanvas.height = thumbViewport.height;
                thumbCanvas.width = thumbViewport.width;

                await page.render({
                    canvasContext: thumbContext,
                    viewport: thumbViewport
                }).promise;

                pageImages.push({
                    pageNumber: i,
                    dataUrl: mainCanvas.toDataURL('image/jpeg', 0.9),
                    thumbnailUrl: thumbCanvas.toDataURL('image/jpeg', 0.7)
                });

                setLoadingProgress(Math.round((i / numPages) * 100));
            }

            setPages(pageImages);
            setPdfLoaded(true);
            updateBlock({ pageCount: numPages });
            onView?.();
        } catch (err: any) {
            console.error('Error loading PDF:', err);

            // Detect blob URL errors (expired temporary URLs)
            const isBlobUrl = pdfUrl.startsWith('blob:');
            if (isBlobUrl) {
                setNeedsReupload(true);
                setError('This PDF was uploaded using a temporary link that has expired. Please re-upload the PDF.');
            } else {
                setError('Failed to load PDF. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [updateBlock, onView]);

    // Load PDF when URL is available
    useEffect(() => {
        // Don't retry if there's already an error or needs reupload
        if (extendedBlock.storageUrl && !pdfLoaded && !loading && !error && !needsReupload) {
            renderPDF(extendedBlock.storageUrl);
        }
    }, [extendedBlock.storageUrl, pdfLoaded, loading, error, needsReupload, renderPDF]);

    // Track time spent on each page
    useEffect(() => {
        return () => {
            // Report time when component unmounts or page changes
            if (onSlideChange && pages.length > 0) {
                const timeSpent = Date.now() - slideStartTime.current;
                onSlideChange(currentPageIndex, timeSpent);
            }
        };
    }, [currentPageIndex, onSlideChange, pages.length]);

    // Navigate to page
    const goToPage = useCallback((index: number) => {
        // Track time on previous page
        if (onSlideChange && pages.length > 0) {
            const timeSpent = Date.now() - slideStartTime.current;
            onSlideChange(currentPageIndex, timeSpent);
        }
        slideStartTime.current = Date.now();

        if (index >= 0 && index < pages.length) {
            setCurrentPageIndex(index);

            // Scroll thumbnail into view
            if (thumbnailContainerRef.current) {
                const thumbnails = thumbnailContainerRef.current.children;
                if (thumbnails[index]) {
                    thumbnails[index].scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        }
    }, [currentPageIndex, pages.length, onSlideChange]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!pdfLoaded) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToPage(Math.min(currentPageIndex + 1, pages.length - 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPage(Math.max(currentPageIndex - 1, 0));
            } else if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            } else if (e.key === 'f' || e.key === 'F') {
                setIsFullscreen(!isFullscreen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pdfLoaded, currentPageIndex, pages.length, goToPage, isFullscreen]);

    // Get file icon based on type
    const getFileIcon = (filename: string) => {
        const ext = filename?.split('.').pop()?.toLowerCase() || 'pdf';
        const icons: Record<string, { icon: string; color: string; bg: string }> = {
            pdf: { icon: '📄', color: 'text-red-600', bg: 'bg-red-100' },
            doc: { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-100' },
            docx: { icon: '📝', color: 'text-blue-600', bg: 'bg-blue-100' },
        };
        return icons[ext] || { icon: '📁', color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    // Handle file upload - uploads to Firebase Storage for persistent URLs
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);
        setPdfLoaded(false);
        setPages([]);
        setError(null);
        setNeedsReupload(false);

        try {
            // Create a unique storage path for the PDF
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storagePath = `pod/docs/${timestamp}_${sanitizedFileName}`;

            console.log('[DocumentWidget] Uploading PDF to:', storagePath);
            setUploadProgress(10);

            // Upload to Firebase Storage
            const storageRef = ref(storage, storagePath);

            // Upload the file
            setUploadProgress(30);
            await uploadBytes(storageRef, file);
            setUploadProgress(70);

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            setUploadProgress(90);

            console.log('[DocumentWidget] PDF uploaded successfully:', downloadURL);

            // Update the block with the permanent URL
            updateBlock({
                storageUrl: downloadURL,
                fileName: file.name,
            });

            setUploadProgress(100);

            // Small delay before clearing progress
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);

        } catch (err: any) {
            console.error('[DocumentWidget] Upload failed:', err);
            setError(`Upload failed: ${err.message || 'Unknown error'}`);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle download
    const handleDownload = () => {
        if (!extendedBlock.storageUrl) return;

        const link = document.createElement('a');
        link.href = extendedBlock.storageUrl;
        link.download = extendedBlock.fileName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fileInfo = getFileIcon(extendedBlock.fileName || '');

    // Empty state - file upload
    if (isEditing && !extendedBlock.storageUrl) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4">
                <div className={`w-16 h-16 ${fileInfo.bg} rounded-2xl flex items-center justify-center text-3xl shadow-lg`}>
                    📄
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800">Upload PDF Document</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Upload a PDF to display as a slide carousel
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                    <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                        .pdf
                    </span>
                </div>

                {uploading ? (
                    <div className="w-full max-w-xs">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Choose PDF
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </>
                )}
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="w-full h-[500px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">Loading PDF...</p>
                    <p className="text-sm text-gray-500 mt-1">{loadingProgress}% complete</p>
                </div>
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                    />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full h-[400px] bg-red-50 rounded-2xl flex flex-col items-center justify-center gap-4 border border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-3xl">
                    {needsReupload ? '📄' : '⚠️'}
                </div>
                <div className="text-center max-w-md px-4">
                    <p className="text-lg font-medium text-red-700">
                        {needsReupload ? 'PDF Needs Re-upload' : 'Failed to Load PDF'}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                        {needsReupload
                            ? 'This PDF was saved with a temporary link that has expired. Please upload the file again to view it.'
                            : error
                        }
                    </p>
                </div>

                {needsReupload && isEditing ? (
                    <>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Re-upload PDF
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </>
                ) : needsReupload ? (
                    <p className="text-sm text-gray-500">
                        The workspace owner needs to re-upload this PDF.
                    </p>
                ) : (
                    <button
                        onClick={() => renderPDF(extendedBlock.storageUrl!)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                )}
            </div>
        );
    }

    // Fullscreen carousel
    if (isFullscreen && pages.length > 0) {
        const currentPage = pages[currentPageIndex];

        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Top toolbar */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-white font-medium truncate max-w-[300px]">
                            {extendedBlock.fileName}
                        </span>
                        <span className="text-white/70 text-sm">
                            Page {currentPageIndex + 1} of {pages.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {allowDownload && (
                            <button
                                onClick={handleDownload}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                title="Download PDF"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                            title="Exit fullscreen (Esc)"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main page display */}
                <div className="flex-1 flex items-center justify-center px-16 py-20">
                    <img
                        src={currentPage.dataUrl}
                        alt={`Page ${currentPageIndex + 1}`}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                    />
                </div>

                {/* Navigation arrows */}
                <button
                    onClick={() => goToPage(currentPageIndex - 1)}
                    disabled={currentPageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={() => goToPage(currentPageIndex + 1)}
                    disabled={currentPageIndex === pages.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Thumbnail strip */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div
                        ref={thumbnailContainerRef}
                        className="flex gap-2 overflow-x-auto py-2 px-4 justify-center"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {pages.map((page, index) => (
                            <button
                                key={page.pageNumber}
                                onClick={() => goToPage(index)}
                                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                                    index === currentPageIndex
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={page.thumbnailUrl}
                                    alt={`Page ${page.pageNumber}`}
                                    className="h-16 w-auto object-cover"
                                />
                                <div className="text-xs text-white/70 text-center py-0.5 bg-black/50">
                                    {page.pageNumber}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Main carousel view
    const currentPage = pages[currentPageIndex];

    return (
        <div
            ref={containerRef}
            className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-lg"
        >
            {/* Header toolbar */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${fileInfo.bg} rounded-xl flex items-center justify-center text-lg`}>
                        {fileInfo.icon}
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                            {extendedBlock.fileName || 'Document'}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {pages.length > 0 ? `${pages.length} pages` : 'Loading...'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Page indicator */}
                    {pages.length > 0 && (
                        <span className="text-sm text-gray-600 mr-2">
                            {currentPageIndex + 1} / {pages.length}
                        </span>
                    )}

                    {/* Fullscreen button */}
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Fullscreen (F)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>

                    {/* Download button */}
                    {(allowDownload || isEditing) && (
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    )}

                    {/* Remove button (edit mode) */}
                    {isEditing && (
                        <button
                            onClick={() => {
                                updateBlock({ storageUrl: '', fileName: '' });
                                setPages([]);
                                setPdfLoaded(false);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove document"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Main page display */}
            {pages.length > 0 ? (
                <div className="relative bg-slate-100">
                    {/* Current page */}
                    <div className="flex items-center justify-center p-4 min-h-[400px] max-h-[500px]">
                        <img
                            src={currentPage?.dataUrl}
                            alt={`Page ${currentPageIndex + 1}`}
                            className="max-w-full max-h-[450px] object-contain shadow-lg rounded-lg"
                        />
                    </div>

                    {/* Navigation arrows */}
                    <button
                        onClick={() => goToPage(currentPageIndex - 1)}
                        disabled={currentPageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => goToPage(currentPageIndex + 1)}
                        disabled={currentPageIndex === pages.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="h-[400px] flex items-center justify-center bg-slate-100">
                    <p className="text-gray-500">No pages to display</p>
                </div>
            )}

            {/* Thumbnail strip */}
            {pages.length > 0 && (
                <div className="bg-slate-50 border-t border-gray-200 p-3">
                    <div
                        ref={thumbnailContainerRef}
                        className="flex gap-2 overflow-x-auto py-1"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {pages.map((page, index) => (
                            <button
                                key={page.pageNumber}
                                onClick={() => goToPage(index)}
                                className={`flex-shrink-0 rounded-lg overflow-hidden transition-all border-2 ${
                                    index === currentPageIndex
                                        ? 'border-indigo-500 shadow-md scale-105'
                                        : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={page.thumbnailUrl}
                                    alt={`Page ${page.pageNumber}`}
                                    className="h-14 w-auto object-cover"
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center mt-2 text-xs text-gray-500">
                        Use arrow keys to navigate • Press F for fullscreen
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentWidget;
