# AHE SmartPatrol - User Flows

## 1. Client Signup Flow

### Registration Process
1. **Landing Page** (`src/pages/Landing.jsx`)
   - User visits marketing page with SEO optimization
   - Clicks "Get Started" or "Register" button
   - Redirects to `/register`

2. **Registration Form** (`src/pages/Register.jsx`)
   - User fills out company registration form:
     - Full Name (required)
     - Company/Site Name (required)
     - Contact Number (optional)
     - Email (required)
     - Password (required)
   - Form validation and submission

3. **Supabase Authentication**
   - `supabase.auth.signUp({ email, password })` called
   - User account created in Supabase Auth
   - Email verification sent (if configured)

4. **Database Insert**
   - Role determined: `email !== "admin@ahetech.my"` → `"client"`
   - Record inserted into `clients` table:
     ```javascript
     await supabase.from("clients").insert([{
       id: user.id,
       full_name: fullName,
       company_name: companyName,
       contact_number: contactNumber,
       email
     }]);
     ```

5. **Local Storage Setup**
   - Company data stored in localStorage:
     - `localStorage.setItem("companyName", companyName)`
     - `localStorage.setItem("contactNumber", contactNumber)`

6. **Redirect** (Currently Missing)
   - **Expected**: Redirect to `/client/dashboard`
   - **Current Issue**: Client dashboard route not implemented
   - **Fallback**: User redirected to landing page

### Files Involved
- `src/pages/Register.jsx` - Registration form and logic
- `src/context/AuthContext.jsx` - Authentication state management
- `src/lib/supabaseClient.js` - Supabase client configuration

## 2. Admin Login & Capabilities

### Admin Authentication
1. **Login Form** (`src/pages/Login.jsx`)
   - Admin enters credentials
   - `supabase.auth.signInWithPassword({ email, password })`

2. **Profile Loading** (`src/context/AuthContext.jsx`)
   - AuthContext loads profile from `profiles` table
   - Role check: `profile.role === "admin"`
   - Automatic redirect to `/admin/dashboard`

3. **Admin Dashboard** (`src/pages/admin/Dashboard.jsx`)
   - Main admin interface with metrics
   - Real-time activity monitoring
   - Navigation to specialized admin pages

### Admin Capabilities

#### Live Guard Tracking (`/admin/map`)
- **Component**: `src/pages/admin/AdminMap.jsx`
- **Feature**: Real-time guard location tracking
- **Map**: `src/components/shared/MapRealtime.jsx`
- **Data**: Live GPS coordinates from guards

#### Attendance Management (`/admin/attendance-history`)
- **Component**: `src/pages/admin/AttendanceHistoryMap.jsx`
- **Feature**: Attendance analytics and history
- **Data Source**: `attendance_log` table
- **Analytics**: Charts and metrics using Recharts

#### Incident Management (`/admin/incidents`)
- **Component**: `src/pages/admin/AdminIncident.jsx`
- **Feature**: Incident reports and management
- **Data Source**: `incidents` table
- **Real-time**: Live incident feed with Telegram integration

#### Route Assignments
- **Component**: `src/components/admin/RouteAssignment.jsx`
- **Feature**: Assign patrol routes to guards
- **Data**: Property data from `src/data/rumah_pru.csv`

### Files Involved
- `src/pages/admin/Dashboard.jsx` - Main admin interface
- `src/layouts/AdminLayout_Clean.jsx` - Admin layout wrapper
- `src/components/admin/` - Admin-specific components
- `src/context/AuthContext.jsx` - Role-based access control

## 3. Guard Basic Flow

### Guard Authentication
1. **Login** (`src/pages/Login.jsx`)
   - Guard enters credentials
   - Supabase authentication
   - Profile loaded from `profiles` table
   - Role check: `profile.role === "guard"`
   - Redirect to `/guard/dashboard`

2. **Guard Dashboard** (`src/pages/guard/Dashboard.jsx`)
   - Activity overview and metrics
   - Navigation to guard-specific features
   - Real-time data from `attendance_log` and `incidents` tables

### Guard Activities

#### Selfie Check-in (`/guard/selfie`)
- **Component**: `src/pages/guard/SelfieCheckIn.jsx`
- **Process**:
  1. Camera access request
  2. GPS location capture
  3. Selfie photo capture
  4. Upload to Supabase Storage
  5. Database insert to `attendance_log`
  6. Real-time map update

- **Data Captured**:
  - `guard_name` (from localStorage)
  - `plate_no` (from localStorage)
  - `selfie_url` (Supabase storage URL)
  - `lat`, `long` (GPS coordinates)
  - `created_at` (timestamp)

#### Incident Reporting (`/guard/report`)
- **Component**: `src/pages/guard/IncidentForm.jsx`
- **Process**:
  1. Camera access for incident photo
  2. Incident description entry
  3. GPS location capture
  4. Photo upload to Supabase Storage
  5. Database insert to `incidents`
  6. Telegram alert sent via Edge Function

- **Data Captured**:
  - `guard_name`, `plate_no` (from localStorage)
  - `message` (incident description)
  - `photo_url` (Supabase storage URL)
  - `lat`, `long` (GPS coordinates)
  - `status` (default: 'active')

#### Route List (`/guard/route`)
- **Component**: `src/pages/guard/RouteList.jsx`
- **Feature**: View assigned patrol routes
- **Data**: Property information and route assignments

#### Activity Timeline
- **Component**: `src/pages/guard/Timeline.jsx`
- **Feature**: Personal activity history
- **Data**: Guard's attendance and incident records

### Guard Layout
- **Layout**: `src/layouts/GuardLayout.jsx`
- **Navigation**: `src/components/GuardBottomNav.jsx`
- **Features**: Bottom navigation, guard-specific UI

### Files Involved
- `src/pages/guard/` - All guard pages
- `src/components/guard/SelfieCheckIn.jsx` - Check-in functionality
- `src/layouts/GuardLayout.jsx` - Guard layout wrapper
- `src/lib/telegram.js` - Telegram integration

## Telegram Integration

### Incident Alerts
- **Edge Function**: `supabase/functions/incident-alert/index.ts`
- **Trigger**: Database insert on `incidents` table
- **Process**:
  1. Incident reported by guard
  2. Edge function triggered automatically
  3. Telegram bot sends photo with caption
  4. Admin receives real-time alert

### Telegram Configuration
- **Bot Token**: Hardcoded in edge function
- **Chat ID**: Admin notification channel
- **Message Format**: Guard name, plate number, timestamp, description
- **Photo**: Incident photo from Supabase Storage

### Files Involved
- `supabase/functions/incident-alert/index.ts` - Edge function
- `src/lib/telegram.js` - Telegram API integration
- `src/pages/guard/IncidentForm.jsx` - Incident reporting

## Storage Usage

### Photo Storage
- **Provider**: Supabase Storage
- **Types**: Selfie check-ins, incident photos
- **Access**: Public URLs for Telegram integration
- **Security**: RLS policies for access control

### File Upload Process
1. Camera capture or file selection
2. Upload to Supabase Storage bucket
3. Get public URL
4. Store URL in database record
5. Use URL for Telegram notifications

### Files Involved
- `src/pages/guard/SelfieCheckIn.jsx` - Selfie uploads
- `src/pages/guard/IncidentForm.jsx` - Incident photo uploads
- Supabase Storage policies and configuration

## Real-time Features

### Live Guard Tracking
- **Component**: `src/components/shared/MapRealtime.jsx`
- **Technology**: Supabase real-time subscriptions
- **Data**: Live GPS coordinates from guards
- **Update Frequency**: Real-time as guards move

### Activity Feeds
- **Admin Dashboard**: Real-time activity monitoring
- **Incident Feed**: Live incident reports
- **Attendance Updates**: Real-time check-in notifications

### Files Involved
- `src/components/shared/MapRealtime.jsx` - Live tracking
- `src/shared/hooks/useRealtime.js` - Real-time data hooks
- `src/components/admin/ReportFeed.jsx` - Live incident feed
