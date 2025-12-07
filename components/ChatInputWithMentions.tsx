import React, { useState, useRef, useEffect } from 'react';
import MentionAutocomplete from './MentionAutocomplete';
import { Slide, VideoAsset } from '../types';
import {
  isValidVideoFile,
  createVideoAssetFromFile,
  SUPPORTED_VIDEO_EXTENSIONS
} from '../services/geminiVideoService';

interface ChatInputWithMentionsProps {
  slides: Slide[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, mentionedSlideIds?: string[], attachedImages?: string[], attachedVideo?: VideoAsset) => void;
  placeholder?: string;
  disabled?: boolean;
  showUploadButton?: boolean;
  showToolsButton?: boolean;
  // New: callback when video is uploaded (for parent to track in session)
  onVideoUploaded?: (video: VideoAsset) => void;
}

const ChatInputWithMentions: React.FC<ChatInputWithMentionsProps> = ({
  slides,
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask Deckr...',
  disabled = false,
  showUploadButton = true,
  showToolsButton = true,
  onVideoUploaded
}) => {
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0, bottom: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionedSlideIds, setMentionedSlideIds] = useState<string[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedVideo, setAttachedVideo] = useState<VideoAsset | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Detect @ mentions
  useEffect(() => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');

      if (!hasSpaceAfterAt) {
        // Show autocomplete
        setMentionSearchQuery(textAfterAt);
        setShowMentionAutocomplete(true);
        setSelectedMentionIndex(0);

        // Calculate position - show dropdown ABOVE the input
        const rect = textareaRef.current.getBoundingClientRect();

        // Calculate bottom position (distance from bottom of viewport to top of input)
        const bottomPosition = window.innerHeight - rect.top;

        setMentionPosition({
          top: rect.top + window.scrollY,  // We'll use this in the component
          left: rect.left + window.scrollX,
          bottom: bottomPosition  // Distance from bottom of viewport
        });
      } else {
        setShowMentionAutocomplete(false);
      }
    } else {
      setShowMentionAutocomplete(false);
    }
  }, [value]);

  // Handle mention selection
  const handleMentionSelect = (slideIds: string[]) => {
    if (!textareaRef.current) return;

    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    // Get slide labels
    const slideLabels = slideIds.map(id => {
      const slideIndex = slides.findIndex(s => s.id === id);
      return `slide${slideIndex + 1}`;
    });

    // Replace @query with @slide1, @slide2, etc.
    const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbol);
    const newText = slideIds.length === slides.length
      ? `${textBeforeAt}@all `
      : `${textBeforeAt}@${slideLabels.join(',')} `;

    onChange(newText + textAfterCursor);
    setShowMentionAutocomplete(false);
    setMentionedSlideIds(slideIds);

    // Restore focus
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = newText.length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only accept one video at a time

    if (!isValidVideoFile(file)) {
      alert(`Unsupported video format. Please use: ${SUPPORTED_VIDEO_EXTENSIONS.join(', ')}`);
      e.target.value = '';
      return;
    }

    // Check file size (warn if > 50MB)
    if (file.size > 50 * 1024 * 1024) {
      const proceed = confirm('This video is larger than 50MB and may take a while to process. Continue?');
      if (!proceed) {
        e.target.value = '';
        return;
      }
    }

    setIsProcessingVideo(true);
    try {
      const videoAsset = await createVideoAssetFromFile(file);
      setAttachedVideo(videoAsset);
      onVideoUploaded?.(videoAsset);
    } catch (error) {
      console.error('Failed to process video:', error);
      alert('Failed to process video. Please try a different file.');
    } finally {
      setIsProcessingVideo(false);
      e.target.value = '';
    }
  };

  // Remove attached video
  const handleRemoveVideo = () => {
    setAttachedVideo(null);
  };

  // Remove attached image
  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionAutocomplete) {
      const maxIndex = slides.length; // Including "all slides" option

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => Math.min(prev + 1, maxIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        // Select the highlighted mention
        if (selectedMentionIndex === 0) {
          handleMentionSelect(slides.map(s => s.id)); // All slides
        } else {
          const filteredSlides = slides.filter((slide, index) => {
            const slideNum = (index + 1).toString();
            const slideName = slide.name?.toLowerCase() || '';
            const query = mentionSearchQuery.toLowerCase();
            return slideNum.includes(query) || slideName.includes(query);
          });
          if (filteredSlides[selectedMentionIndex - 1]) {
            handleMentionSelect([filteredSlides[selectedMentionIndex - 1].id]);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionAutocomplete(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage();
    }
  };

  const handleSubmitMessage = () => {
    if (!value.trim() && attachedImages.length === 0 && !attachedVideo) return;

    // Parse mentions from text if they weren't set via autocomplete
    let finalMentionedSlideIds = mentionedSlideIds;
    if (mentionedSlideIds.length === 0) {
      // Extract @slide1, @slide2, etc. from text
      const mentionRegex = /@slide(\d+)|@all/g;
      const matches = [...value.matchAll(mentionRegex)];

      if (matches.length > 0) {
        const extractedIds: string[] = [];
        for (const match of matches) {
          if (match[0] === '@all') {
            // @all means all slides
            extractedIds.push(...slides.map(s => s.id));
            break;
          } else if (match[1]) {
            // @slide3 -> get the 3rd slide (index 2)
            const slideIndex = parseInt(match[1]) - 1;
            if (slideIndex >= 0 && slideIndex < slides.length) {
              extractedIds.push(slides[slideIndex].id);
            }
          }
        }
        finalMentionedSlideIds = extractedIds;
        console.log('📌 Parsed mentions from text:', finalMentionedSlideIds);
      }
    }

    onSubmit(
      value,
      finalMentionedSlideIds.length > 0 ? finalMentionedSlideIds : undefined,
      attachedImages.length > 0 ? attachedImages : undefined,
      attachedVideo || undefined
    );

    // Reset
    onChange('');
    setMentionedSlideIds([]);
    setAttachedImages([]);
    setAttachedVideo(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Video attachment preview */}
      {(attachedVideo || isProcessingVideo) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          borderRadius: '12px',
          border: '1px solid #BAE6FD'
        }}>
          {isProcessingVideo ? (
            <>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: '#0EA5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg
                  className="animate-spin"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#0369A1', fontSize: '14px', margin: 0 }}>
                  Processing video...
                </p>
                <p style={{ color: '#0284C7', fontSize: '12px', margin: 0 }}>
                  This may take a moment for large files
                </p>
              </div>
            </>
          ) : attachedVideo && (
            <>
              {attachedVideo.thumbnail ? (
                <img
                  src={attachedVideo.thumbnail}
                  alt="Video thumbnail"
                  style={{
                    width: '80px',
                    height: '48px',
                    borderRadius: '6px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '48px',
                  borderRadius: '6px',
                  background: '#0EA5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#0369A1', fontSize: '14px', margin: 0 }}>
                  {attachedVideo.name}
                </p>
                <p style={{ color: '#0284C7', fontSize: '12px', margin: 0 }}>
                  Demo video attached
                  {attachedVideo.duration && ` • ${Math.floor(attachedVideo.duration / 60)}:${String(Math.floor(attachedVideo.duration % 60)).padStart(2, '0')}`}
                </p>
              </div>
              <button
                onClick={handleRemoveVideo}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.color = '#64748B';
                }}
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

      {/* Image attachments preview */}
      {attachedImages.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          {attachedImages.map((image, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <img
                src={image}
                alt={`Attachment ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                onClick={() => handleRemoveImage(index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: 'none',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div
        className="animate-border-beam"
        style={{
          background: '#FFFFFF',
          borderRadius: '32px',
          padding: '18px 24px',
          minHeight: '72px',
          transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/mpeg,video/quicktime,video/webm,video/avi,.mp4,.mov,.mpeg,.webm,.avi,.mkv"
          style={{ display: 'none' }}
          onChange={handleVideoUpload}
        />

        {/* Plus/Upload Button with dropdown */}
        {showUploadButton && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                const dropdown = document.getElementById('upload-dropdown');
                if (dropdown) {
                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
              }}
              disabled={disabled || isProcessingVideo}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                background: 'transparent',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 100ms ease',
                border: 'none',
                cursor: (disabled || isProcessingVideo) ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                opacity: (disabled || isProcessingVideo) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isProcessingVideo) {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.color = '#4F46E5';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && !isProcessingVideo) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9CA3AF';
                }
              }}
              title="Upload files"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Upload dropdown menu */}
            <div
              id="upload-dropdown"
              style={{
                display: 'none',
                position: 'absolute',
                bottom: '48px',
                left: '0',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                padding: '8px',
                minWidth: '160px',
                zIndex: 100
              }}
            >
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  document.getElementById('upload-dropdown')!.style.display = 'none';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  transition: 'background 100ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                Upload Image
              </button>
              <button
                onClick={() => {
                  videoInputRef.current?.click();
                  document.getElementById('upload-dropdown')!.style.display = 'none';
                }}
                disabled={!!attachedVideo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '8px',
                  cursor: attachedVideo ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: attachedVideo ? '#9CA3AF' : '#374151',
                  transition: 'background 100ms ease',
                  opacity: attachedVideo ? 0.6 : 1
                }}
                onMouseEnter={(e) => !attachedVideo && (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                {attachedVideo ? 'Video Added' : 'Upload Demo Video'}
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            fontSize: '16px',
            fontWeight: '400',
            color: '#2D3748',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            lineHeight: '1.5',
            padding: '0',
            letterSpacing: '-0.011em',
            resize: 'none',
            overflow: 'auto',
            maxHeight: '240px',
            fontFamily: 'inherit'
          }}
          className="placeholder:text-gray-400"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            const newHeight = Math.min(target.scrollHeight, 240);
            target.style.height = newHeight + 'px';
          }}
        />

        {/* Tools Button */}
        {showToolsButton && (
          <button
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '16px',
              color: '#6B7280',
              fontSize: '13px',
              fontWeight: '500',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 100ms ease',
              flexShrink: 0,
              opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.color = '#4F46E5';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6B7280';
              }
            }}
            title="Tools"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Tools</span>
          </button>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmitMessage}
          disabled={disabled || (!value.trim() && attachedImages.length === 0 && !attachedVideo)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            cursor: (disabled || (!value.trim() && attachedImages.length === 0 && !attachedVideo)) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            background: (!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo))
              ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
              : '#E5E7EB',
            boxShadow: (!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo))
              ? '0 2px 8px rgba(99, 102, 241, 0.28)'
              : 'none',
            flexShrink: 0,
            opacity: (!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo)) ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo)) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #686BF2 0%, #5349E6 100%)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.42)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo)) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.28)';
            }
          }}
          title="Submit"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={(!disabled && (value.trim() || attachedImages.length > 0 || attachedVideo)) ? 'white' : '#9CA3AF'}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Mention Autocomplete Dropdown */}
      {showMentionAutocomplete && (
        <MentionAutocomplete
          slides={slides}
          searchQuery={mentionSearchQuery}
          position={mentionPosition}
          onSelect={handleMentionSelect}
          selectedIndex={selectedMentionIndex}
        />
      )}
    </div>
  );
};

export default ChatInputWithMentions;
