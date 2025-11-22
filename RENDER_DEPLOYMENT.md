# Deployment Guide for Render.com

## Issues Fixed for Production

✅ **Socket.IO CORS** - Now accepts production URLs from `CLIENT_URL` environment variable  
✅ **Backend CORS** - Dynamic origin filtering for both localhost and production  
✅ **Dependencies** - Removed local file references that don't work on Render  
✅ **Environment Variables** - All required vars documented in `.env.example`

## Deployment Steps

### 1. Backend Service on Render

1. Create a new **Web Service** on render.com
2. Connect your GitHub repository
3. Set these settings:
   - **Name:** `chat-app-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend`
   - **Start Command:** `npm start --prefix backend`
   - **Region:** Choose closest to you

4. Add Environment Variables in Render dashboard:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname...
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-strong-secret-key
   CLIENT_URL=https://your-frontend-url.onrender.com (set after deploying frontend)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. Deploy and note your backend URL (e.g., `https://chat-app-backend.onrender.com`)

### 2. Frontend Service on Render

1. Create a new **Static Site** on render.com
2. Connect your GitHub repository
3. Set these settings:
   - **Name:** `chat-app-frontend`
   - **Build Command:** `npm install --prefix frontend && npm run build --prefix frontend`
   - **Publish Directory:** `frontend/dist`
   - **Root Directory:** `/` (or leave blank)

4. Deploy and note your frontend URL (e.g., `https://chat-app-frontend.onrender.com`)

### 3. Update Backend Environment Variable

1. Go back to your backend service on Render
2. Update the `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://chat-app-frontend.onrender.com
   ```
3. Redeploy the backend

### 4. Update Frontend API Endpoint (if needed)

In `frontend/src/lib/axios.js`, the API endpoint should already be:
```javascript
baseURL: import.meta.env.MODE === "development" ? 'http://localhost:5001/api' : "/api"
```

This correctly uses `/api` in production (relative URL).

## Common Issues & Solutions

### "CORS Error" on frontend
→ Make sure `CLIENT_URL` is set in backend environment variables

### "Cannot find module" errors
→ Run `npm install` in both backend and frontend directories locally, then push to git

### Socket.IO connection fails
→ Verify `CLIENT_URL` is correct and Socket.IO middleware has proper CORS settings

### Database connection fails
→ Check `MONGODB_URI` is correct and IP whitelist is enabled in MongoDB Atlas

## Local Testing (Before Deployment)

```bash
# Kill existing processes
taskkill /F /IM node.exe

# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Build frontend
npm run build --prefix frontend

# Start backend (production mode)
PORT=5000 NODE_ENV=production npm start --prefix backend

# In another terminal, test the API
curl http://localhost:5000/api/auth/check
```

## Production Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] MONGODB_URI is valid and accessible
- [ ] Cloudinary credentials are correct
- [ ] CLIENT_URL is set to frontend URL
- [ ] Both services are deployed and running
- [ ] Test login/signup functionality
- [ ] Test image upload
- [ ] Check browser console for errors
- [ ] Verify Socket.IO connection in DevTools

