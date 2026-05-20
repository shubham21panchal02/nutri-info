# 🥗 NutriInfo — AI Nutrition Analyzer

Free AI-powered nutrition analysis using **Groq API (Llama 3.3 70B)** — no credit card needed.

---

## 📁 Project Structure

```
nutri-info/
├── backend/
│   ├── server.js          ← Express API server
│   ├── .env               ← Your API key (never commit this)
│   ├── .env.example       ← Template for .env
│   ├── .gitignore
│   └── package.json
└── frontend/
    ├── index.html         ← Main HTML (4 pages: Home, Category, Log, About)
    ├── css/
    │   └── style.css      ← All styles
    └── js/
        ├── data.js        ← Category & food data
        └── app.js         ← All frontend logic
```

---

## 🚀 Run Locally in VS Code

### Step 1 — Get your FREE Groq API Key
1. Go to **https://console.groq.com** and sign up (free, no credit card)
2. Click **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_`)

### Step 2 — Set up the backend
```bash
cd backend
npm install
```

Open `backend/.env` and paste your key:
```
GROQ_API_KEY=gsk_your_actual_key_here
PORT=5000
FRONTEND_URL=http://127.0.0.1:5500
```

Start the backend:
```bash
npm run dev
# ✅ NutriInfo backend running at http://localhost:5000
```

### Step 3 — Open the frontend
- Install the **Live Server** extension in VS Code
- Right-click `frontend/index.html` → **Open with Live Server**
- It opens at `http://127.0.0.1:5500`

That's it! Start searching any food 🎉

---

## 🌐 Deploy for Free

### Backend → [Render.com](https://render.com) (free tier)
1. Push your code to GitHub (**do NOT commit `.env`**)
2. Go to Render → New → **Web Service**
3. Connect your repo, set root to `backend/`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variable: `GROQ_API_KEY = gsk_your_key`
7. Copy your Render URL e.g. `https://nutri-info.onrender.com`

### Frontend → [Netlify](https://netlify.com) (free tier)
1. In `frontend/js/app.js` line 4, change:
   ```js
   const API_BASE = "https://nutri-info.onrender.com";
   ```
2. Drag the `frontend/` folder into Netlify Drop → instant deploy

---

## 🔑 API Used
- **Groq API** — https://console.groq.com
- Model: `llama-3.3-70b-versatile`
- Cost: **FREE** (generous daily limits, no billing required)
