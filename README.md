# VedaAI - AI Assessment Creator

An AI-powered assessment creation platform for teachers. Create assignments, generate structured question papers using Google Gemini, track generation jobs, and view/export results.

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

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Implement and test locally
4. Open a PR with a description and testing steps

Please follow the existing TypeScript and formatting conventions.

## License

This repository does not include a license file. If you intend to publish or share the code, add a `LICENSE` file describing the intended license.

---

If you'd like, I can also:

- add example `.env` files for local development
- create a deployment checklist for Render and Vercel (step-by-step)
- open a PR with these changes and update CI scripts

Would you like me to commit this README now and create the deployment checklist next? 
