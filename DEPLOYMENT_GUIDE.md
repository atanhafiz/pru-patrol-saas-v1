# PRU Patrol v1.1 Sandbox - Netlify Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables
Create `.env.production` file in project root with:

```env
VITE_SUPABASE_URL=https://wntyzoninwupsiycrrjc.supabase.co
VITE_SUPABASE_KEY=your_actual_supabase_anon_key_here
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
VITE_TELEGRAM_CHAT_ID=your_telegram_chat_id_here
VITE_SANDBOX_MODE=true
```

### 2. Build Configuration
✅ `netlify.toml` - Updated with Node 18 and redirects
✅ `vite.config.js` - Added base: "./" for Netlify
✅ `package.json` - Build scripts verified

### 3. Git Setup
```bash
# Create sandbox branch
git checkout -b sandbox-v1.1

# Add all v1.1 changes
git add .
git commit -m "feat: PRU Patrol v1.1 sandbox ready for deployment"

# Push to GitHub
git push origin sandbox-v1.1
```

## 🌐 Netlify Deployment

### Option A: Manual Deploy
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect to GitHub repository
4. Select branch: `sandbox-v1.1`
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### Option B: Drag & Drop
1. Run `npm run build` locally
2. Drag `dist` folder to Netlify dashboard

## 🔧 Environment Variables in Netlify

In Netlify dashboard → Site settings → Environment variables:

```
VITE_SUPABASE_URL = https://wntyzoninwupsiycrrjc.supabase.co
VITE_SUPABASE_KEY = your_actual_supabase_anon_key
VITE_TELEGRAM_BOT_TOKEN = your_telegram_bot_token
VITE_TELEGRAM_CHAT_ID = your_telegram_chat_id
VITE_SANDBOX_MODE = true
```

## 🧪 Testing After Deployment

### Test Routes
- `/v11-test/route` - Route management
- `/v11-test/selfie` - Selfie check-in
- `/v11-test/incident` - Incident reporting
- `/v11-test/telegram` - Telegram test

### Expected Features
✅ Live real-time updates
✅ Sound alerts on new data
✅ Toast notifications
✅ GPS tracking
✅ Photo uploads
✅ Telegram notifications

## 🚨 Safety Notes

- This deploys as SANDBOX version only
- Production site remains untouched
- All v1.1 components are isolated
- Environment toggle works: `VITE_SANDBOX_MODE=true`

## 📱 Mobile Testing

Test on mobile devices:
- GPS permissions
- Camera access
- Sound notifications
- Touch interactions

## 🔍 Troubleshooting

### Common Issues
1. **Build fails**: Check Node version (18)
2. **Environment vars**: Verify all are set in Netlify
3. **Routes not working**: Check redirects in netlify.toml
4. **Assets not loading**: Verify base path in vite.config.js

### Debug Steps
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build && npm run preview`
4. Check browser console for errors

## 🎯 Success Criteria

✅ Site loads without errors
✅ All v11-test routes accessible
✅ Real-time updates working
✅ Sound alerts functioning
✅ Toast notifications appearing
✅ GPS and camera permissions working
✅ Telegram notifications sending

---

**Ready for deployment! 🚀**
