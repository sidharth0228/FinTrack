# 🚀 FinTrack Production Deployment Guide

This guide provides instructions for deploying the **FinTrack** platform to production:
1. **Frontend (Static Client)** to **Vercel**
2. **Backend (Node.js/Express.js)** to **Railway**

---

## 💻 1. Backend Deployment (Railway)

The backend is a Node.js/Express application.

### Required Environment Variables (Railway Dashboard)
Configure these variables in your Railway service settings:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | The server port | `5000` |
| `MONGO_URI` | MongoDB Connection URI | `mongodb+srv://<user>:<password>@cluster.mongodb.net/fintrack` |
| `JWT_SECRET` | Secret key for JWT tokens | `generate_a_strong_random_secret_key` |
| `EMAIL_HOST` | SMTP Host for daily news delivery | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP Port | `587` |
| `EMAIL_USERNAME` | SMTP Username (Gmail/etc.) | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP App Password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | Sender Name & Address | `"FinTrack Advisor" <your-email@gmail.com>` |
| `EMAIL_ENABLED` | Toggle Daily Mail delivery | `true` |
| `ANGEL_ONE_CLIENT_ID` | Angel One Client Code (Optional) | `S61073046` |
| `ANGEL_ONE_PASSWORD` | Angel One Pin / Password | `1234` |
| `ANGEL_ONE_API_KEY` | Angel One API Key | `api_key_string` |
| `ANGEL_ONE_TOTP_SECRET`| Angel One TOTP seed | `totp_secret_string` |
| `LOCAL_LLM_URL` | AI Newspaper generation API | `http://localhost:11434/api/generate` (or cloud instance) |
| `LOCAL_LLM_MODEL` | AI Model name | `llama3` |

### Railway Deployment Steps
1. Sign in to **[Railway](https://railway.app)**.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `FinTrack` repository.
4. Railway will read the root `package.json` and automatically run `npm run build` (which installs backend dependencies) and `npm start` to run the Express server.
5. In the project dashboard under **Variables**, click **Raw Editor** and copy your environment variables (from your local `.env`).
6. Under **Settings** -> **Public Networking**, click **Generate Domain** to get your public API URL (e.g. `https://fintrack-backend.up.railway.app`).

---

## 🎨 2. Frontend Deployment (Vercel)

The active frontend consists of the high-performance vanilla HTML5, CSS3, and JavaScript files in the root folder, served statically.

### Vercel Deployment Steps
1. Sign in to **[Vercel](https://vercel.com)**.
2. Click **Add New** → **Project**.
3. Import your `FinTrack` repository.
4. In the configuration settings:
   * **Framework Preset:** Choose **Other** or **Static (HTML/CSS/JS)**.
   * **Root Directory:** Choose the repository root `./`.
5. Open `vercel.json` in your local project and update the destination in the rewrite section to your Railway backend URL:
   ```json
   {
     "version": 2,
     "cleanUrls": true,
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://<your-railway-backend-url>/api/:path*"
       }
     ]
   }
   ```
6. Click **Deploy**. Vercel will host the pages statically and route all `/api/*` endpoints to your production Railway server securely.

---

## 📦 3. Alternative: Running Everything on Railway
Since the backend Express server is already configured to serve the HTML pages statically (`app.use(express.static)`), you can simply deploy the Express server to Railway. The entire application (both backend APIs and HTML UI) will be accessible under the generated Railway URL.
