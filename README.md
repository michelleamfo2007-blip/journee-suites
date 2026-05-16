# Journee Suites

<div align="center">
  <h3>Boutique Stay • Accra, Achimota</h3>
  <p>A premium architectural studio experience in the heart of Ghana.</p>
</div>

---

## 🏛️ About The Project

**Journee Suites** is a high-fidelity boutique stay application designed for a "Compact Luxury" user experience. The site features a minimalist, editorial design language with smooth "flying" animations and a fully interactive perspective tour.

### Key Features
-  Localized Experience**: Fully rebranded for the Accra, Achimota district.
-  Flying Animations**: Scroll-reveal entrance animations powered by Framer Motion.
-  Perspective Tour**: Interactive virtual tour with high-resolution architectural imagery.
-  Responsive Layout**: Optimized for all devices, from desktop to mobile.
-  Smart Booking**: Interactive date selection and guest management (up to 4 guests).

---

##  Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion (Motion/React)
- **Icons**: Lucide React
- **Date Handling**: date-fns + React Day Picker
- **Build Tool**: Vite

---

##  Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm

### Installation & Run
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment**:
   Create a `.env` file and add your configuration (e.g., `GEMINI_API_KEY` for AI features).

3. **Launch the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

##  Email Notifications

The app is integrated with **EmailJS** to send instant notifications for both you and your guests.

### Configuration
1. Sign up at [EmailJS](https://www.emailjs.com/).
2. Create an **Email Service** (e.g., Gmail).
3. Create two **Email Templates**:
   - **Admin Notification**: To alert you of a new booking.
   - **Guest Confirmation**: To send a receipt to the user.
4. Update your `.env` file with your credentials:
   ```env
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_admin_template_id
   VITE_EMAILJS_GUEST_TEMPLATE_ID=your_guest_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   VITE_NOTIFICATION_EMAIL=your_admin_email@example.com
   ```

---

##  Location
**Accra • Achimota • Ghana**
*Studio 402*

©2027 Journee Boutique Stays
