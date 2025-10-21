# AHE SmartPatrol - Project Summary

## Overview

AHE SmartPatrol is a comprehensive real-time security patrol management system designed for Malaysian security companies and property management (JMB). The system provides digital transformation for traditional security operations through automated patrol tracking, incident reporting, and real-time monitoring.

### What SmartPatrol Solves
- **Digital Security Management**: Replace paper-based patrol logs with digital tracking
- **Real-time Monitoring**: Live guard location tracking and status updates  
- **Incident Management**: Automated incident reporting with photo evidence and Telegram alerts
- **Attendance Tracking**: GPS-verified selfie check-ins for guard accountability
- **Client Management**: Multi-tenant system for security companies to manage multiple sites

### Who Uses It
- **Admins**: Security company managers, system administrators (`admin@ahetech.my`)
- **Clients**: Property management companies (JMB), building owners (company signup)
- **Guards**: Security personnel on patrol duty (role-based access)

## Tech Stack

### Frontend Framework
- **React 18.3.1** with Vite 5.4.10 for fast development and building
- **React Router v7** for client-side routing with role-based access
- **Tailwind CSS 3.4.14** for responsive styling and design system
- **Framer Motion 12.23.24** for smooth animations and transitions

### Backend & Database
- **Supabase** as Backend-as-a-Service (BaaS)
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions for live updates
  - Edge Functions for serverless processing
  - Storage for photo uploads and file management

### Key Dependencies
- **Leaflet + React-Leaflet**: Interactive maps for guard tracking
- **Recharts**: Data visualization for analytics and reports
- **React-Helmet**: SEO optimization and meta tag management
- **Zustand**: Lightweight state management
- **Howler.js**: Audio notifications and alerts
- **PapaParse**: CSV data processing for property imports

## Environments & Required .env Keys

### Required Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### Environment Setup
- Development: `npm run dev` (Vite dev server)
- Production: `npm run build` (Vite build)
- Preview: `npm run preview` (Local preview of build)

## Deployment

### Netlify Configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **SPA Routing**: Configured for React Router with catch-all redirects
- **Configuration File**: `netlify.toml`

### Netlify.toml Settings
```toml
[build]
  command = "npm run build"
  publish = "dist"
  environment = { NODE_VERSION = "18" }

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

## SEO/OG

### React Helmet Integration
- **File**: `src/pages/Landing.jsx`
- **Bilingual SEO**: Malay and English meta tags
- **Open Graph**: Social media optimization
- **Twitter Cards**: Enhanced social sharing
- **Structured Data**: JSON-LD for SoftwareApplication and Organization

### SEO Images
- **Primary Image**: `/images/guard-ai3.jpg` (Guard AI Dashboard)
- **Hero Images**: `/images/dashboard-preview.jpg`, `/images/guard-ai1.jpg`, `/images/guard-ai2.jpg`
- **Social Preview**: Uses guard-ai3.jpg for all social platforms

## Folder Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   │   ├── ActivityLogTable.jsx
│   │   ├── AdminAlert.jsx
│   │   ├── AdminAlertCenter.jsx
│   │   ├── ReportFeed.jsx
│   │   ├── RouteAssignment.jsx
│   │   └── RouteStatusAlert.jsx
│   ├── guard/           # Guard-specific components
│   │   └── SelfieCheckIn.jsx
│   ├── shared/          # Shared components
│   │   ├── AttendanceMap.jsx
│   │   ├── LogoutButton.jsx
│   │   └── MapRealtime.jsx
│   ├── GuardBottomNav.jsx
│   └── HouseSnapUploader.jsx
├── context/             # React Context providers
│   └── AuthContext.jsx  # Authentication state management
├── layouts/             # Page layout components
│   ├── AdminLayout.jsx
│   ├── AdminLayout_Clean.jsx
│   └── GuardLayout.jsx
├── lib/                 # Utility libraries
│   ├── logEvent.js      # Event logging utility
│   ├── supabaseClient.js # Supabase client configuration
│   └── telegram.js      # Telegram bot integration
├── pages/               # Page components
│   ├── admin/           # Admin pages
│   │   ├── AdminIncident.jsx
│   │   ├── AdminMap.jsx
│   │   ├── AttendanceHistoryMap.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Guards.jsx
│   │   ├── Houses.jsx
│   │   └── Reports.jsx
│   ├── guard/           # Guard pages
│   │   ├── Attendance.jsx
│   │   ├── Dashboard.jsx
│   │   ├── IncidentForm.jsx
│   │   ├── PatrolTimeline.jsx
│   │   ├── RouteList.jsx
│   │   ├── SelfieCheckIn.jsx
│   │   └── Timeline.jsx
│   ├── Landing.jsx      # Landing page with SEO
│   ├── Login.jsx        # Authentication
│   └── Register.jsx     # User registration
├── router/              # Routing configuration
│   └── index.jsx        # Main router with role-based routes
├── shared/              # Shared utilities
│   ├── api/
│   │   └── telegram.js  # Telegram API integration
│   └── hooks/
│       └── useRealtime.js # Real-time data hooks
└── data/                # Static data files
    └── rumah_pru.csv    # Property data for PRU development
```

## Key Pages & Components

### Public Pages
- **`src/pages/Landing.jsx`**: Marketing landing page with SEO optimization
- **`src/pages/Login.jsx`**: User authentication
- **`src/pages/Register.jsx`**: User registration (Admin/Client role-based)

### Admin Pages
- **`src/pages/admin/Dashboard.jsx`**: Main admin dashboard with metrics
- **`src/pages/admin/AdminMap.jsx`**: Live guard tracking map
- **`src/pages/admin/AttendanceHistoryMap.jsx`**: Attendance analytics
- **`src/pages/admin/AdminIncident.jsx`**: Incident management

### Guard Pages
- **`src/pages/guard/Dashboard.jsx`**: Guard dashboard with activity overview
- **`src/pages/guard/SelfieCheckIn.jsx`**: GPS-verified selfie check-in
- **`src/pages/guard/IncidentForm.jsx`**: Incident reporting with photo capture
- **`src/pages/guard/RouteList.jsx`**: Patrol route assignments

### Key Components
- **`src/components/shared/MapRealtime.jsx`**: Live guard tracking map
- **`src/components/guard/SelfieCheckIn.jsx`**: Camera integration for check-ins
- **`src/components/admin/ReportFeed.jsx`**: Real-time incident feed

## Authentication Flow

### AuthContext Implementation
- **File**: `src/context/AuthContext.jsx`
- **Provider**: `AuthProvider` wraps entire app
- **Hook**: `useAuth()` for accessing auth state

### Role Determination
```javascript
// Role logic in src/pages/Register.jsx
const role = email.toLowerCase() === "admin@ahetech.my" ? "admin" : "client";

// Profile loading in src/context/AuthContext.jsx
const { data, error } = await supabase
  .from("profiles")
  .select("id, email, full_name, role")
  .eq("id", uid)
  .single();
```

### Database Tables
- **`profiles`**: Admin users (id, email, full_name, role)
- **`clients`**: Client users (id, full_name, company_name, contact_number, email)

## Role Redirects

### Admin Redirects
- **Login Success**: `/admin/dashboard`
- **Available Routes**: `/admin`, `/admin/map`, `/admin/attendance-history`, `/admin/incidents`
- **Fallback**: `/admin/dashboard` for unmatched admin routes

### Client Redirects  
- **Registration Success**: `/client/dashboard` (Not found in current router)
- **Note**: Client dashboard route not implemented in current router

### Guard Redirects
- **Login Success**: `/guard/dashboard`
- **Available Routes**: `/guard/dashboard`, `/guard/route`, `/guard/selfie`, `/guard/report`
- **Fallback**: `/guard/dashboard` for unmatched guard routes

### Public Redirects
- **Unauthenticated**: `/login`
- **Landing Page**: `/` (public access)
- **Registration**: `/register` (public access)
