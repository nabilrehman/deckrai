import { TimeSlot } from '../types/booking';

// Mock availability generator simulating Google Calendar API
export const getAvailableSlots = (date: Date): TimeSlot[] => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (isWeekend) return [];

  // Generate slots from 9 AM to 5 PM
  const slots: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '09:30', available: true },
    { time: '10:00', available: false }, // Simulate busy
    { time: '10:30', available: true },
    { time: '11:00', available: true },
    { time: '13:00', available: true },
    { time: '13:30', available: false }, // Simulate busy
    { time: '14:00', available: true },
    { time: '14:30', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
  ];

  return slots;
};

export const formatDateFull = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

export const simulateEmailSending = async (email: string, details: any) => {
  // In a real app, this would be a fetch call to your backend or EmailJS
  console.log(`Sending email to nabilrehman8@gmail.com with details:`, details);
  console.log(`Sending invite to ${email}`);

  return new Promise((resolve) => {
    setTimeout(resolve, 2000); // Simulate network latency
  });
};
