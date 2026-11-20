# RentEase - Student PG & Hostel Finder

RentEase is a full-stack student accommodation platform built with **React 19 (Vite)** on the frontend and **Node.js / Express** with **PostgreSQL** on the backend. It helps college and university students find, filter, review, and book comfortable PGs and hostels while providing property owners with a comprehensive listing and booking management dashboard.

---

## 🌟 Key Features

### For Students
- **Smart Search & Filters**: Search by location, campus area, or PG name. Filter by sharing type (*Single, 2 Sharing, 3 Sharing, 4 Sharing*), monthly budget, and food availability.
- **Detailed Accommodation Pages**: View room photos, monthly rent, security deposit, bed availability, verified amenities (*Wi-Fi, Laundry, CCTV, 24/7 Water*), house rules, and direct owner phone numbers.
- **Interactive Google Maps**: One-click navigation to explore the PG's neighborhood and commute to campus.
- **Online Booking Requests**: Request to book a bed by selecting an intended move-in date.
- **"My Bookings" Dashboard**: Track booking request status in real-time (*Pending Review, Approved, Rejected, Cancelled*) with owner contact options and cancellation support.
- **Ratings & Reviews**: Read authentic feedback from fellow students and submit star ratings and comments.

### For PG & Hostel Owners
- **Owner Dashboard ("My Listings")**: Overview of all listed properties, current rental prices, room types, and live bed vacancies.
- **Listing Management**: Add new PG listings or edit pricing, availability, amenities, and house rules on the fly.
- **Booking Requests Queue**: Review student requests with student names, contact numbers, and requested move-in dates.
- **One-Click Approval/Rejection**: Approving a booking automatically updates the property's available student beds count.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React 19
  - Vite
  - React Router DOM (`react-router-dom`)
  - Vanilla CSS with responsive mobile-friendly layouts
- **Backend**:
  - Node.js & Express
  - PostgreSQL (`pg` pool)
  - `bcrypt` for password hashing
  - `cors` & `dotenv` for environment configuration
  - Auto-initializing database schema migrations (`init-db.js`)

---

## 🚀 Getting Started

### 1. Database Setup
Make sure PostgreSQL is running on your machine and the database exists:
- Database Name: `rentease_db`
- Check or edit `backend/.env` with your database credentials:
  ```env
  PORT=5000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=rentease_db
  DB_USER=postgres
  DB_PASSWORD=your_password
  ```

### 2. Start the Backend Server
From the root directory:
```bash
npm run server
```
Or navigate into the backend folder:
```bash
cd backend
npm start
```
The backend server runs on `https://rentease-student-pg-hostel-finder.onrender.com`.

### 3. Start the Frontend Dev Server
From the root directory:
```bash
npm run dev
```
Open `http://localhost:5173` (or the port Vite provides) in your browser.

---

## 📁 Project Structure

```
RentEase(React)/
├── backend/
│   ├── .env                # Database & server environment variables
│   ├── db.js               # PostgreSQL connection pool with dotenv pathing
│   ├── init-db.js          # DB schema verification & seed data synchronization
│   ├── package.json        # Backend dependencies & scripts
│   └── server.js           # Express REST API (Auth, PGs, Bookings, Reviews)
├── public/
│   ├── images/             # PG sample photos (pg1.jpg, pg2.jpg, pg3.jpg, pg4.jpg)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Footer.jsx      # Footer with brand copyrights
│   │   ├── Navbar.jsx      # Responsive navigation with role-based links
│   │   ├── PGCard.jsx      # Enhanced accommodation cards with star ratings & facilities
│   │   └── ProtectedRoute.jsx # Role-aware route guard
│   ├── pages/
│   │   ├── AddPG.jsx       # Owner form to publish new accommodations
│   │   ├── Home.jsx        # Hero, filter bar, popular PGs, and about section
│   │   ├── Login.jsx       # Dual student/owner authentication
│   │   ├── MyBookings.jsx  # Student booking requests tracking
│   │   ├── MyListings.jsx  # Owner management dashboard & booking approvals
│   │   ├── PGDetails.jsx   # Rich accommodation detail, reviews & booking form
│   │   └── Register.jsx    # User registration with password validation
│   ├── App.jsx             # SPA routing with React Router DOM
│   ├── index.css           # Global responsive styles
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 🧪 Available Scripts

In the project root:
- `npm run dev`: Starts Vite dev server for frontend.
- `npm run server`: Starts Express backend server.
- `npm run build`: Compiles production frontend bundle.
- `npm run lint`: Runs ESLint across all frontend code.
