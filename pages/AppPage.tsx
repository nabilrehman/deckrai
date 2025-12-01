import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWithArtifacts from '../components/ChatWithArtifacts';
import DeckLibrary from '../components/DeckLibrary';
import { useAuth } from '../contexts/AuthContext';
import { StyleLibraryItem, Slide } from '../types';

interface AppPageProps {
  styleLibrary: StyleLibraryItem[];
  onSlidesGenerated: (slides: Slide[]) => void;
}

export const AppPage: React.FC<AppPageProps> = ({ styleLibrary, onSlidesGenerated }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDeckLibraryOpen, setIsDeckLibraryOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut, navigate]);

  const handleOpenDeckLibrary = useCallback(() => {
    setIsDeckLibraryOpen(true);
  }, []);

  const handleLoadDeck = (slides: Slide[]) => {
    onSlidesGenerated(slides);
    setIsDeckLibraryOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-brand-text-primary font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-brand-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-[400px] h-[400px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <main className="flex-grow flex flex-row overflow-hidden w-full">
        <ChatWithArtifacts
          user={user}
          styleLibrary={styleLibrary}
          onSignOut={handleSignOut}
          onOpenInEditor={(artifactSlides) => {
            console.log('Opening in classic editor with', artifactSlides.length, 'slides');
            onSlidesGenerated(artifactSlides);
          }}
          onOpenDeckLibrary={handleOpenDeckLibrary}
        />
      </main>

      {/* Deck Library Modal */}
      {isDeckLibraryOpen && (
        <DeckLibrary
          onLoadDeck={handleLoadDeck}
          onClose={() => setIsDeckLibraryOpen(false)}
        />
      )}
    </div>
  );
};

export default AppPage;
