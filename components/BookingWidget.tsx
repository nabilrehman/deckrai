import React, { useState } from 'react';
import { InlineWidget } from 'react-calendly';
import { Check, Calendar as CalendarIcon, Globe, User } from 'lucide-react';

export const BookingWidget: React.FC = () => {
  // State
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Calendly event listener
  const handleCalendlyEvent = (event: MessageEvent) => {
    if (event.data.event && event.data.event === 'calendly.event_scheduled') {
      // Extract booking details from Calendly
      const payload = event.data.payload;

      // Debug: Log payload to understand structure
      console.log('Calendly payload:', payload);

      // Try multiple paths to extract email (Calendly structure varies)
      const email = payload?.invitee?.email ||
                    payload?.email ||
                    payload?.invitee_email ||
                    'your email';

      const name = payload?.invitee?.name ||
                   payload?.name ||
                   'Guest';

      setBookingDetails({
        name: name,
        email: email,
        eventName: payload?.event?.name || payload?.event_type_name || 'Demo Call',
        startTime: payload?.event?.start_time || payload?.start_time || new Date().toISOString(),
        endTime: payload?.event?.end_time || payload?.end_time || new Date().toISOString(),
      });
      setShowSuccess(true);
    }
  };

  // Set up Calendly event listener
  React.useEffect(() => {
    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, []);

  // Format date from ISO string
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      return '';
    }
  };

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch {
      return '';
    }
  };

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 text-center px-6">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
           <Check className="w-8 h-8 text-white stroke-[3]" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3">You're booked!</h2>
      <p className="text-slate-600 max-w-md mb-10 text-lg">
        A calendar invitation has been sent to <span className="font-semibold text-slate-900">{bookingDetails?.email}</span>.
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm w-full max-w-sm text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Meeting Details</h4>
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <CalendarIcon className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-lg">
                {bookingDetails?.startTime && formatDate(bookingDetails.startTime)}
              </div>
              <div className="text-slate-500 font-medium">
                {bookingDetails?.startTime && formatTime(bookingDetails.startTime)} - 30 min
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Globe className="w-5 h-5 shrink-0" />
             </div>
             <div className="text-sm font-medium text-slate-600">Google Meet (Link in email)</div>
          </div>
          <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <User className="w-5 h-5 shrink-0" />
             </div>
             <div className="text-sm font-medium text-slate-600">Host: Nabil Rehman</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setShowSuccess(false);
          setBookingDetails(null);
        }}
        className="mt-10 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
      >
        Schedule another meeting
      </button>
    </div>
  );

  return (
    <div className="bg-white w-full rounded-2xl p-6 shadow-lg border border-slate-200">
       {/* Mobile branding header */}
       <div className="lg:hidden flex items-center gap-2 mb-6 pb-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">D</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">deckr.ai</span>
       </div>

      {showSuccess ? (
        renderSuccess()
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Your Demo</h2>
            <p className="text-slate-600 text-sm">
              Select a time that works for you
            </p>
          </div>

          {/* Calendly Inline Widget */}
          <div className="calendly-inline-widget-container">
            <InlineWidget
              url="https://calendly.com/nabilrehman8"
              styles={{
                height: '520px',
                width: '100%'
              }}
              pageSettings={{
                backgroundColor: 'ffffff',
                hideEventTypeDetails: false,
                hideLandingPageDetails: false,
                primaryColor: '2563eb',
                textColor: '0f172a'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
