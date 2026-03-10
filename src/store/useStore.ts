import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'operator' | 'admin';
}

export interface Bus {
  id: string;
  operatorId: string;
  operatorName: string;
  name: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  totalSeats: number;
  availableSeats: number[];
  bookedSeats: number[];
  type: 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Non-AC Seater';
}

export interface Booking {
  id: string;
  userId: string;
  busId: string;
  busName: string;
  from: string;
  to: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  seats: number[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
  paymentMethod: string;
  bookedAt: string;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  buses: Bus[];
  bookings: Booking[];
  login: (email: string, password: string) => boolean;
  register: (user: Omit<User, 'id' | 'role'>, password: string) => boolean;
  logout: () => void;
  searchBuses: (from: string, to: string, date: string) => Bus[];
  bookTicket: (booking: Omit<Booking, 'id' | 'bookedAt' | 'status'>) => Booking;
  cancelBooking: (bookingId: string) => void;
  addBus: (bus: Omit<Bus, 'id'>) => void;
  updateBus: (busId: string, updates: Partial<Bus>) => void;
  deleteBus: (busId: string) => void;
}

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow'];

const generateSeats = (total: number): { available: number[]; booked: number[] } => {
  const booked: number[] = [];
  const available: number[] = [];
  for (let i = 1; i <= total; i++) {
    if (Math.random() < 0.3) booked.push(i);
    else available.push(i);
  }
  return { available, booked };
};

const initialBuses: Bus[] = [
  { id: 'b1', operatorId: 'op1', operatorName: 'Royal Travels', name: 'Royal Express', from: 'Mumbai', to: 'Pune', departureTime: '06:00', arrivalTime: '10:00', date: '2026-03-15', price: 450, totalSeats: 36, ...(() => { const s = generateSeats(36); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'AC Sleeper' },
  { id: 'b2', operatorId: 'op1', operatorName: 'Royal Travels', name: 'Royal Deluxe', from: 'Mumbai', to: 'Pune', departureTime: '14:00', arrivalTime: '18:30', date: '2026-03-15', price: 350, totalSeats: 36, ...(() => { const s = generateSeats(36); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'Non-AC Seater' },
  { id: 'b3', operatorId: 'op2', operatorName: 'Metro Lines', name: 'Metro Night Rider', from: 'Delhi', to: 'Jaipur', departureTime: '22:00', arrivalTime: '04:30', date: '2026-03-15', price: 600, totalSeats: 30, ...(() => { const s = generateSeats(30); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'AC Sleeper' },
  { id: 'b4', operatorId: 'op2', operatorName: 'Metro Lines', name: 'Metro Express', from: 'Bangalore', to: 'Chennai', departureTime: '08:00', arrivalTime: '14:00', date: '2026-03-15', price: 500, totalSeats: 40, ...(() => { const s = generateSeats(40); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'AC Seater' },
  { id: 'b5', operatorId: 'op1', operatorName: 'Royal Travels', name: 'Royal Overnight', from: 'Mumbai', to: 'Bangalore', departureTime: '20:00', arrivalTime: '08:00', date: '2026-03-15', price: 1200, totalSeats: 30, ...(() => { const s = generateSeats(30); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'AC Sleeper' },
  { id: 'b6', operatorId: 'op3', operatorName: 'City Connect', name: 'City Shuttle', from: 'Hyderabad', to: 'Bangalore', departureTime: '07:00', arrivalTime: '17:00', date: '2026-03-15', price: 800, totalSeats: 36, ...(() => { const s = generateSeats(36); return { availableSeats: s.available, bookedSeats: s.booked }; })(), type: 'Non-AC Sleeper' },
];

const passwords = new Map<string, string>();
passwords.set('user@test.com', 'password');
passwords.set('operator@test.com', 'password');
passwords.set('admin@test.com', 'password');

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [
    { id: 'u1', name: 'Test User', email: 'user@test.com', phone: '9876543210', role: 'user' },
    { id: 'op1', name: 'Royal Travels', email: 'operator@test.com', phone: '9876543211', role: 'operator' },
    { id: 'a1', name: 'System Admin', email: 'admin@test.com', phone: '9876543212', role: 'admin' },
  ],
  buses: initialBuses,
  bookings: [
    { id: 'bk1', userId: 'u1', busId: 'b1', busName: 'Royal Express', from: 'Mumbai', to: 'Pune', date: '2026-03-10', departureTime: '06:00', arrivalTime: '10:00', seats: [5, 6], totalAmount: 900, status: 'confirmed', paymentMethod: 'UPI', bookedAt: '2026-03-08T10:30:00' },
    { id: 'bk2', userId: 'u1', busId: 'b3', busName: 'Metro Night Rider', from: 'Delhi', to: 'Jaipur', date: '2026-03-05', departureTime: '22:00', arrivalTime: '04:30', seats: [12], totalAmount: 600, status: 'cancelled', paymentMethod: 'Credit Card', bookedAt: '2026-03-03T15:00:00' },
  ],

  login: (email, password) => {
    const storedPw = passwords.get(email);
    if (storedPw !== password) return false;
    const user = get().users.find(u => u.email === email);
    if (!user) return false;
    set({ currentUser: user });
    return true;
  },

  register: (userData, password) => {
    if (get().users.find(u => u.email === userData.email)) return false;
    const newUser: User = { ...userData, id: 'u' + Date.now(), role: 'user' };
    passwords.set(userData.email, password);
    set(s => ({ users: [...s.users, newUser], currentUser: newUser }));
    return true;
  },

  logout: () => set({ currentUser: null }),

  searchBuses: (from, to, date) => {
    return get().buses.filter(b =>
      b.from.toLowerCase() === from.toLowerCase() &&
      b.to.toLowerCase() === to.toLowerCase() &&
      b.date === date
    );
  },

  bookTicket: (bookingData) => {
    const booking: Booking = {
      ...bookingData,
      id: 'bk' + Date.now(),
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
    };
    set(s => {
      const buses = s.buses.map(b => {
        if (b.id === bookingData.busId) {
          return {
            ...b,
            availableSeats: b.availableSeats.filter(seat => !bookingData.seats.includes(seat)),
            bookedSeats: [...b.bookedSeats, ...bookingData.seats],
          };
        }
        return b;
      });
      return { bookings: [...s.bookings, booking], buses };
    });
    return booking;
  },

  cancelBooking: (bookingId) => {
    set(s => {
      const booking = s.bookings.find(b => b.id === bookingId);
      if (!booking) return s;
      const bookings = s.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      );
      const buses = s.buses.map(b => {
        if (b.id === booking.busId) {
          return {
            ...b,
            availableSeats: [...b.availableSeats, ...booking.seats].sort((a, b) => a - b),
            bookedSeats: b.bookedSeats.filter(seat => !booking.seats.includes(seat)),
          };
        }
        return b;
      });
      return { bookings, buses };
    });
  },

  addBus: (busData) => {
    const bus: Bus = { ...busData, id: 'b' + Date.now() };
    set(s => ({ buses: [...s.buses, bus] }));
  },

  updateBus: (busId, updates) => {
    set(s => ({
      buses: s.buses.map(b => b.id === busId ? { ...b, ...updates } : b),
    }));
  },

  deleteBus: (busId) => {
    set(s => ({ buses: s.buses.filter(b => b.id !== busId) }));
  },
}));

export const CITIES_LIST = CITIES;
