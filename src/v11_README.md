# PRU Patrol SaaS v1.1 - Sandbox Structure

## 📁 **New Folder Structure Created**

```
src/
├── admin_v11/                    # Admin pages (v1.1)
│   ├── Dashboard_v11.jsx         # Admin dashboard with centralized Telegram
│   ├── AdminMap_v11.jsx         # Real-time guard tracking map
│   └── AdminIncident_v11.jsx    # Incident management with realtime hooks
│
├── guard_v11/                    # Guard pages (v1.1)
│   ├── Dashboard_v11.jsx        # Guard dashboard with realtime data
│   ├── RouteList_v11.jsx        # Patrol routes with centralized alerts
│   ├── SelfieCheckIn_v11.jsx    # Selfie check-in with Telegram integration
│   └── IncidentForm_v11.jsx     # Incident reporting with centralized API
│
├── shared_v11/                   # Shared utilities (v1.1)
│   ├── api/
│   │   └── telegram.js          # Centralized Telegram API functions
│   ├── hooks/
│   │   └── useRealtime.js       # Reusable Supabase subscription hooks
│   └── components/
│       ├── LoadingSpinner.jsx   # Consistent loading states
│       └── ErrorBoundary.jsx    # Error handling components
│
└── layouts_v11/                  # Layout components (v1.1)
    ├── AdminLayout_v11.jsx      # Admin layout with animations
    └── GuardLayout_v11.jsx      # Guard layout with mobile navigation
```

## 🔧 **Key Improvements in v1.1**

### **1. Centralized Telegram API**
- **File**: `src/shared_v11/api/telegram.js`
- **Features**:
  - `sendTelegramAlert(type, payload)` - Centralized alert function
  - `sendTelegramPhoto(photoUrl, caption)` - Photo sending function
  - Environment variable configuration
  - Consistent error handling
  - Alert type constants for consistency

### **2. Reusable Realtime Hooks**
- **File**: `src/shared_v11/hooks/useRealtime.js`
- **Features**:
  - `useRealtime(table, options)` - Generic realtime hook
  - `useRealtimeIncidents()` - Specialized incident hook
  - `useRealtimeAttendance()` - Attendance data hook
  - `useRealtimeGuardLocations()` - Location tracking hook
  - Auto-archiving for old incidents

### **3. Shared Components**
- **LoadingSpinner**: Consistent loading states with size/color variants
- **ErrorBoundary**: Comprehensive error handling with retry functionality
- **InlineSpinner**: For buttons and small areas
- **LoadingOverlay**: Full-screen loading states

### **4. Enhanced Layouts**
- **AdminLayout_v11**: Animated sidebar with system status indicator
- **GuardLayout_v11**: Mobile-first navigation with smooth animations
- Error boundary integration
- Consistent styling and animations

## 🚀 **Usage Examples**

### **Using Centralized Telegram API**
```javascript
import { sendTelegramAlert, TELEGRAM_ALERT_TYPES } from '../shared_v11/api/telegram';

// Send incident alert
await sendTelegramAlert(TELEGRAM_ALERT_TYPES.INCIDENT_REPORT, {
  message: "New incident reported by Guard John"
});
```

### **Using Realtime Hooks**
```javascript
import { useRealtimeIncidents } from '../shared_v11/hooks/useRealtime';

function IncidentComponent() {
  const { data: incidents, loading, error } = useRealtimeIncidents();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary />;
  
  return <div>{incidents.map(incident => ...)}</div>;
}
```

### **Using Shared Components**
```javascript
import LoadingSpinner from '../shared_v11/components/LoadingSpinner';
import ErrorBoundary from '../shared_v11/components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <LoadingSpinner size="large" text="Loading data..." />
    </ErrorBoundary>
  );
}
```

## 🔄 **Migration Benefits**

1. **No Breaking Changes**: All original files remain untouched
2. **Centralized Logic**: Telegram and realtime logic consolidated
3. **Reusable Components**: Consistent UI patterns across the app
4. **Better Error Handling**: Comprehensive error boundaries
5. **Improved Performance**: Optimized realtime subscriptions
6. **Cleaner Code**: Modular structure for easier maintenance

## 🧪 **Testing Strategy**

1. **Isolated Testing**: Test v1.1 components independently
2. **Gradual Migration**: Replace original components one by one
3. **A/B Testing**: Compare v1.0 vs v1.1 performance
4. **Rollback Ready**: Easy to revert if issues arise

## 📋 **Next Steps**

1. **Test v1.1 Components**: Verify all functionality works
2. **Performance Testing**: Ensure no performance regressions
3. **Integration Testing**: Test with existing Supabase setup
4. **Gradual Rollout**: Replace original components systematically
5. **Documentation**: Update API documentation for v1.1

## ⚠️ **Important Notes**

- **DO NOT** modify existing files in `src/context`, `src/router`, or original components
- **DO NOT** deploy v1.1 routes yet - test separately first
- All v1.1 files use `_v11.jsx` suffix for easy identification
- Environment variables need to be configured for Telegram API
- Supabase configuration remains unchanged

This sandbox structure provides a clean, modular foundation for the stable v1.1 release while maintaining full backward compatibility with the existing system.
