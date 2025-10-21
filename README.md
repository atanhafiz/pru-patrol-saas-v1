# AHE SmartPatrol SaaS

**Real-time security patrol management system for Malaysian security companies and property management (JMB).**

AHE SmartPatrol provides digital transformation for traditional security operations through automated patrol tracking, incident reporting, and real-time monitoring with GPS-verified selfie check-ins and Telegram alerts.

## Quickstart

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pru-patrol-saas-v1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

- **[Project Summary](docs/PROJECT_SUMMARY.md)** - Complete project overview, tech stack, and architecture
- **[Routes Documentation](docs/ROUTES.md)** - All application routes and navigation
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Database structure and relationships
- **[User Flows](docs/USEFLOWS.md)** - User journey flows and system processes
- **[Next Steps](docs/NEXT_STEPS.md)** - Prioritized development backlog

## Deployment

### Netlify Deployment

1. **Build Configuration**
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: 18

2. **Environment Variables**
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` in Netlify dashboard

3. **SPA Routing**
   - Configured in `netlify.toml` for React Router support
   - All routes redirect to `index.html` for client-side routing

### Supabase Setup

1. **Database Migrations**
   - Run migrations from `supabase/migrations/` directory
   - Enable Row Level Security (RLS) policies
   - Configure storage buckets for photo uploads

2. **Edge Functions**
   - Deploy `incident-alert` function for Telegram notifications
   - Configure Telegram bot token and chat ID

## Tech Stack

- **Frontend**: React 18.3.1 + Vite 5.4.10 + Tailwind CSS 3.4.14
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Routing**: React Router v7
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion
- **SEO**: React Helmet

## Key Features

- **Real-time Guard Tracking**: Live GPS location monitoring
- **GPS-verified Check-ins**: Selfie check-ins with location verification
- **Incident Reporting**: Photo-based incident reports with Telegram alerts
- **Role-based Access**: Admin, Client, and Guard user types
- **Multi-tenant Architecture**: Support for multiple security companies
- **Mobile-responsive**: Optimized for mobile guard operations

## User Roles

- **Admin**: System administrators with full access
- **Client**: Property management companies (JMB)
- **Guard**: Security personnel on patrol duty

## Support & Contact

- **Email**: support@ahetech.com
- **Location**: Sungai Petani, Kedah, Malaysia
- **Company**: AHE Technology Sdn Bhd

## License

© 2024 AHE Technology Sdn Bhd • AHE SmartPatrol • All Rights Reserved
