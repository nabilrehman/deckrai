import React from 'react';
import { LeftPanel } from '../components/LeftPanel';
import { BookingWidget } from '../components/BookingWidget';

export const BookDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pattern-grid-lg p-0 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-[1400px] bg-white rounded-none md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-screen md:min-h-0">
        {/* Left Marketing Panel */}
        <LeftPanel />

        {/* Right Booking Widget */}
        <div className="flex-1 lg:w-2/3 flex flex-col relative p-6 lg:p-12">
          {/* Login Link - Desktop Only */}
          <div className="hidden lg:flex justify-end mb-6">
            <a
              href="/login"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Already have an account? <span className="text-blue-600 hover:text-blue-800">Sign In</span>
            </a>
          </div>

          {/* Booking Widget - Centered and Contained */}
          <div className="flex-1 flex items-start justify-center lg:items-center">
            <div className="w-full max-w-2xl">
              <BookingWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
