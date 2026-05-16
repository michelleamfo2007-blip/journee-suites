import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, isAfter, startOfToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Wifi, 
  Wind, 
  Utensils, 
  Coffee, 
  Tv, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Camera, 
  ChevronRight, 
  ChevronLeft,
  X,
  CreditCard,
  CheckCircle2,
  Settings,
  MoveHorizontal
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from '@emailjs/browser';
import { cn, getBookings, saveBookings, isDateRangeAvailable, type Booking, STORAGE_KEY } from './lib/utils';

const PRICE_PER_NIGHT = 120;

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    setBookings(getBookings());
  }, []);

  const handleBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'confirmed'
    };
    
    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    saveBookings(updatedBookings);
    setBookingSuccess(newBooking);

    // Send Email Notifications via EmailJS
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const adminTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const guestTemplateId = import.meta.env.VITE_EMAILJS_GUEST_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && publicKey && serviceId !== 'your_service_id') {
      const templateParams = {
        to_email: import.meta.env.VITE_NOTIFICATION_EMAIL,
        guest_name: newBooking.name,
        guest_email: newBooking.email,
        check_in: format(newBooking.checkIn, 'MMM d, yyyy'),
        check_out: format(newBooking.checkOut, 'MMM d, yyyy'),
        total_price: `$${newBooking.totalPrice}`,
        booking_id: newBooking.id
      };

      try {
        // Send Admin Notification
        if (adminTemplateId) {
          await emailjs.send(serviceId, adminTemplateId, templateParams, publicKey);
        }
        
        // Send Guest Confirmation
        if (guestTemplateId) {
          await emailjs.send(serviceId, guestTemplateId, {
            ...templateParams,
            to_email: newBooking.email // Overwrite to_email for guest
          }, publicKey);
        }
      } catch (error) {
        console.error('Failed to send notification emails:', error);
      }
    }
  };

  const cancelBooking = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    setBookings(updated);
    saveBookings(updated);
  };

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text">
      <Navbar onAdminClick={() => setIsAdminOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <HeroSection onStartTour={() => setIsTourOpen(true)} />
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-24 lg:mt-32 relative z-0">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-16">
            <motion.section
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <RoomDetails />
            </motion.section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <SectionTitle title="Amenities" />
                <AmenitiesList />
              </motion.section>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <SectionTitle title="Availability" />
                <AvailabilitySection bookings={bookings} />
              </motion.section>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <HouseRules />
            </motion.div>
          </div>

          {/* Sticky Sidebar Booking Widget */}
          <div className="lg:col-span-4">
            <motion.div 
              className="sticky top-28"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <BookingWidget bookings={bookings} onBooking={handleBooking} />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Virtual Tour Modal */}
      <AnimatePresence>
        {isTourOpen && (
          <VirtualTour onClose={() => setIsTourOpen(false)} />
        )}
      </AnimatePresence>

      <Footer />

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <Modal onClose={() => setIsAdminOpen(false)}>
            {!isAdminAuthenticated ? (
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4 font-display">Admin Access</h2>
                <p className="text-slate-600 mb-6">Enter password to manage bookings.</p>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (adminPassword === 'Splash@24') setIsAdminAuthenticated(true);
                      else alert('Incorrect password');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (adminPassword === 'Splash@24') setIsAdminAuthenticated(true);
                    else alert('Incorrect password');
                  }}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                >
                  Login
                </button>
              </div>
            ) : (
              <AdminPanel bookings={bookings} onCancel={cancelBooking} />
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {bookingSuccess && (
          <Modal onClose={() => setBookingSuccess(null)}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold font-display mb-2">Booking Confirmed!</h2>
              <p className="text-slate-600 mb-6">
                Thank you, {bookingSuccess.name}. Your stay at Journee Suites is booked for{' '}
                {format(bookingSuccess.checkIn, 'MMM d')} - {format(bookingSuccess.checkOut, 'MMM d, yyyy')}.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-mono font-medium">{bookingSuccess.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Price:</span>
                  <span className="font-bold">${bookingSuccess.totalPrice}</span>
                </div>
              </div>
              <button 
                onClick={() => setBookingSuccess(null)}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Navbar({ onAdminClick }: { onAdminClick: () => void }) {
  return (
    <nav className="h-24 bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-end justify-between pb-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black/40 mb-1 leading-none">Boutique Stay • Accra, Achimota</span>
          <h1 className="serif text-3xl font-black leading-none">Journee Suites</h1>
        </div>
        
        <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.15em] font-bold">
          <a href="#" className="border-b border-black pb-0.5">Showcase</a>
          <button 
            onClick={onAdminClick}
            className="text-black/40 hover:text-black transition-colors"
          >
            Management
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onStartTour }: { onStartTour: () => void }) {
  const images = [
    { url: '/living.png', title: 'Main Living Area' },
    { url: '/kitchen.png', title: 'Designer Kitchen' },
    { url: '/bedroom.png', title: 'Serene Bedroom' },
    { url: '/bathroom.png', title: 'Rainfall Bathroom' },
    { url: '/compound.png', title: 'Private Compound' }
  ];

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[600px]">
        <div className="col-span-1 lg:col-span-9 relative group overflow-hidden rounded-[32px] aspect-[4/3] lg:aspect-auto">
          <img src={images[0].url} alt={images[0].title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-editorial-text shadow-sm">
              {images[0].title}
            </div>
            <button 
              onClick={onStartTour}
              className="bg-black text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg flex items-center gap-2"
            >
              <Camera className="w-3 h-3" /> Start Tour
            </button>
          </div>
        </div>
        <div className="col-span-1 lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="relative overflow-hidden rounded-[32px] group cursor-pointer aspect-square lg:aspect-auto lg:flex-1" onClick={onStartTour}>
            <img src={images[1].url} alt={images[1].title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
          <div className="relative overflow-hidden rounded-[32px] text-white group cursor-pointer aspect-square lg:aspect-auto lg:flex-1" onClick={onStartTour}>
            <img src={images[2].url} alt={images[2].title} className="w-full h-full object-cover brightness-75 grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <span className="font-bold text-sm tracking-[0.2em] uppercase">+4 Views</span>
              <span className="text-[9px] uppercase tracking-widest mt-1 opacity-60 italic">Explore Space</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="serif text-3xl font-bold text-editorial-text mb-6">{title}</h2>;
}

function RoomDetails() {
  const zones = [
    { name: 'Kitchen', desc: 'Wolf range, Microwave, French press, Sub-zero fridge.' },
    { name: 'Amenities', desc: 'Fiber WiFi (1Gbps), Central AC, Smart TV.' }
  ];

  return (
    <div className="space-y-12">
      <div className="max-w-2xl">
        <h2 className="serif text-5xl mb-8 tracking-tight">About the Space</h2>
        <p className="text-xl leading-relaxed opacity-70 font-light">
          A light-filled, 450 sq ft architectural studio in the heart of Achimota. Designed for functional elegance with a full designer kitchen, rain shower, and custom-built dining nook.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {zones.map((zone, idx) => (
          <motion.div 
            key={zone.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="group p-8 border border-black/5 rounded-[32px] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-500"
          >
            <span className="block text-[11px] uppercase font-black opacity-30 tracking-[0.2em] mb-4 group-hover:opacity-100 group-hover:text-black transition-opacity">{zone.name}</span>
            <p className="text-base font-semibold leading-relaxed tracking-tight text-editorial-text/90">{zone.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AmenitiesList() {
  const amenities = [
    { icon: Wifi, label: 'Fiber WiFi' },
    { icon: Wind, label: 'Central AC' },
    { icon: Utensils, label: 'Wolf Range' },
    { icon: Coffee, label: 'French Press' },
    { icon: Tv, label: 'Smart TV' },
    { icon: Wind, label: 'Microwave' },
    { icon: ShieldCheck, label: 'Secure Entry' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {amenities.map((item) => (
        <div key={item.label} className="flex items-center gap-3 py-2">
          <item.icon className="w-4 h-4 opacity-40" />
          <span className="text-xs uppercase tracking-widest font-bold opacity-60">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HouseRules() {
  const rules = [
    'Check-in: After 3:00 PM',
    'Check-out: 11:00 AM',
    'No smoking indoors',
    'No parties or events',
    'Max 4 guests'
  ];

  return (
    <div className="bg-slate-900 text-white p-8 rounded-2xl">
      <h2 className="text-2xl font-display font-semibold mb-6">House Rules & Policy</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <ul className="space-y-3">
          {rules.map((rule) => (
            <li key={rule} className="flex items-center gap-3 text-slate-300">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              {rule}
            </li>
          ))}
        </ul>
        <div className="p-4 bg-slate-800 rounded-xl space-y-2">
          <h4 className="font-semibold">Cancellation Policy</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Full refund for cancellations made within 48 hours of booking, if the check-in date is at least 14 days away. 50% refund for cancellations made at least 7 days before check-in.
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingWidget({ bookings, onBooking }: { bookings: Booking[], onBooking: (data: any) => void }) {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [details, setDetails] = useState({ name: '', email: '', phone: '', guests: 1 });
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const nights = range.from && range.to ? Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 3600 * 24)) : 0;
  const totalPrice = nights * PRICE_PER_NIGHT;

  // Booked dates for day picker
  const disabledDays = (date: Date) => {
    if (isBefore(date, startOfToday())) return true;
    return bookings.some(b => {
      if (b.status === 'cancelled') return false;
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      return date >= start && date < end;
    });
  };

  const validateDates = () => {
    if (!range.from || !range.to) return false;
    if (!isDateRangeAvailable(range.from, range.to, bookings)) {
      setError('Date overlap detected.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateDates() && nights > 0) setStep(2);
    else if (nights === 0) setError('Please select a range of at least 1 night.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!range.from || !range.to) return;
    
    if (validateDates()) {
      onBooking({
        ...details,
        checkIn: range.from,
        checkOut: range.to,
        totalPrice
      });
      setRange({});
      setDetails({ name: '', email: '', phone: '', guests: 1 });
      setStep(1);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-black/10 rounded-[32px] p-6 shadow-sm overflow-hidden flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <span className="serif text-4xl">${PRICE_PER_NIGHT}<span className="text-sm font-sans italic opacity-40"> / night</span></span>
          <span className="text-[10px] uppercase font-bold opacity-50 underline tracking-wider">★ 4.98 (124)</span>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 border border-black/20 rounded-2xl overflow-hidden">
              <div 
                className="p-4 border-r border-black/20 bg-editorial-bg/30 cursor-pointer hover:bg-editorial-bg/50 transition-colors"
                onClick={() => setRange({})}
              >
                <label className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Check-in</label>
                <div className="text-xs font-bold">{range.from ? format(range.from, 'MM / dd / yy') : 'Select'}</div>
              </div>
              <div 
                className="p-4 bg-editorial-bg/30 cursor-pointer hover:bg-editorial-bg/50 transition-colors"
                onClick={() => setRange(prev => ({ from: prev.from }))}
              >
                <label className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Checkout</label>
                <div className="text-xs font-bold">{range.to ? format(range.to, 'MM / dd / yy') : 'Select'}</div>
              </div>
              <div className="col-span-2 p-4 border-t border-black/20 flex justify-between items-center bg-editorial-bg/10 cursor-pointer">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-40">Guests</label>
                <select 
                  className="text-xs font-bold outline-none bg-transparent"
                  value={details.guests}
                  onChange={e => setDetails({...details, guests: Number(e.target.value)})}
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <DayPicker
                mode="range"
                defaultMonth={new Date(2027, 0)}
                selected={range}
                onSelect={(range) => {
                  setRange(range || {});
                  setError(null);
                }}
                disabled={disabledDays}
                className="editorial-calendar"
              />
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>}

            <button 
              disabled={!range.from || !range.to || nights === 0}
              onClick={handleNext}
              className="w-full bg-[#1F2937] text-white py-6 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase hover:bg-black disabled:opacity-20 transition-all shadow-xl shadow-black/5 active:scale-[0.98]"
            >
              Check Availability
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <button onClick={() => setStep(1)} className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center hover:opacity-100">
              <ChevronLeft className="w-3 h-3 mr-1" /> Back to dates
            </button>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Full Name</label>
                <input 
                  required
                  className="w-full p-4 border border-black/10 rounded-2xl focus:border-black outline-none text-xs font-medium bg-editorial-bg/20"
                  value={details.name}
                  onChange={e => setDetails({...details, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-1">Email Address</label>
                <input 
                  required type="email"
                  className="w-full p-4 border border-black/10 rounded-2xl focus:border-black outline-none text-xs font-medium bg-editorial-bg/20"
                  value={details.email}
                  onChange={e => setDetails({...details, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 py-4 border-y border-black/5">
              <div className="flex justify-between text-xs">
                <span className="opacity-40 font-medium">${PRICE_PER_NIGHT} x {nights} nights</span>
                <span className="font-bold">${totalPrice}</span>
              </div>
              <div className="flex justify-between text-xs font-black pt-2 border-t border-black/5 uppercase tracking-widest">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#1F2937] text-white py-6 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase hover:bg-black transition-all shadow-xl shadow-black/5 active:scale-[0.98]"
            >
              Confirm Reservation
            </button>
          </form>
        )}
      </div>

      <div className="bg-[#F27D26]/5 p-6 rounded-[32px] border border-[#F27D26]/10">
        <span className="text-[10px] uppercase font-bold text-[#F27D26] tracking-widest">Rare Find</span>
        <p className="text-xs leading-relaxed mt-2 opacity-70">
          This studio is usually fully booked. The dates you've selected are currently available.
        </p>
      </div>
    </div>
  );
}

function AvailabilitySection({ bookings }: { bookings: Booking[] }) {
  const [month, setMonth] = useState(new Date(2027, 0));
  
  const disabledDays = (date: Date) => {
    return bookings.some(b => {
      if (b.status === 'cancelled') return false;
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      return date >= start && date < end;
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6">
      <p className="text-slate-500 mb-6 font-light">Select your dates on the left to see exact pricing. Booked dates are shown in the calendar below.</p>
      <div className="flex justify-center border border-slate-50 rounded-xl p-4 bg-slate-50/50">
        <DayPicker
          month={month}
          onMonthChange={setMonth}
          disabled={disabledDays}
          className="mx-auto"
          modifiersClassNames={{
            disabled: 'text-slate-300 line-through'
          }}
        />
      </div>
    </div>
  );
}

function AdminPanel({ bookings, onCancel }: { bookings: Booking[], onCancel: (id: string) => void }) {
  return (
    <div className="p-6 h-[80vh] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Booking Dashboard</h2>
          <p className="text-sm text-slate-500">Manage your studio inventory and reservations.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button 
            onClick={() => {
              if (confirm('Clear all bookings? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }}
            className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
          >
            Clear All
          </button>
          <div className="text-center">
            <div className="text-slate-400 uppercase text-[10px] font-bold">Total</div>
            <div className="font-bold">{bookings.length}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 uppercase text-[10px] font-bold">Active</div>
            <div className="font-bold">{bookings.filter(b => b.status === 'confirmed').length}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {bookings.length === 0 ? (
          <div className="text-center py-20 text-slate-400 italic">No bookings yet.</div>
        ) : (
          bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(booking => (
            <div key={booking.id} className={cn(
              "p-4 border rounded-xl transition-all",
              booking.status === 'cancelled' ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200"
            )}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-900">{booking.name}</h4>
                  <p className="text-xs text-slate-500">{booking.email}</p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  booking.status === 'confirmed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {booking.status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs mt-3 bg-slate-50 p-3 rounded-lg">
                <div>
                  <span className="text-slate-400 uppercase font-bold block mb-1">Dates</span>
                  <span className="text-slate-700 font-medium">{format(booking.checkIn, 'MMM d')} - {format(booking.checkOut, 'MMM d')}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold block mb-1">Total Price</span>
                  <span className="text-slate-700 font-bold">${booking.totalPrice}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Booked on {format(new Date(booking.createdAt), 'MMM d, p')}</span>
                {booking.status === 'confirmed' && (
                  <button 
                    onClick={() => onCancel(booking.id)}
                    className="text-xs text-red-600 font-medium hover:underline"
                  >
                    Cancel Reservation
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function VirtualTour({ onClose }: { onClose: () => void }) {
  const [activeView, setActiveView] = useState(0);
  const views = [
    { title: 'The Living Space', image: '/living.png', desc: 'Central living area with custom furniture and integrated sleeping space.' },
    { title: 'Designer Kitchen', image: '/kitchen.png', desc: 'Fully equipped kitchenette with sub-zero refrigeration, Wolf range, and microwave.' },
    { title: '360° Panorama', image: '/panorama.png', desc: 'Immersive wide-angle view of the architectural studio. Click and drag to explore.', is360: true },
    { title: 'Serene Bedroom', image: '/bedroom.png', desc: 'Premium sleeping area with high-end linens and architectural lighting.' },
    { title: 'Rainfall Bathroom', image: '/bathroom.png', desc: 'Minimalist bathroom with local limestone tiles and walk-in rain shower.' },
    { title: 'The Compound', image: '/compound.png', desc: 'Private exterior area with modern landscaping and evening lighting.' }
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-editorial-bg border-r border-black/10 flex flex-col h-full z-10">
        <div className="p-8 border-b border-black/5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-black/30 mb-0.5">Interactive Tour</span>
            <h2 className="serif text-2xl leading-none">Perspective</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {views.map((view, idx) => (
            <button
              key={view.title}
              onClick={() => setActiveView(idx)}
              className={cn(
                "w-full p-4 rounded-2xl text-left transition-all group relative overflow-hidden",
                activeView === idx ? "bg-white shadow-xl shadow-black/5 border border-black/5" : "hover:bg-black/5 opacity-40 hover:opacity-100"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black opacity-20">0{idx + 1}</span>
                <span className="text-xs font-bold uppercase tracking-widest">{view.title}</span>
                {view.is360 && (
                  <span className="ml-auto text-[8px] bg-black text-white px-1.5 py-0.5 rounded-full font-black">360°</span>
                )}
              </div>
              {activeView === idx && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  className="text-[10px] mt-2 leading-relaxed font-medium"
                >
                  {view.desc}
                </motion.p>
              )}
            </button>
          ))}
        </div>

        <div className="p-8 bg-black text-white">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
            <span>Location</span>
            <span>Accra, Achimota</span>
          </div>
          <div className="w-full h-px bg-white/10 mb-4" />
          <p className="text-[9px] leading-relaxed opacity-40 uppercase tracking-widest">
            Hand-crafted architectural details defined by Lumina Studio design practice.
          </p>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="w-full h-full relative flex items-center justify-center"
          >
            {views[activeView].is360 ? (
              <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
                <motion.img 
                  drag="x"
                  dragConstraints={{ left: -1000, right: 0 }}
                  src={views[activeView].image} 
                  alt={views[activeView].title} 
                  className="h-full max-w-none min-w-[200%] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="bg-black/40 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <MoveHorizontal className="w-4 h-4" /> Drag to explore 360°
                  </motion.div>
                </div>
              </div>
            ) : (
              <img 
                src={views[activeView].image} 
                alt={views[activeView].title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute bottom-12 right-12 flex flex-col items-end text-white drop-shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
              <span className="text-[11px] uppercase tracking-[0.4em] font-black mb-2 opacity-60">View Details</span>
              <h3 className="serif text-5xl leading-none">{views[activeView].title}</h3>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <button 
          onClick={() => setActiveView(v => (v - 1 + views.length) % views.length)}
          className="absolute left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur hover:bg-white text-white hover:text-black rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveView(v => (v + 1) % views.length)}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 backdrop-blur hover:bg-white text-white hover:text-black rounded-full transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
          <motion.div 
            className="h-full bg-white"
            initial={false}
            animate={{ width: `${((activeView + 1) / views.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
        <span>©2027 Journee Boutique Stays</span>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span>Accra • Achimota • Ghana</span>
          <span>Studio 402</span>
        </div>
      </div>
    </footer>
  );
}
