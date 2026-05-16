import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export const STORAGE_KEY = 'journee_bookings';

export const getBookings = (): Booking[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((b: any) => ({
      ...b,
      checkIn: new Date(b.checkIn),
      checkOut: new Date(b.checkOut)
    }));
  } catch (e) {
    console.error('Failed to parse bookings', e);
    return [];
  }
};

export const saveBookings = (bookings: Booking[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const isDateRangeAvailable = (checkIn: Date, checkOut: Date, bookings: Booking[], excludeBookingId?: string) => {
  return !bookings.some(booking => {
    if (booking.id === excludeBookingId) return false;
    if (booking.status === 'cancelled') return false;
    
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    
    // Overlap condition
    return (checkIn < end && checkOut > start);
  });
};
