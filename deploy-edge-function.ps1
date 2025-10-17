# Deploy Supabase Edge Function for track monitoring
# This script deploys the track-monitor function to your Supabase project

Write-Host "🚀 Deploying track-monitor Edge Function..." -ForegroundColor Green

# Check if supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $null = supabase status 2>$null
} catch {
    Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
    Write-Host "supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying track-monitor function..." -ForegroundColor Blue
supabase functions deploy track-monitor

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ track-monitor function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. The function will run daily at midnight UTC" -ForegroundColor White
    Write-Host "2. It will automatically delete guard_tracks older than 24 hours" -ForegroundColor White
    Write-Host "3. You can monitor the function logs in your Supabase dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 To test the function manually:" -ForegroundColor Cyan
    Write-Host "supabase functions invoke track-monitor" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to deploy function. Check your Supabase project configuration." -ForegroundColor Red
    exit 1
}
