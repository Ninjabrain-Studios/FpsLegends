# Quick Vercel Deployment Guide

## ⚠️ IMPORTANT: Two-Part Deployment Required

Your FPS Legends game needs:
1. **Frontend** → Vercel (what we're deploying now)
2. **Backend** → Railway/Render (must be deployed separately)

**The game will NOT work with only frontend deployment!**

---

## Step-by-Step: Deploy to Vercel

### 1. Deploy Frontend to Vercel

#### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your `FpsLegends` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_WS_URL=https://your-backend-url.railway.app
   ```
   ⚠️ **You need to deploy backend first to get these URLs!**
7. Click "Deploy"

#### Option B: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Navigate to client directory
cd client

# Deploy
vercel

# For production deployment
vercel --prod
```

---

## Step 2: Deploy Backend to Railway (REQUIRED)

**Without this, your game won't work!**

### Quick Railway Setup

1. **Go to**: https://railway.app
2. **Sign up** with GitHub (free $5/month credit)
3. **New Project** → "Deploy from GitHub repo"
4. **Select**: Your FpsLegends repo
5. **Settings** → Set root directory to `server`
6. **Add Database**: New → PostgreSQL
7. **Environment Variables**:
   ```
   NODE_ENV=production
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_REDIRECT_URI=https://YOUR-RAILWAY-URL.railway.app/api/auth/discord/callback
   JWT_SECRET=generate_random_32_character_string
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
   ```
8. **Deploy** → Railway auto-deploys
9. **Copy your Railway URL** (e.g., `https://fps-legends.railway.app`)

### Update Frontend Environment Variables

Go back to Vercel:
1. Project Settings → Environment Variables
2. Update:
   ```
   VITE_API_URL=https://your-actual-railway-url.railway.app
   VITE_WS_URL=https://your-actual-railway-url.railway.app
   ```
3. Redeploy frontend

---

## Step 3: Update Discord OAuth

1. Go to https://discord.com/developers/applications
2. Select your application
3. OAuth2 → Redirects
4. Add: `https://YOUR-RAILWAY-URL.railway.app/api/auth/discord/callback`
5. Save

---

## Step 4: Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Click "Login with Discord"
3. Authorize the app
4. Try finding a match (need 8 players)

---

## Current Status

✅ Frontend code ready for Vercel
✅ Vercel configuration created (`client/vercel.json`)
✅ Deployment guide created
⚠️ **Backend must be deployed to Railway for game to work**

---

## Quick Commands

```bash
# Deploy frontend to Vercel
cd client
vercel --prod

# Push code to GitHub (for Railway auto-deploy)
git push origin compyle/fps-game-full-featured
```

---

## Troubleshooting

### "Cannot connect to server"
→ Backend not deployed or wrong URL in environment variables

### "Discord OAuth fails"
→ Check redirect URI matches Railway URL exactly

### "Game loads but matchmaking fails"
→ WebSocket connection issue - verify Railway backend is running

---

## Cost

- **Vercel**: FREE (Hobby plan)
- **Railway**: $5/month credit (free tier, usually enough for testing)
- **Total**: $0-5/month

---

**Next Steps:**
1. Deploy backend to Railway (5 minutes)
2. Deploy frontend to Vercel (2 minutes)
3. Update environment variables
4. Test the game!

See `DEPLOYMENT.md` for detailed instructions.
