import React from 'react';
import { LeftPanel } from '../components/LeftPanel';
import { BookingWidget } from '../components/BookingWidget';

export const BookDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pattern-grid-lg p-0 md:p-4 flex items-center justify-center">
      <div className="w-full max-w-[1400px] bg-white rounded-none md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-screen lg:h-[90vh] lg:max-h-[850px]">
        {/* Left Marketing Panel - 33-40% width */}
        <div className="w-full lg:w-5/12 xl:w-1/3">
          <LeftPanel />
        </div>

        {/* Right Booking Widget - 60-67% width */}
        <div className="w-full lg:w-7/12 xl:w-2/3 flex flex-col relative p-6">
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
          <div className="flex-1 h-full flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <BookingWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
