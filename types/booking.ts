export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
}

export interface TimeSlot {
  time: string; // e.g., "09:30"
  available: boolean;
}

export type BookingStep = 'calendar' | 'details' | 'success';

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
}
