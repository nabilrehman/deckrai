import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, ArrowLeft, Check, Loader2, Globe, User } from 'lucide-react';
import {
  format,
  addMonths,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  endOfWeek
} from 'date-fns';
import { UserDetails, TimeSlot, BookingStep } from '../types/booking';
import { getAvailableSlots, formatDateFull, formatTime, simulateEmailSending } from '../utils/dateUtils';

export const BookingWidget: React.FC = () => {
  // State
  const [step, setStep] = useState<BookingStep>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userDetails, setUserDetails] = useState<UserDetails>({
    firstName: '',
    lastName: '',
    email: '',
    company: ''
  });

  // Derived State
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(monthStart);
  const startDate = new Date(monthStart);
  startDate.setDate(monthStart.getDate() - monthStart.getDay());
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  // Effects
  useEffect(() => {
    if (selectedDate) {
      // Simulate fetching slots for this date
      setAvailableSlots(getAvailableSlots(selectedDate));
      setSelectedTime(null);
    }
  }, [selectedDate]);

  // Handlers
  const handleDateClick = (date: Date) => {
    // Prevent selecting past days (simple check)
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return;

    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to backend
    await simulateEmailSending(userDetails.email, {
      ...userDetails,
      date: selectedDate,
      time: selectedTime,
      hostEmail: 'nabilrehman8@gmail.com'
    });

    setIsSubmitting(false);
    setStep('success');
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render Functions
  const renderCalendar = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Select a Date & Time</h2>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
           <Clock className="w-4 h-4" />
           <span>30 min</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Calendar Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-slate-800 pl-1">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-4 gap-x-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[11px] font-semibold tracking-wide uppercase text-slate-400 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const today = new Date();
              today.setHours(0,0,0,0);
              const isPast = day < today;

              return (
                <div key={day.toISOString()} className="flex justify-center">
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={isPast}
                    className={`
                      h-10 w-10 md:h-11 md:w-11 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 relative
                      ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-100' : 'hover:bg-blue-50 hover:text-blue-600'}
                      ${isTodayDate && !isSelected ? 'text-blue-600 font-bold bg-blue-50/50' : ''}
                      ${isPast ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {isTodayDate && !isSelected && (
                      <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-400">
             <Globe className="w-3.5 h-3.5" />
             <span>Timezone: America/Chicago (CST)</span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="md:w-[280px] md:border-l md:pl-8 border-slate-100 animate-in slide-in-from-right-2 duration-300">
           <h3 className="font-semibold text-slate-700 mb-5 h-6 flex items-center gap-2">
             {selectedDate ? (
               <>
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                 {format(selectedDate, 'EEEE, MMM d')}
               </>
             ) : (
               <span className="text-slate-400 font-normal">Select a date above</span>
             )}
           </h3>

           <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {!selectedDate ? (
               <div className="flex flex-col items-center justify-center h-48 text-slate-300 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                 <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
                 <span className="text-sm">No date selected</span>
               </div>
             ) : (
               availableSlots.map((slot) => (
                 <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => handleTimeSelect(slot.time)}
                    className={`
                      w-full py-3 px-4 text-sm rounded-lg border flex items-center justify-center transition-all duration-200 group relative overflow-hidden
                      ${slot.available
                        ? 'border-blue-100 text-blue-700 bg-white hover:border-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md font-medium'
                        : 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'}
                    `}
                 >
                   <span className="relative z-10">{formatTime(slot.time)}</span>
                 </button>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-lg mx-auto">
      <button
        onClick={() => setStep('calendar')}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-8 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-2 group-hover:bg-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Calendar
      </button>

      <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50 blur-2xl"></div>

        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
             <CalendarIcon className="w-5 h-5" />
          </div>
          Booking Summary
        </h3>

        <div className="space-y-3 pl-1">
          <div className="flex items-center gap-3 text-slate-700">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-medium">30 min</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span className="font-medium">{selectedDate && formatDateFull(selectedDate)}</span> at <span className="font-medium">{selectedTime && formatTime(selectedTime)}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 pt-2 border-t border-slate-100">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-sm">Host: <span className="font-semibold text-slate-900">Nabil Rehman, Co-founder Deckr</span></span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Enter Details</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">First Name <span className="text-blue-600">*</span></label>
            <input
              required
              type="text"
              name="firstName"
              value={userDetails.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Jane"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Last Name <span className="text-blue-600">*</span></label>
            <input
              required
              type="text"
              name="lastName"
              value={userDetails.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Business Email <span className="text-blue-600">*</span></label>
          <input
            required
            type="email"
            name="email"
            value={userDetails.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            placeholder="jane@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Company Name</label>
          <input
            type="text"
            name="company"
            value={userDetails.company}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
            placeholder="Acme Inc."
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed border-t border-white/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              'Schedule Meeting'
            )}
          </button>
          <p className="text-xs text-slate-400 text-center mt-4">
            By submitting this form, you agree to Deckr's Privacy Policy and Terms of Service.
          </p>
        </div>
      </form>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 text-center px-6">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-green-50/50">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
           <Check className="w-8 h-8 text-white stroke-[3]" />
        </div>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-3">You're booked!</h2>
      <p className="text-slate-600 max-w-md mb-10 text-lg">
        A calendar invitation has been sent to <span className="font-semibold text-slate-900">{userDetails.email}</span>.
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
                {selectedDate && formatDateFull(selectedDate)}
              </div>
              <div className="text-slate-500 font-medium">
                {selectedTime && formatTime(selectedTime)} - 30 min
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
          setStep('calendar');
          setSelectedDate(null);
          setSelectedTime(null);
          setUserDetails({firstName: '', lastName: '', email: '', company: ''});
        }}
        className="mt-10 text-blue-600 font-semibold hover:text-blue-800 transition-colors"
      >
        Schedule another meeting
      </button>
    </div>
  );

  return (
    <div className="bg-white h-full w-full rounded-2xl md:p-8 p-6 shadow-sm overflow-hidden flex flex-col relative">
       {/* Mobile branding header */}
       <div className="lg:hidden flex items-center gap-2 mb-6 pb-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">D</div>
          <span className="font-bold text-xl tracking-tight text-slate-900">deckr.ai</span>
       </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {step === 'calendar' && renderCalendar()}
        {step === 'details' && renderDetailsForm()}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
};
