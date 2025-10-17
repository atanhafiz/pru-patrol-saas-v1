#!/bin/bash

# Deploy Supabase Edge Function for track monitoring
# This script deploys the track-monitor function to your Supabase project

echo "🚀 Deploying track-monitor Edge Function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

# Deploy the function
echo "📦 Deploying track-monitor function..."
supabase functions deploy track-monitor

if [ $? -eq 0 ]; then
    echo "✅ track-monitor function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. The function will run daily at midnight UTC"
    echo "2. It will automatically delete guard_tracks older than 24 hours"
    echo "3. You can monitor the function logs in your Supabase dashboard"
    echo ""
    echo "🔍 To test the function manually:"
    echo "supabase functions invoke track-monitor"
else
    echo "❌ Failed to deploy function. Check your Supabase project configuration."
    exit 1
fi
