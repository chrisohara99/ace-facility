# Ace Facility — Tennis Dashboard

A complete facility management dashboard with live Supabase backend.

---

## Setup (5 steps)

### 1. Create a Supabase project
- Go to https://supabase.com and create a new project
- Wait for provisioning (~1 min)

### 2. Run the database schema
- In your Supabase project, go to **SQL Editor**
- Open `sql/schema.sql` from this folder
- Paste the entire contents and click **Run**

### 3. Configure your credentials
- In Supabase, go to **Settings → API**
- Copy your **Project URL** and **anon public key**
- Open `js/config.js` and replace the two placeholder values:

```js
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';
```

### 4. Enable email auth
- In Supabase, go to **Authentication → Providers**
- Ensure **Email** is enabled (it is by default)
- Under **Authentication → URL Configuration**, add your site URL
  (e.g. `http://localhost:5500` for local dev, or your deployed URL)

### 5. Open the app
Serve the folder with any static file server. The easiest options:

**VS Code Live Server** (recommended for local dev):
- Install the "Live Server" extension
- Right-click `index.html` → Open with Live Server

**Python (no install needed):**
```bash
cd tennis-dashboard
python3 -m http.server 5500
# Open http://localhost:5500
```

**Node.js:**
```bash
npx serve tennis-dashboard
```

---

## How to use

1. Open `login.html` in your browser
2. Enter your email and click "Send magic link"
3. Click the link in your email — you'll be redirected to the dashboard

## First steps after login
- Add members via Members → "+ Add member"
- Create bookings via Schedule → "+ New booking"
- Court status updates are **live** (realtime dot turns green when connected)

---

## File structure

```
tennis-dashboard/
├── index.html          # Main dashboard
├── login.html          # Auth / magic link page
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # Your Supabase credentials ← edit this
│   └── main.js         # All data fetching, realtime, UI logic
└── sql/
    └── schema.sql      # Run this once in Supabase SQL Editor
```

---

## Deploying to production

This is a static site — deploy anywhere:

- **Netlify**: drag-and-drop the folder at app.netlify.com
- **Vercel**: `npx vercel` from the folder
- **GitHub Pages**: push to a repo, enable Pages in settings

After deploying, add your production URL to Supabase under:
**Authentication → URL Configuration → Site URL**

---

## Adding invoices

Invoices aren't auto-generated yet — to create one, use the Supabase table editor or run:

```sql
insert into invoices (member_id, description, amount_cents, status, due_at)
values (
  'MEMBER_UUID_HERE',
  'Monthly membership · March 2026',
  8500,
  'outstanding',
  '2026-03-31'
);
```
