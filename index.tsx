
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import LoginPage from './components/LoginPage';
import AppPage from './pages/AppPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Slide, StyleLibraryItem } from './types';

/**
 * AppWrapper - Handles routing between Landing Page, Login, and Main App
 */
const AppWrapper: React.FC = () => {
  const { user } = useAuth();
  const [styleLibrary, setStyleLibrary] = React.useState<StyleLibraryItem[]>([]);
  const [slides, setSlides] = React.useState<Slide[]>([]);

  return (
    <Routes>
      {/* Landing Page - Marketing homepage */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/app" replace /> : <LandingPage />
        }
      />

      {/* Login Page - Google/Facebook authentication */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/app" replace /> : <LoginPage />
        }
      />

      {/* Main App - Protected route (requires authentication) */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            {/* If user navigates to /app but has no slides, show the old App (with Editor/Chat) */}
            {slides.length === 0 ? (
              <App />
            ) : (
              <AppPage
                styleLibrary={styleLibrary}
                onSlidesGenerated={(newSlides) => setSlides(newSlides)}
              />
            )}
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);