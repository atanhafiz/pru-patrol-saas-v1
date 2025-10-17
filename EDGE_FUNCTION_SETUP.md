# Supabase Edge Function Setup - Track Monitor

This guide explains how to set up the automatic cleanup of old guard track records using Supabase Edge Functions.

## 📁 Files Created

- `supabase/functions/track-monitor/index.ts` - The Edge Function code
- `supabase/config.toml` - Supabase configuration with cron trigger
- `deploy-edge-function.ps1` - PowerShell deployment script
- `deploy-edge-function.sh` - Bash deployment script

## 🚀 Deployment Steps

### 1. Prerequisites

Make sure you have the Supabase CLI installed:

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Initialize Supabase (if not already done)

```bash
supabase init
```

### 4. Deploy the Edge Function

**On Windows (PowerShell):**
```powershell
.\deploy-edge-function.ps1
```

**On Linux/Mac:**
```bash
./deploy-edge-function.sh
```

**Or manually:**
```bash
supabase functions deploy track-monitor
```

## ⚙️ Function Details

### What it does:
- Deletes all `guard_tracks` records older than 24 hours
- Runs automatically every day at midnight UTC
- Uses the service role key for database access

### Cron Schedule:
- **Schedule**: `0 0 * * *` (daily at midnight UTC)
- **Timezone**: UTC
- **Frequency**: Once per day

## 🔍 Monitoring

### View Function Logs:
```bash
supabase functions logs track-monitor
```

### Test Function Manually:
```bash
supabase functions invoke track-monitor
```

### Check in Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions"
3. Find "track-monitor" function
4. View logs and execution history

## 🛠️ Configuration

The function is configured in `supabase/config.toml`:

```toml
[[functions]]
name = "track-monitor"

[functions.cron]
schedule = "0 0 * * *" # runs daily at midnight UTC
```

## 🔧 Customization

### Change Cleanup Period:
Edit the function in `supabase/functions/track-monitor/index.ts`:

```typescript
// Change from 24 hours to 7 days (7 * 24 * 60 * 60 * 1000)
.lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
```

### Change Schedule:
Edit `supabase/config.toml`:

```toml
[functions.cron]
schedule = "0 2 * * *" # runs daily at 2 AM UTC
```

### Available Cron Patterns:
- `0 0 * * *` - Daily at midnight
- `0 2 * * *` - Daily at 2 AM
- `0 0 * * 0` - Weekly on Sunday
- `0 0 1 * *` - Monthly on 1st

## 🚨 Important Notes

1. **Service Role Key**: The function uses `SUPABASE_SERVICE_ROLE_KEY` which has full database access
2. **Data Loss**: This function permanently deletes old records
3. **Timezone**: All times are in UTC
4. **Backup**: Consider backing up important data before enabling

## 🔍 Troubleshooting

### Function not running:
1. Check if the function is deployed: `supabase functions list`
2. Verify cron configuration in `config.toml`
3. Check function logs for errors

### Permission errors:
1. Ensure service role key is properly set
2. Check RLS policies on `guard_tracks` table
3. Verify function has proper permissions

### Database connection issues:
1. Check Supabase project status
2. Verify environment variables
3. Test database connection manually
