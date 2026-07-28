# Presupuesto — Deployment Guide

You have two ways to get this online. Start with Option A — it's the fastest and needs
no coding tools at all. Option B is worth doing later if you want the site to
auto-update whenever you (or Claude Code) change the code.

---

## Option A — Netlify drag-and-drop (5 minutes, no GitHub, no terminal)

1. Go to https://app.netlify.com and sign up (free — email or GitHub login).
2. Once logged in, look for "Add new site" → "Deploy manually" (sometimes just a big
   dashed box that says "Drag and drop your site output folder here").
3. Unzip `presupuesto-dist.zip` on your computer. You'll get a folder called `dist`.
4. Drag that `dist` folder onto the Netlify page.
5. Netlify gives you a live URL in a few seconds, like `random-name-123.netlify.app`.
6. Open that URL on your iPhone in Safari → tap the Share icon → "Add to Home Screen".
   You now have an app icon that opens full-screen, no browser bar.

**Limitation:** if you edit the code later, you'll need to rebuild (`npm run build`)
and drag the new `dist` folder up again manually. Fine for occasional tweaks; annoying
for frequent changes — that's what Option B solves.

---

## Option B — GitHub + Vercel (auto-deploys on every change)

Better if you plan to keep iterating on this (e.g. with Claude Code later).

1. Create a free GitHub account if you don't have one: https://github.com/signup
2. Create a new empty repository (e.g. `presupuesto`).
3. Unzip `presupuesto-source.zip` into a folder on your computer.
4. In a terminal, inside that folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/presupuesto.git
   git push -u origin main
   ```
5. Go to https://vercel.com, sign up (free, can use your GitHub login directly).
6. "Add New Project" → import the `presupuesto` repo you just pushed.
7. Vercel auto-detects it's a Vite project — leave all settings default, click Deploy.
8. You get a URL like `presupuesto.vercel.app`. Same "Add to Home Screen" step on
   iPhone as above.
9. From now on, any time you `git push` a change, Vercel rebuilds and redeploys
   automatically — no manual re-upload needed.

---

## About your data

This app stores your budget entries using your browser's `localStorage` — meaning
your data lives only on the specific device + browser you're using (e.g. Safari on
your iPhone). It will NOT show up if you open the same URL on a laptop or a different
browser — that would start fresh/empty. If you want your data to follow you across
devices, that requires adding a real backend (Supabase is the easiest option) —
worth doing later if this becomes a problem in practice, but unnecessary complexity
for now.

## Local development (optional)

If you want to run it on your own computer before deploying:
```
npm install
npm run dev
```
Then open the local URL it prints (usually `http://localhost:5173`).
