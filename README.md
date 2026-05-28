# VedaAI — AI Assessment Creator

An AI-powered assessment creation platform for teachers. Create assignments, generate structured question papers using Google Gemini, track generation jobs, and view/export results.

## What this README includes

- Project overview and architecture
- Tech stack and repository layout
- Local development setup and commands
- Environment variables (backend + frontend)
- Build & production deployment (Render for backend, Vercel for frontend)
- Troubleshooting and common issues

## Quick overview

- Frontend: Next.js App Router (TypeScript, Tailwind CSS)
- Backend: Node.js + Express (TypeScript), Mongoose, BullMQ (Redis) for background AI jobs
- AI: Google Gemini via API key
- Realtime: Socket.IO for job updates

## Repo layout (top-level)

```
Veda-ai/
├── README.md
├── docker-compose.yml      # optional: local Redis + MongoDB (development)
├── backend/
│   ├── .env.example        # copy to .env and fill values
│   ├── package.json        # backend scripts (build/start/dev)
│   └── src/
│       ├── index.ts        # Express + Socket.IO server (entry)
│       ├── routes/         # API endpoints
│       ├── models/         # Mongoose schemas
│       └── queue/          # BullMQ queue + workers
└── frontend/
    ├── package.json        # Next.js app
    └── src/
        ├── app/            # Next App Router pages
        ├── components/     # UI components
        └── lib/            # helpers (api.ts, socket)
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB (Atlas or local)
- Redis (Upstash, Redis Cloud, or local)
- Google Gemini API key (or whichever LLM provider you configure)

Optional (development): Docker to run MongoDB/Redis locally via `docker-compose.yml`.

## Local development

1. Install dependencies

```bash
git clone <repo-url>
cd Veda-ai

# Backend deps
cd backend && npm install

# Frontend deps
cd ../frontend && npm install
```

2. Configure environment variables

Backend: copy and edit `backend/.env.example` → `backend/.env`

Example `backend/.env` (fill values):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vedaai
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret

# Optional
UPSTASH_REDIS_REST_TOKEN=
```

Frontend: add `frontend/.env.local` (or configure in Vercel):

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

3. Start services (development)

Open two terminals:

```bash
# Terminal 1 — Backend (dev)
cd backend
npm run dev

# Terminal 2 — Frontend (dev)
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` by default and proxies API calls to `NEXT_PUBLIC_API_URL`.

## Important NPM scripts

- `backend/package.json` typically contains:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

- `frontend/package.json` contains the standard Next.js scripts: `dev`, `build`, `start`.

## Production build & deploy

### Backend (Render recommended)

We recommend deploying the backend to a server environment such as Render, Railway, or a VPS that supports Node. The backend uses native modules (pdf-parse / @napi-rs/canvas) and should NOT run in Vercel serverless functions.

Render example:

1. Build command: `npm run build` (in `backend`)
2. Start command: `npm start` (runs `node dist/index.js`)
3. Set environment variables in Render dashboard (MONGODB_URI, REDIS_URL, GEMINI_API_KEY, JWT_SECRET)

Note: a small file `backend/index.ts` exists as a thin forwarder used by some hosts that expect a root `index` entrypoint. If you switch Render to run `npm run build && npm start` you can remove the forwarder later.

### Frontend (Vercel recommended)

Deploy the `frontend` app to Vercel. Important: prevent Vercel from building the backend code (which includes native libs) — configure Vercel to build only the frontend.

Options:

- Set the Project Root in Vercel to `frontend`.
- Or add `vercel.json` at repo root targeting `frontend/package.json` for the Next builder.

Ensure the `NEXT_PUBLIC_API_URL` environment variable in Vercel points to your running backend (Render URL), e.g. `https://veda-ai-df6s.onrender.com`.

## Environment variables (summary)

Backend (`backend/.env`):

- `MONGODB_URI` — MongoDB connection string
- `PORT` — server port (e.g., `5000`)
- `GEMINI_API_KEY` — Google Gemini API key
- `REDIS_URL` — Redis connection URL (BullMQ)
- `JWT_SECRET` — JWT signing secret

Frontend (`frontend/.env.local` or Vercel env):

- `NEXT_PUBLIC_API_URL` — Base URL of backend API (e.g. `https://...`) 
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — optional Google OAuth client id

DO NOT commit `.env` files containing secrets.

## Troubleshooting & common issues

- pdf-parse / canvas errors during Vercel deploy

  Symptom: `ReferenceError: DOMMatrix is not defined` or Vercel functions failing with `FUNCTION_INVOCATION_FAILED`.

  Cause: Native packages (`@napi-rs/canvas`, `pdf-parse`) require native binaries / DOM APIs not available in Vercel serverless runtime. This happens if the backend is included in the Vercel build.

  Fix: Ensure Vercel builds only the frontend (set Project Root to `frontend` or use `vercel.json`). Deploy backend separately (Render/Railway).

- Port conflicts (EADDRINUSE)

  On Windows, find and kill the process using the port (example for port 3000):

  ```powershell
  $ports = netstat -ano | findstr :3000
  if ($ports) {
    $pids = $ports -split "\r?\n" | ForEach-Object { ($_ -split '\\s+')[-1] } | Select-Object -Unique
    foreach ($x in $pids) { taskkill /PID $x /F }
  } else { Write-Output 'No process on port 3000' }
  ```

- Job/queue failures

  Check Redis connectivity (`REDIS_URL`) and the BullMQ worker logs. Worker failures often surface when the Gemini API key is invalid or rate-limited.

## Data seeding

On first run the backend may seed demo accounts (check `seedDemoAccounts` in `backend/src/index.ts`). Edit or remove seeding behavior if you don't want demo users.

## Useful commands

Backend (from repo root):

```bash
cd backend
npm run dev      # dev w/ ts-node-dev
npm run build    # tsc -> dist
npm start        # runs node dist/index.js (production)
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run start
```

Docker (optional local infra):

```bash
docker-compose up --build
```

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Implement and test locally
4. Open a PR with a description and testing steps

Please follow the existing TypeScript and formatting conventions.

## Where to look in the codebase (quick pointers)

- Backend entry: `backend/src/index.ts` — server, routes, seeds
- Frontend API helper: `frontend/src/lib/api.ts` — uses `NEXT_PUBLIC_API_URL`
- Notifications: `backend/src/routes/notifications.ts` and `frontend/src/app/dashboard/notifications`
- Assignment generation queue: `backend/src/queue/` (BullMQ worker)

## License

This repository does not include a license file. If you intend to publish or share the code, add a `LICENSE` file describing the intended license.

---

If you'd like, I can also:

- add example `.env` files for local development
- create a deployment checklist for Render and Vercel (step-by-step)
- open a PR with these changes and update CI scripts

Would you like me to commit this README now and create the deployment checklist next? 
