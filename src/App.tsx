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
  MoveHorizontal,
  Moon,
  Sun
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
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

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
    <div className={cn("min-h-screen transition-all duration-500", isDarkMode ? "bg-slate-950 text-white" : "bg-editorial-bg text-editorial-text")}>
      <Navbar onAdminClick={() => setIsAdminOpen(true)} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
      
      <main className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <HeroSection onStartTour={() => setIsTourOpen(true)} isDarkMode={isDarkMode} />
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
              <RoomDetails isDarkMode={isDarkMode} />
            </motion.section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <SectionTitle title="Amenities" isDarkMode={isDarkMode} />
                <AmenitiesList isDarkMode={isDarkMode} />
              </motion.section>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <SectionTitle title="Availability" isDarkMode={isDarkMode} />
                <AvailabilitySection bookings={bookings} isDarkMode={isDarkMode} />
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
              <BookingWidget bookings={bookings} onBooking={handleBooking} isDarkMode={isDarkMode} />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Virtual Tour Modal */}
      <AnimatePresence>
        {isTourOpen && (
          <VirtualTour onClose={() => setIsTourOpen(false)} isDarkMode={isDarkMode} />
        )}
      </AnimatePresence>

      <Footer isDarkMode={isDarkMode} />

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminOpen && (
          <Modal onClose={() => setIsAdminOpen(false)} isDarkMode={isDarkMode}>
            {!isAdminAuthenticated ? (
              <div className="p-6">
                <h2 className={cn("text-2xl font-semibold mb-4 font-display transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>Admin Access</h2>
                <p className={cn("mb-6 transition-colors", isDarkMode ? "text-slate-400" : "text-slate-600")}>Enter password to manage bookings.</p>
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
                  className={cn(
                    "w-full py-3 rounded-lg font-medium transition-all active:scale-[0.98]",
                    isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  Login
                </button>
              </div>
            ) : (
              <AdminDashboard bookings={bookings} onCancel={cancelBooking} isDarkMode={isDarkMode} />
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {bookingSuccess && (
          <Modal onClose={() => setBookingSuccess(null)} isDarkMode={isDarkMode}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className={cn("text-2xl font-bold font-display mb-2 transition-colors", isDarkMode ? "text-white" : "text-black")}>Booking Confirmed!</h2>
              <p className={cn("mb-6 transition-colors", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                Thank you, {bookingSuccess.name}. Your stay at Journee Suites is booked for{' '}
                {format(bookingSuccess.checkIn, 'MMM d')} - {format(bookingSuccess.checkOut, 'MMM d, yyyy')}.
              </p>
              <div className={cn("p-4 rounded-lg text-left mb-6 space-y-2 transition-colors", isDarkMode ? "bg-white/5" : "bg-slate-50")}>
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
                className={cn(
                  "w-full py-3 rounded-lg font-medium transition-all active:scale-[0.98]",
                  isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
                )}
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

function Navbar({ onAdminClick, isDarkMode, onToggleDarkMode }: { onAdminClick: () => void, isDarkMode: boolean, onToggleDarkMode: () => void }) {
  return (
    <nav className={cn(
      "h-24 backdrop-blur-md border-b sticky top-0 z-40 transition-all duration-500",
      isDarkMode ? "bg-slate-900/80 border-white/5" : "bg-white/80 border-black/5"
    )}>
      <div className="max-w-7xl mx-auto h-full px-6 flex items-end justify-between pb-6">
        <div className="flex flex-col">
          <h1 className={cn("serif text-3xl font-black leading-none transition-colors", isDarkMode ? "text-white" : "text-black")}>Journee Suites</h1>
        </div>
        
        <div className="flex items-center gap-8 text-[11px] uppercase tracking-[0.15em] font-bold">
          <button 
            onClick={onToggleDarkMode}
            className={cn("p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5")}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
          <a href="#" className={cn("border-b pb-0.5 transition-colors", isDarkMode ? "border-white text-white" : "border-black text-black")}>Showcase</a>
          <button 
            onClick={onAdminClick}
            className={cn("transition-colors", isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")}
          >
            Management
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection({ onStartTour, isDarkMode }: { onStartTour: () => void, isDarkMode?: boolean }) {
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
            <div className={cn(
              "backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm transition-colors",
              isDarkMode ? "bg-slate-900/90 text-white" : "bg-white/90 text-editorial-text"
            )}>
              {images[0].title}
            </div>
            <button 
              onClick={onStartTour}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2",
                isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-black text-white hover:bg-slate-800"
              )}
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

function SectionTitle({ title, isDarkMode }: { title: string, isDarkMode?: boolean }) {
  return <h2 className={cn("serif text-3xl font-bold mb-6 transition-colors", isDarkMode ? "text-white" : "text-editorial-text")}>{title}</h2>;
}

function RoomDetails({ isDarkMode }: { isDarkMode?: boolean }) {
  const zones = [
    { name: 'Kitchen', desc: 'Wolf range, Microwave, French press, Sub-zero fridge.' },
    { name: 'Amenities', desc: 'Fiber WiFi (1Gbps), Central AC, Smart TV.' }
  ];

  return (
    <div className="space-y-12">
      <div className="max-w-2xl">
        <h2 className={cn("serif text-5xl mb-8 tracking-tight transition-colors", isDarkMode ? "text-white" : "text-black")}>About the Space</h2>
        <p className={cn("text-xl leading-relaxed font-light transition-colors", isDarkMode ? "text-slate-300" : "text-black opacity-70")}>
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
            className={cn(
              "group p-8 border rounded-[32px] transition-all duration-500",
              isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-black/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]"
            )}
          >
            <span className={cn("block text-[11px] uppercase font-black tracking-[0.2em] mb-4 transition-opacity", isDarkMode ? "text-white/20 group-hover:text-white" : "opacity-30 group-hover:opacity-100 group-hover:text-black")}>{zone.name}</span>
            <p className={cn("text-base font-semibold leading-relaxed tracking-tight transition-colors", isDarkMode ? "text-slate-100" : "text-editorial-text/90")}>{zone.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AmenitiesList({ isDarkMode }: { isDarkMode?: boolean }) {
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
          <item.icon className={cn("w-4 h-4 transition-colors", isDarkMode ? "text-slate-400" : "opacity-40")} />
          <span className={cn("text-xs uppercase tracking-widest font-bold transition-colors", isDarkMode ? "text-white/60" : "opacity-60")}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HouseRules({ isDarkMode }: { isDarkMode?: boolean }) {
  const rules = [
    'Check-in: After 3:00 PM',
    'Check-out: 11:00 AM',
    'No smoking indoors',
    'No parties or events',
    'Max 4 guests'
  ];

  return (
    <div className={cn(
      "p-8 rounded-2xl transition-all duration-500",
      isDarkMode ? "bg-slate-900 border border-white/5 text-white" : "bg-slate-900 text-white"
    )}>
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
        <div className={cn("p-4 rounded-xl space-y-2", isDarkMode ? "bg-white/5" : "bg-slate-800")}>
          <h4 className="font-semibold">Cancellation Policy</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Full refund for cancellations made within 48 hours of booking, if the check-in date is at least 14 days away. 50% refund for cancellations made at least 7 days before check-in.
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingWidget({ bookings, onBooking, isDarkMode }: { bookings: Booking[], onBooking: (data: any) => void, isDarkMode?: boolean }) {
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
      <div className={cn(
        "border rounded-[32px] p-6 shadow-sm transition-all duration-500 overflow-hidden flex flex-col gap-6",
        isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-black/10"
      )}>
        <div className="flex justify-between items-end">
          <span className={cn("serif text-4xl transition-colors", isDarkMode ? "text-white" : "text-black")}>
            ${PRICE_PER_NIGHT}
            <span className={cn("text-sm font-sans italic opacity-40 ml-1 transition-colors", isDarkMode ? "text-slate-400" : "text-black")}> / night</span>
          </span>
          <span className={cn("text-[10px] uppercase font-bold underline tracking-wider transition-colors", isDarkMode ? "text-white/40" : "opacity-50")}>★ 4.98 (124)</span>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className={cn(
              "grid grid-cols-2 border rounded-2xl overflow-hidden transition-colors",
              isDarkMode ? "border-white/10" : "border-black/20"
            )}>
              <div 
                className={cn(
                  "p-4 border-r cursor-pointer transition-colors",
                  isDarkMode ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/20 bg-editorial-bg/30 hover:bg-editorial-bg/50"
                )}
                onClick={() => setRange({})}
              >
                <label className={cn("block text-[9px] font-bold uppercase tracking-widest mb-1 transition-colors", isDarkMode ? "text-white/20" : "opacity-40")}>Check-in</label>
                <div className={cn("text-xs font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>{range.from ? format(range.from, 'MM / dd / yy') : 'Select'}</div>
              </div>
              <div 
                className={cn(
                  "p-4 cursor-pointer transition-colors",
                  isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-editorial-bg/30 hover:bg-editorial-bg/50"
                )}
                onClick={() => setRange(prev => ({ from: prev.from }))}
              >
                <label className={cn("block text-[9px] font-bold uppercase tracking-widest mb-1 transition-colors", isDarkMode ? "text-white/20" : "opacity-40")}>Checkout</label>
                <div className={cn("text-xs font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>{range.to ? format(range.to, 'MM / dd / yy') : 'Select'}</div>
              </div>
              <div className={cn(
                "col-span-2 p-4 border-t flex justify-between items-center cursor-pointer transition-colors",
                isDarkMode ? "border-white/10 bg-white/5" : "border-black/20 bg-editorial-bg/10"
              )}>
                <label className={cn("text-[9px] font-bold uppercase tracking-widest transition-colors", isDarkMode ? "text-white/20" : "opacity-40")}>Guests</label>
                <select 
                  className={cn("text-xs font-bold outline-none bg-transparent transition-colors", isDarkMode ? "text-white" : "text-black")}
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
                className={isDarkMode ? "dark-calendar" : "editorial-calendar"}
              />
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>}

            <button 
              disabled={!range.from || !range.to || nights === 0}
              onClick={handleNext}
              className={cn(
                "w-full py-6 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase transition-all shadow-xl active:scale-[0.98]",
                isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-[#1F2937] text-white hover:bg-black"
              )}
            >
              Check Availability
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <button onClick={() => setStep(1)} className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center transition-colors", isDarkMode ? "text-white/40 hover:text-white" : "opacity-40 hover:opacity-100")}>
              <ChevronLeft className="w-3 h-3 mr-1" /> Back to dates
            </button>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className={cn("text-[9px] font-bold uppercase tracking-widest px-1 transition-colors", isDarkMode ? "text-white/20" : "opacity-40")}>Full Name</label>
                <input 
                  required
                  className={cn(
                    "w-full p-4 border rounded-2xl outline-none text-xs font-medium transition-all",
                    isDarkMode ? "bg-white/5 border-white/10 focus:border-white text-white" : "bg-editorial-bg/20 border-black/10 focus:border-black text-black"
                  )}
                  value={details.name}
                  onChange={e => setDetails({...details, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className={cn("text-[9px] font-bold uppercase tracking-widest px-1 transition-colors", isDarkMode ? "text-white/20" : "opacity-40")}>Email Address</label>
                <input 
                  required type="email"
                  className={cn(
                    "w-full p-4 border rounded-2xl outline-none text-xs font-medium transition-all",
                    isDarkMode ? "bg-white/5 border-white/10 focus:border-white text-white" : "bg-editorial-bg/20 border-black/10 focus:border-black text-black"
                  )}
                  value={details.email}
                  onChange={e => setDetails({...details, email: e.target.value})}
                />
              </div>
            </div>

            <div className={cn("space-y-2 py-4 border-y transition-colors", isDarkMode ? "border-white/5" : "border-black/5")}>
              <div className="flex justify-between text-xs">
                <span className={cn("font-medium transition-colors", isDarkMode ? "text-white/40" : "opacity-40")}>${PRICE_PER_NIGHT} x {nights} nights</span>
                <span className={cn("font-bold transition-colors", isDarkMode ? "text-white" : "text-black")}>${totalPrice}</span>
              </div>
              <div className={cn("flex justify-between text-xs font-black pt-2 border-t uppercase tracking-widest transition-colors", isDarkMode ? "border-white/5 text-white" : "border-black/5 text-black")}>
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <button 
              type="submit"
              className={cn(
                "w-full py-6 rounded-2xl font-black text-[11px] tracking-[0.25em] uppercase transition-all shadow-xl active:scale-[0.98]",
                isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-[#1F2937] text-white hover:bg-black"
              )}
            >
              Confirm Reservation
            </button>
          </form>
        )}
      </div>

      <div className={cn(
        "p-6 rounded-[32px] border transition-all duration-500",
        isDarkMode ? "bg-[#F27D26]/10 border-[#F27D26]/20" : "bg-[#F27D26]/5 border-[#F27D26]/10"
      )}>
        <span className="text-[10px] uppercase font-bold text-[#F27D26] tracking-widest">Rare Find</span>
        <p className={cn("text-xs leading-relaxed mt-2 transition-colors", isDarkMode ? "text-slate-300" : "opacity-70")}>
          This studio is usually fully booked. The dates you've selected are currently available.
        </p>
      </div>
    </div>
  );
}

function AvailabilitySection({ bookings, isDarkMode }: { bookings: Booking[], isDarkMode?: boolean }) {
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
    <div className={cn(
      "border rounded-2xl p-6 transition-all duration-500",
      isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-slate-100"
    )}>
      <p className={cn("mb-6 font-light transition-colors", isDarkMode ? "text-slate-400" : "text-slate-500")}>Select your dates on the left to see exact pricing. Booked dates are shown in the calendar below.</p>
      <div className={cn(
        "flex justify-center border rounded-xl p-4 transition-all",
        isDarkMode ? "border-white/5 bg-white/5" : "border-slate-50 bg-slate-50"
      )}>
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

function AdminDashboard({ bookings, onCancel, isDarkMode }: { bookings: Booking[], onCancel: (id: string) => void, isDarkMode?: boolean }) {
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.totalPrice, 0);
  
  const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
  const totalGuests = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.guests || 1), 0);

  return (
    <div className={cn("flex flex-col h-[85vh] w-[90vw] max-w-4xl transition-colors duration-500", isDarkMode ? "bg-slate-900" : "bg-white")}>
      <div className={cn("p-8 border-b", isDarkMode ? "border-white/5" : "border-slate-100")}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={cn("text-3xl font-display font-bold mb-1 transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>Command Center</h2>
            <p className={cn("text-sm transition-colors", isDarkMode ? "text-slate-400" : "text-slate-500")}>Real-time studio performance and reservation management.</p>
          </div>
          <button 
            onClick={() => {
              if (confirm('Clear all bookings? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }}
            className={cn(
              "px-4 py-2 rounded-xl transition-colors border text-[10px] font-black uppercase tracking-widest",
              isDarkMode ? "text-red-400 border-red-500/20 hover:bg-red-500/10" : "text-red-500 border-red-100 hover:bg-red-50"
            )}
          >
            Reset Database
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn("p-6 rounded-2xl border transition-colors", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Revenue</span>
            <div className={cn("text-3xl font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>${totalRevenue.toLocaleString()}</div>
          </div>
          <div className={cn("p-6 rounded-2xl border transition-colors", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Active Stays</span>
            <div className={cn("text-3xl font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>{activeBookings}</div>
          </div>
          <div className={cn("p-6 rounded-2xl border transition-colors", isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Guests</span>
            <div className={cn("text-3xl font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>{totalGuests}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-4 no-scrollbar">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">Recent Reservations</h3>
        {bookings.length === 0 ? (
          <div className={cn("text-center py-20 rounded-3xl border border-dashed", isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50/50 border-slate-200")}>
            <p className="text-slate-400 italic font-medium">No bookings recorded yet.</p>
          </div>
        ) : (
          bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(booking => (
            <div key={booking.id} className={cn(
              "group p-6 border rounded-[24px] transition-all duration-300",
              booking.status === 'cancelled' 
                ? (isDarkMode ? "bg-white/5 border-white/5 opacity-60" : "bg-slate-50 border-slate-100 opacity-60")
                : (isDarkMode ? "bg-slate-900/50 border-white/10 hover:shadow-xl hover:shadow-black/20" : "bg-white border-slate-200 hover:shadow-xl hover:shadow-black/5")
            )}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold", isDarkMode ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-400")}>
                    {booking.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className={cn("font-bold text-lg leading-tight transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>{booking.name}</h4>
                    <p className={cn("text-xs font-medium transition-colors", isDarkMode ? "text-slate-400" : "text-slate-500")}>{booking.email}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  booking.status === 'confirmed' 
                    ? (isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")
                    : (isDarkMode ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-700")
                )}>
                  {booking.status}
                </div>
              </div>

              <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-6 pt-6 border-t", isDarkMode ? "border-white/5" : "border-slate-50")}>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block mb-1">Check In</span>
                  <span className={cn("text-xs md:text-sm font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>{format(new Date(booking.checkIn), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block mb-1">Check Out</span>
                  <span className={cn("text-xs md:text-sm font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>{format(new Date(booking.checkOut), 'MMM d, yyyy')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block mb-1">Revenue</span>
                  <span className={cn("text-xs md:text-sm font-bold transition-colors", isDarkMode ? "text-white" : "text-slate-900")}>${booking.totalPrice}</span>
                </div>
                <div className="flex justify-end items-center col-span-2 md:col-span-1">
                  {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => onCancel(booking.id)}
                      className={cn(
                        "w-full md:w-auto px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                        isDarkMode ? "bg-slate-800 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white" : "bg-white text-red-500 border-red-100 hover:bg-red-50"
                      )}
                    >
                      Cancel Stay
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, isDarkMode }: { children: React.ReactNode, onClose: () => void, isDarkMode?: boolean }) {
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
        className={cn(
          "relative w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10 border transition-all duration-500",
          isDarkMode ? "bg-slate-900 border-white/5" : "bg-white border-black/5"
        )}
      >
        <button 
          onClick={onClose}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-full transition-colors z-20",
            isDarkMode ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function VirtualTour({ onClose, isDarkMode }: { onClose: () => void, isDarkMode?: boolean }) {
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
      <div className={cn(
        "w-full md:w-80 border-r md:border-r border-b md:border-b-0 flex flex-col h-[40%] md:h-full z-10 order-2 md:order-1 transition-colors duration-500",
        isDarkMode ? "bg-slate-900 border-white/10" : "bg-editorial-bg border-black/10"
      )}>
        <div className={cn("p-4 md:p-8 border-b flex justify-between items-center transition-colors", isDarkMode ? "border-white/5" : "border-black/5")}>
          <div className="flex flex-col">
            <span className={cn("text-[9px] uppercase tracking-[0.2em] font-black mb-0.5 transition-colors", isDarkMode ? "text-white/20" : "text-black/30")}>Interactive Tour</span>
            <h2 className={cn("serif text-xl md:text-2xl leading-none transition-colors", isDarkMode ? "text-white" : "text-black")}>Perspective</h2>
          </div>
          <button onClick={onClose} className={cn("p-2 rounded-full transition-colors md:hidden", isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black")}>
            <X className="w-5 h-5" />
          </button>
          <button onClick={onClose} className={cn("hidden md:block p-2 rounded-full transition-colors", isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 md:p-4 flex md:flex-col gap-2 no-scrollbar">
            {views.map((view, idx) => (
              <button
                key={view.title}
                onClick={() => setActiveView(idx)}
                className={cn(
                  "flex-shrink-0 w-[200px] md:w-full p-3 md:p-4 rounded-2xl text-left transition-all group relative overflow-hidden",
                  activeView === idx 
                    ? (isDarkMode ? "bg-white text-black shadow-xl" : "bg-white shadow-xl shadow-black/5 border border-black/5") 
                    : (isDarkMode ? "hover:bg-white/10 text-white opacity-40 hover:opacity-100" : "hover:bg-black/5 opacity-40 hover:opacity-100")
                )}
              >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black opacity-20">0{idx + 1}</span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest truncate">{view.title}</span>
                {view.is360 && (
                  <span className="ml-auto text-[8px] bg-black text-white px-1.5 py-0.5 rounded-full font-black">360°</span>
                )}
              </div>
              {activeView === idx && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  className="hidden md:block text-[10px] mt-2 leading-relaxed font-medium"
                >
                  {view.desc}
                </motion.p>
              )}
            </button>
          ))}
        </div>

        <div className="hidden md:block p-8 bg-black dark:bg-slate-950 text-white">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="dark:text-white/40">Studio 402</span>
          </div>
          <div className="w-full h-px bg-white/10 dark:bg-white/5 mb-4" />
          <p className="text-[9px] leading-relaxed opacity-40 uppercase tracking-widest dark:text-white/30">
            Hand-crafted architectural details defined by Lumina Studio design practice.
          </p>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black overflow-hidden group order-1 md:order-2">
        {/* Mobile Close Button Overlay */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 right-6 z-20 p-3 bg-black/20 backdrop-blur-lg text-white rounded-full border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

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
              <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden touch-none">
                <motion.img 
                  drag="x"
                  dragElastic={0}
                  dragConstraints={{ left: -3000, right: 3000 }}
                  draggable="false"
                  src={views[activeView].image} 
                  alt={views[activeView].title} 
                  className="h-full min-w-[400%] object-cover cursor-grab active:cursor-grabbing touch-none select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="bg-black/40 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
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
            
            <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 flex flex-col items-end text-white drop-shadow-2xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 duration-500">
              <span className="hidden md:block text-[11px] uppercase tracking-[0.4em] font-black mb-2 opacity-60">View Details</span>
              <h3 className="serif text-3xl md:text-5xl leading-none">{views[activeView].title}</h3>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <button 
          onClick={() => setActiveView(v => (v - 1 + views.length) % views.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/10 backdrop-blur hover:bg-white text-white hover:text-black rounded-full transition-all opacity-0 md:group-hover:opacity-100 scale-90 group-hover:scale-100 hidden md:flex"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveView(v => (v + 1) % views.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 md:p-4 bg-white/10 backdrop-blur hover:bg-white text-white hover:text-black rounded-full transition-all opacity-0 md:group-hover:opacity-100 scale-90 group-hover:scale-100 hidden md:flex"
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

function Footer({ isDarkMode }: { isDarkMode?: boolean }) {
  return (
    <footer className={cn(
      "mt-16 border-t py-12 px-6 transition-all duration-500",
      isDarkMode ? "border-white/5" : "border-black/5"
    )}>
      <div className={cn(
        "max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
        isDarkMode ? "opacity-30 text-white" : "opacity-40 text-black"
      )}>
        <span>©2027 Journee Boutique Stays</span>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span>Studio 402</span>
        </div>
      </div>
    </footer>
  );
}
