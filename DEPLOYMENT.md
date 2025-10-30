# FPS Legends - Deployment Guide

This guide covers deploying the complete FPS Legends game to production.

## Architecture Overview

The game requires:
- **Frontend**: Static React + Babylon.js app → Deploy to Vercel
- **Backend**: Node.js server with WebSockets → Deploy to Railway/Render
- **Database**: PostgreSQL → Included with Railway/Render

## Option 1: Vercel (Frontend) + Railway (Backend) - RECOMMENDED

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub
   - Free tier: $5/month credit

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `FpsLegends` repository
   - Select the `server` directory

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will auto-create `DATABASE_URL` environment variable

4. **Configure Environment Variables**

   In Railway project settings, add these variables:
   ```
   NODE_ENV=production
   PORT=3000
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   DISCORD_REDIRECT_URI=https://your-railway-app.railway.app/api/auth/discord/callback
   JWT_SECRET=your_secure_random_secret_key_minimum_32_characters
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   ```

5. **Update Discord OAuth Redirect**
   - Go to Discord Developer Portal
   - Update redirect URI to your Railway backend URL
   - Example: `https://fps-legends-production.up.railway.app/api/auth/discord/callback`

6. **Deploy**
   - Railway auto-deploys on git push
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Client Directory**
   ```bash
   cd client
   vercel
   ```

4. **Follow Prompts**
   - Link to existing project or create new
   - Accept default settings
   - Vercel will build and deploy

5. **Configure Environment Variables**

   In Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   VITE_WS_URL=https://your-railway-backend-url.railway.app
   ```

6. **Redeploy**
   ```bash
   vercel --prod
   ```

### Step 3: Update CORS

Update your Railway backend's `ALLOWED_ORIGINS` to include your Vercel URL:
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

### Step 4: Test

1. Visit your Vercel frontend URL
2. Click "Login with Discord"
3. Verify authentication works
4. Test matchmaking with multiple browser windows

---

## Option 2: All-in-One Railway Deployment

Deploy both frontend and backend to Railway:

1. **Create Railway Project**
   - Deploy backend as described above

2. **Add Frontend Service**
   - Click "New" → "GitHub Repo"
   - Choose your repo
   - Set root directory to `client`
   - Railway will auto-detect Vite

3. **Configure Environment Variables**
   - Same as above, but use Railway URLs for both services

4. **Deploy**
   - Railway handles everything

---

## Option 3: Render (Alternative to Railway)

Similar to Railway but with different interface:

1. **Create Render Account**: https://render.com
2. **New Web Service**: Deploy backend
3. **New PostgreSQL**: Create database
4. **New Static Site**: Deploy frontend
5. Configure environment variables as above

---

## Production Checklist

### Security
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS (automatically handled by Railway/Vercel)
- [ ] Verify CORS settings only allow your frontend domain
- [ ] Update Discord OAuth redirect URIs to production URLs

### Performance
- [ ] Enable gzip compression (automatic on Railway/Vercel)
- [ ] Optimize Babylon.js assets
- [ ] Monitor database connection pool
- [ ] Set up error logging (Railway has built-in logs)

### Testing
- [ ] Test Discord OAuth flow end-to-end
- [ ] Verify matchmaking with 8 players
- [ ] Test all 3 maps load correctly
- [ ] Check leaderboard updates after matches
- [ ] Test weapon shooting and hit detection

### Monitoring
- [ ] Check Railway/Vercel logs for errors
- [ ] Monitor database usage
- [ ] Track response times
- [ ] Monitor WebSocket connections

---

## Quick Deploy Commands

### Frontend to Vercel
```bash
cd client
vercel login
vercel --prod
```

### Backend to Railway (via Git)
```bash
cd FpsLegends
git add .
git commit -m "Deploy to production"
git push origin main
# Railway auto-deploys on push
```

---

## Custom Domains

### Vercel Custom Domain
1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Vercel auto-provisions SSL certificate

### Railway Custom Domain
1. Go to Railway project → Settings → Domains
2. Click "Generate Domain" or add custom domain
3. Update DNS if using custom domain
4. Railway auto-provisions SSL certificate

---

## Troubleshooting

### Issue: "Cannot connect to server"
- **Check**: Backend URL is correct in frontend `.env`
- **Check**: CORS is configured properly on backend
- **Check**: Railway backend is running (check logs)

### Issue: "Discord OAuth fails"
- **Check**: Redirect URI matches exactly in Discord app settings
- **Check**: Backend URL is accessible
- **Check**: CLIENT_ID and CLIENT_SECRET are correct

### Issue: "Database connection error"
- **Check**: DATABASE_URL is set correctly
- **Check**: Prisma migrations ran successfully
- **Check**: PostgreSQL is running (Railway auto-manages)

### Issue: "WebSocket connection fails"
- **Check**: Backend supports WebSockets (Railway does)
- **Check**: VITE_WS_URL uses `https://` not `http://`
- **Check**: No proxy/firewall blocking WebSockets

---

## Cost Estimates

### Free Tier (Sufficient for Testing)
- **Railway**: $5/month credit (enough for small traffic)
- **Vercel**: Free hobby plan
- **Total**: $0-5/month

### Paid Tier (Production)
- **Railway**: ~$5-20/month (scales with usage)
- **Vercel**: $20/month Pro plan (optional)
- **Total**: $5-40/month depending on traffic

---

## Need Help?

1. **Railway Docs**: https://docs.railway.app
2. **Vercel Docs**: https://vercel.com/docs
3. **Discord OAuth**: https://discord.com/developers/docs/topics/oauth2

---

**You're ready to deploy!** Follow the steps above for your chosen platform.
