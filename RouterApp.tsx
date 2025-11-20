import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import { Slide, StyleLibraryItem } from './types';
import { useAuth } from './contexts/AuthContext';
import { getUserStyleLibrary } from './services/firestoreService';

// Import the full editor view (we'll extract this from current App.tsx)
import EditorView from './EditorView';

const RouterApp: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [styleLibrary, setStyleLibrary] = useState<StyleLibraryItem[]>([]);

  // Load user's style library from Firestore when they sign in
  useEffect(() => {
    const loadStyleLibrary = async () => {
      if (user) {
        try {
          console.log(`🔍 DEBUG: Loading style library for user ${user.uid}`);
          const library = await getUserStyleLibrary(user.uid);
          console.log(`🔍 DEBUG: Loaded ${library.length} items from Firestore`);
          setStyleLibrary(library);
        } catch (error) {
          console.error('❌ Error loading style library:', error);
        }
      } else {
        console.log('🔍 DEBUG: User signed out, clearing style library');
        setStyleLibrary([]);
      }
    };

    loadStyleLibrary();
  }, [user?.uid]);

  const handleSlidesGenerated = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    // Navigate to editor view when slides are generated
    navigate('/editor');
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/app"
        element={
          <AppPage
            styleLibrary={styleLibrary}
            onSlidesGenerated={handleSlidesGenerated}
          />
        }
      />
      <Route
        path="/editor"
        element={
          <EditorView
            initialSlides={slides}
            styleLibrary={styleLibrary}
            onStyleLibraryUpdate={setStyleLibrary}
          />
        }
      />
    </Routes>
  );
};

export default RouterApp;
