
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import LandingPage from './pages/LandingPage';
import LoginPage from './components/LoginPage';
import AppPage from './pages/AppPage';
import PricingPage from './components/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Slide, StyleLibraryItem } from './types';
import { createSubscriptionCheckoutSession } from './services/stripeService';
import { SUBSCRIPTION_PLANS } from './config/subscriptionPlans';

/**
 * AppWrapper - Handles routing between Landing Page, Login, and Main App
 */
const AppWrapper: React.FC = () => {
  const { user } = useAuth();
  const [styleLibrary, setStyleLibrary] = React.useState<StyleLibraryItem[]>([]);
  const [slides, setSlides] = React.useState<Slide[]>([]);

  // Handle plan selection and redirect to Stripe
  const handleSelectPlan = async (planId: 'starter' | 'business' | 'enterprise') => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    if (planId === 'enterprise') {
      // Enterprise users should contact sales
      window.location.href = 'mailto:sales@deckr.ai?subject=Enterprise Plan Inquiry';
      return;
    }

    try {
      const plan = SUBSCRIPTION_PLANS[planId];

      if (!plan.stripePriceId) {
        alert('This plan is not available yet. Please try again later.');
        return;
      }

      // Create Stripe checkout session
      const checkoutUrl = await createSubscriptionCheckoutSession(
        user.uid,
        plan.stripePriceId,
        planId
      );

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Failed to start checkout:', error);
      alert(`Failed to start checkout: ${error.message}`);
    }
  };

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

      {/* Pricing Page - Subscription plans */}
      <Route
        path="/pricing"
        element={
          <PricingPage
            onClose={() => window.history.back()}
            onSelectPlan={handleSelectPlan}
          />
        }
      />

      {/* Payment Success Page - Handle subscription activation */}
      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccessPage />
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