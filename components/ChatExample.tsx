/**
 * ChatExample.tsx
 *
 * Demo component showing the new 10/10 chat features:
 * 1. @mention autocomplete for slides
 * 2. Inline slide preview thumbnails
 * 3. Undo last action button
 * 4. Image upload in chat input
 *
 * Usage:
 * import ChatExample from './components/ChatExample';
 * <ChatExample slides={slides} />
 */

import React, { useState } from 'react';
import ChatInputWithMentions from './ChatInputWithMentions';
import SlidePreviewInline from './SlidePreviewInline';
import UndoActionButton from './UndoActionButton';
import { Slide } from '../types';

interface ChatExampleProps {
  slides: Slide[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  slidePreview?: Slide[];
  beforeSlides?: Slide[];
  showComparison?: boolean;
  showUndo?: boolean;
  undoAction?: () => void;
  undoDescription?: string;
}

const ChatExample: React.FC<ChatExampleProps> = ({ slides }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I've generated 5 slides for your presentation. You can reference specific slides using @mentions. Try typing '@slide' to see all slides!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [slideHistory, setSlideHistory] = useState<Slide[][]>([slides]);

  const handleSubmit = (value: string, mentionedSlideIds?: string[], attachedImages?: string[]) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: value
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const beforeSlides = [...slides];

      // Simulate slide update
      const updatedSlides = slides.map(slide => ({
        ...slide,
        name: slide.name + ' (Updated)'
      }));

      // Save to history for undo
      setSlideHistory(prev => [...prev, updatedSlides]);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: mentionedSlideIds && mentionedSlideIds.length > 0
          ? `I've updated ${mentionedSlideIds.length === slides.length ? 'all slides' : `${mentionedSlideIds.length} slide${mentionedSlideIds.length > 1 ? 's' : ''}`} based on your request${attachedImages && attachedImages.length > 0 ? ' and the images you provided' : ''}.`
          : attachedImages && attachedImages.length > 0
            ? `I've analyzed the ${attachedImages.length} image${attachedImages.length > 1 ? 's' : ''} you uploaded and updated the slides accordingly.`
            : "I've made those changes to your presentation!",
        slidePreview: mentionedSlideIds && mentionedSlideIds.length > 0
          ? slides.filter(s => mentionedSlideIds.includes(s.id))
          : slides.slice(0, 3),
        beforeSlides: mentionedSlideIds && mentionedSlideIds.length > 0
          ? beforeSlides.filter(s => mentionedSlideIds.includes(s.id))
          : beforeSlides.slice(0, 3),
        showComparison: true,
        showUndo: true,
        undoAction: () => handleUndo(),
        undoDescription: 'Updated slides'
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleUndo = () => {
    if (slideHistory.length > 1) {
      // Revert to previous state
      const previousSlides = slideHistory[slideHistory.length - 2];
      setSlideHistory(prev => prev.slice(0, -1));

      // Add confirmation message
      setMessages(prev => [...prev, {
        id: `undo-${Date.now()}`,
        role: 'assistant',
        content: 'Reverted to previous version.'
      }]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h2 style={{ margin: 0, marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>
          Chat Interface Demo
        </h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          Try @mentioning slides, uploading images, and see the new features in action!
        </p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '80%'
            }}>
              {message.role === 'assistant' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  {/* AI Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  {/* Message Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      padding: '12px 16px',
                      background: '#F3F4F6',
                      borderRadius: '16px',
                      fontSize: '15px',
                      color: '#1F2937',
                      lineHeight: '1.5'
                    }}>
                      {message.content}
                    </div>

                    {/* Slide Preview */}
                    {message.slidePreview && (
                      <SlidePreviewInline
                        slides={message.slidePreview}
                        beforeSlides={message.beforeSlides}
                        showComparison={message.showComparison}
                        title={message.showComparison ? 'Before & After' : 'Updated Slides'}
                      />
                    )}

                    {/* Undo Button */}
                    {message.showUndo && message.undoAction && message.undoDescription && (
                      <UndoActionButton
                        onUndo={message.undoAction}
                        actionDescription={message.undoDescription}
                      />
                    )}
                  </div>
                </div>
              )}

              {message.role === 'user' && (
                <div style={{
                  padding: '12px 16px',
                  background: '#6366F1',
                  borderRadius: '16px',
                  fontSize: '15px',
                  color: 'white',
                  lineHeight: '1.5'
                }}>
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <ChatInputWithMentions
        slides={slides}
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        placeholder="Try '@slide 2 make it blue' or upload an image..."
      />

      {/* Instructions */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#F9FAFB',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6B7280',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Try these features:</div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Type <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: '4px' }}>@</code> to mention specific slides</li>
          <li>Click the + button to upload reference images</li>
          <li>Click on slide previews to expand them</li>
          <li>Use the undo button to revert changes</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatExample;
