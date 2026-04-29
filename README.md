# MediTrack — Smart Health Reminder

A production-ready standalone medication management app with:
- 🔔 Voice reminders (every 5 mins until confirmed)
- 🤖 MediBot AI chat assistant
- 📊 Health compliance reports with AI analysis
- 🔥 Firebase Auth (Email + Google Sign-In)
- ☁️ Firestore real-time sync
- 📱 Fully responsive (mobile, tablet, desktop)

---

## Quick Deploy to Vercel (5 minutes)

### Option A — Deploy via Vercel Dashboard (Recommended, No CLI needed)

1. **Upload to GitHub**
   - Go to https://github.com/new → create a new repo
   - Upload all these files (drag & drop the folder)

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository" → select your repo
   - Framework: **Vite** (auto-detected)

3. **Add Environment Variable**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `VITE_ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
   - (Firebase config is already bundled in the code)

4. **Click Deploy** → Get your live URL instantly ✅

---

### Option B — Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Install project deps
npm install

# Deploy
vercel --prod
```

When prompted:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Add env variable in Vercel dashboard after first deploy.

---

### Option C — Deploy to Netlify

1. Go to https://app.netlify.com/drop
2. Run `npm run build` locally
3. Drag the `dist/` folder into Netlify
4. Add `VITE_ANTHROPIC_API_KEY` in Site Settings → Environment Variables

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env.local
# Edit .env.local and add your VITE_ANTHROPIC_API_KEY

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build
```

---

## Firebase Setup (Already configured)

Your Firebase project (`gen-lang-client-0161444383`) is already connected.
The Firestore database ID is pre-configured in `src/lib/firebase.ts`.

**Important:** Make sure these are enabled in your Firebase Console:
- Authentication → Sign-in method → Email/Password ✅
- Authentication → Sign-in method → Google ✅
- Firestore Database → Rules (use the `firestore.rules` file from your export)

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_ANTHROPIC_API_KEY` | Recommended | Enables MediBot AI + Health Report AI analysis |
| Firebase vars | Optional | Override if using a different Firebase project |

> **Note:** The app works without `VITE_ANTHROPIC_API_KEY` — AI features will show a graceful message. Core features (medicines, reminders, logs) work fully without it.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (fast builds, optimized for Vercel)
- **Tailwind CSS** (utility-first styling)
- **Framer Motion** (animations)
- **Firebase** (Auth + Firestore real-time DB)
- **Recharts** (health adherence charts)
- **Web Speech API** (voice reminders, no API key needed)
