# AHE SmartPatrol - Routes Documentation

## Route Configuration

**Router File**: `src/router/index.jsx`

## Public Routes (No Authentication Required)

| Path | Element | Description | Access |
|------|---------|-------------|---------|
| `/` | `Landing` | Marketing landing page with SEO | Public |
| `/login` | `Login` | User authentication form | Public |
| `/register` | `Register` | User registration (Admin/Client) | Public |

## Admin Routes (Requires `profile.role === "admin"`)

| Path | Element | Description | Layout |
|------|---------|-------------|---------|
| `/admin` | `AdminDashboard` | Main admin dashboard | Clean Layout |
| `/admin/dashboard` | `AdminDashboard` | Admin dashboard (alias) | Clean Layout |
| `/admin/map` | `AdminMap` | Live guard tracking map | Clean Layout |
| `/admin/attendance-history` | `AttendanceHistoryMap` | Attendance analytics | Clean Layout |
| `/admin/attendance-map` | `AttendanceHistoryMap` | Attendance map (alias) | Clean Layout |
| `/admin/incidents` | `AdminIncident` | Incident management | Clean Layout |
| `/admin/*` | `Navigate to="/admin/dashboard"` | Fallback for unmatched admin routes | - |

## Guard Routes (Requires `profile.role === "guard"`)

| Path | Element | Description | Layout |
|------|---------|-------------|---------|
| `/guard` | `GuardLayout` | Guard layout wrapper | Guard Layout |
| `/guard/dashboard` | `GuardDashboard` | Guard dashboard | Guard Layout |
| `/guard/route` | `RouteList` | Patrol route assignments | Guard Layout |
| `/guard/selfie` | `SelfieCheckIn` | GPS-verified selfie check-in | Guard Layout |
| `/guard/report` | `IncidentForm` | Incident reporting form | Guard Layout |
| `/guard/*` | `Navigate to="/guard/dashboard"` | Fallback for unmatched guard routes | - |

## Client Routes (Not Implemented)

**Note**: Client routes are referenced in registration logic but not implemented in the current router.

| Path | Element | Description | Status |
|------|---------|-------------|---------|
| `/client/dashboard` | (Not found) | Client dashboard | **Missing** |

## Navigation Logic

### Authentication Check
```javascript
// From src/router/index.jsx
const { user, profile, loading } = useAuth();

// Role-based route rendering
{user && profile?.role === "admin" && (
  // Admin routes
)}

{user && profile?.role === "guard" && (
  // Guard routes  
)}
```

### Default Redirects
```javascript
// Fallback route for unmatched paths
<Route path="*" element={
  <Navigate to={
    user ? (
      profile?.role === "admin" ? "/admin/dashboard" : "/guard/dashboard"
    ) : "/login"
  } />
} />
```

## Deep Links & Navigation

### Admin Navigation
- **Dashboard**: `/admin/dashboard` - Main admin interface
- **Live Tracking**: `/admin/map` - Real-time guard location tracking
- **Attendance**: `/admin/attendance-history` - Attendance analytics and history
- **Incidents**: `/admin/incidents` - Incident management and reports

### Guard Navigation
- **Dashboard**: `/guard/dashboard` - Guard activity overview
- **Routes**: `/guard/route` - Patrol route assignments
- **Check-in**: `/guard/selfie` - GPS-verified selfie check-in
- **Reports**: `/guard/report` - Incident reporting with photo capture

### Registration Flow
- **Admin Registration**: `admin@ahetech.my` → `profiles` table → `/admin/dashboard`
- **Client Registration**: Any other email → `clients` table → `/client/dashboard` (Not implemented)

## Route Protection

### Authentication Required
- All admin routes require `user && profile?.role === "admin"`
- All guard routes require `user && profile?.role === "guard"`
- Unauthenticated users redirect to `/login`

### Role-Based Access
- **Admin**: Full system access, all admin routes
- **Guard**: Limited to guard-specific functionality
- **Client**: Registration creates client record but no dashboard route exists

## Layout Components

### Admin Layout
- **File**: `src/layouts/AdminLayout_Clean.jsx`
- **Usage**: Wrapped around admin pages in `AdminDashboard.jsx`
- **Features**: Clean admin interface, navigation, metrics display

### Guard Layout  
- **File**: `src/layouts/GuardLayout.jsx`
- **Usage**: Wrapper for all guard routes
- **Features**: Bottom navigation, guard-specific UI

## Missing Routes

### Client Dashboard
- **Expected**: `/client/dashboard`
- **Status**: Referenced in registration but not implemented
- **Impact**: Client users cannot access their dashboard after registration

### Additional Admin Routes
- **Guards Management**: `/admin/guards` (referenced in components but not in router)
- **Houses Management**: `/admin/houses` (referenced in components but not in router)
- **Reports**: `/admin/reports` (referenced in components but not in router)

## Route Dependencies

### Required Components
- **AuthContext**: `src/context/AuthContext.jsx` - Authentication state
- **Layouts**: `src/layouts/` - Page layout components
- **Pages**: `src/pages/` - Page components

### Navigation Components
- **Link**: `react-router-dom` Link components for navigation
- **Navigate**: `react-router-dom` Navigate for redirects
- **useNavigate**: Hook for programmatic navigation
