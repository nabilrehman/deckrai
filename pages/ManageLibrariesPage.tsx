import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, ArrowLeft, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserStyleLibrary, batchAddToStyleLibrary, removeFromStyleLibrary, deleteAllStyleLibraryItems } from '../services/firestoreService';
import { StyleLibraryItem } from '../types';

// PDF.js library type declaration
declare const pdfjsLib: any;

/**
 * Helper: Convert image to base64 via canvas (laundering)
 */
const launderImageSrc = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(new Error(`Failed to process image: ${(error as Error).message}`));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

const ManageLibrariesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [styleLibrary, setStyleLibrary] = useState<StyleLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load style library
  useEffect(() => {
    const loadLibrary = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        setIsLoading(true);
        const library = await getUserStyleLibrary(user.uid);
        setStyleLibrary(library);
      } catch (error) {
        console.error('Error loading style library:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLibrary();
  }, [user, navigate]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const fileArray = Array.from(files);
    const newItems: StyleLibraryItem[] = [];

    setIsUploading(true);

    try {
      for (const file of fileArray) {
        if (file.type === 'application/pdf') {
          // PDF processing
          const fileReader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
              try {
                const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;

                  if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const id = `${file.name}-p${i}-${Date.now()}`;
                    const src = canvas.toDataURL('image/png');
                    const name = pdf.numPages === 1
                      ? file.name.replace('.pdf', '')
                      : `${file.name.replace('.pdf', '')} - Page ${i}`;

                    if (src && src.startsWith('data:image')) {
                      newItems.push({ id, src, name });
                    }
                  }
                }
                resolve();
              } catch (err) {
                reject(new Error("Failed to process PDF file."));
              }
            };
            fileReader.onerror = () => reject(new Error("Failed to read PDF file."));
            fileReader.readAsArrayBuffer(file);
          });
        } else if (file.type.startsWith('image/')) {
          // Image processing
          const fileReader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
              try {
                const src = event.target?.result as string;
                const laundered = await launderImageSrc(src);
                const id = `${file.name}-${Date.now()}`;
                const name = file.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');

                if (laundered && laundered.startsWith('data:image')) {
                  newItems.push({ id, src: laundered, name });
                }
                resolve();
              } catch (err) {
                reject(new Error("Failed to process image file."));
              }
            };
            fileReader.onerror = () => reject(new Error("Failed to read image file."));
            fileReader.readAsDataURL(file);
          });
        }
      }

      if (newItems.length > 0) {
        await batchAddToStyleLibrary(user.uid, newItems);
        const updatedLibrary = await getUserStyleLibrary(user.uid);
        setStyleLibrary(updatedLibrary);
        alert(`✅ Successfully added ${newItems.length} item${newItems.length > 1 ? 's' : ''} to your style library!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`❌ Error uploading files: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (!user) return;

    if (!confirm(`Delete ${selectedItems.size} selected item${selectedItems.size > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      for (const itemId of selectedItems) {
        await removeFromStyleLibrary(user.uid, itemId);
      }

      const updatedLibrary = await getUserStyleLibrary(user.uid);
      setStyleLibrary(updatedLibrary);
      setSelectedItems(new Set());
      alert(`✅ Deleted ${selectedItems.size} items`);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`❌ Error deleting items: ${(error as Error).message}`);
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (!user) return;
    if (styleLibrary.length === 0) return;

    if (!confirm(`⚠️ Delete ALL ${styleLibrary.length} items from your style library? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAllStyleLibraryItems(user.uid);
      setStyleLibrary([]);
      setSelectedItems(new Set());
      alert('✅ All items deleted');
    } catch (error) {
      console.error('Delete all error:', error);
      alert(`❌ Error: ${(error as Error).message}`);
    }
  };

  // Toggle item selection
  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === styleLibrary.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(styleLibrary.map(item => item.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-[400px] h-[400px] bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to App</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent">
                Manage Style Library
              </h1>
              <p className="text-slate-600 mt-2">
                Upload reference slides to customize your AI-generated presentations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="btn-primary cursor-pointer flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Upload Files</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Stats & Actions Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-slate-900">{styleLibrary.length}</div>
                <div className="text-sm text-slate-600">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{selectedItems.size}</div>
                <div className="text-sm text-slate-600">Selected</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {styleLibrary.length > 0 && (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {selectedItems.size === styleLibrary.length ? 'Deselect All' : 'Select All'}
                  </button>

                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Selected ({selectedItems.size})
                    </button>
                  )}

                  <button
                    onClick={handleDeleteAll}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Library Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : styleLibrary.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-12 text-center shadow-sm">
            <ImageIcon size={64} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No reference slides yet</h3>
            <p className="text-slate-600 mb-6">Upload PDFs or images to build your style library</p>
            <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Upload size={18} />
              <span>Upload Your First Files</span>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {styleLibrary.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`group relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                  selectedItems.has(item.id)
                    ? 'border-indigo-500 shadow-lg scale-[1.02]'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {/* Image */}
                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Selection Overlay */}
                  {selectedItems.has(item.id) && (
                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="p-3">
                  <div className="text-xs font-medium text-slate-900 truncate" title={item.name}>
                    {item.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLibrariesPage;
