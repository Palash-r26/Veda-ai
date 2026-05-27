# VedaAI — AI Assessment Creator

An AI-powered assessment creation tool for teachers. Build assignments, generate question papers using Gemini AI, and view structured output — all in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Zustand, Socket.IO Client |
| Backend | Node.js, Express 5, TypeScript, BullMQ, Socket.IO |
| Database | MongoDB (Atlas) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| AI | Google Gemini 2.5 Pro |

---

## Project Structure

```
Veda-ai/
├── .gitignore              # Root-level — covers backend + frontend
├── README.md
├── docker-compose.yml      # Local Redis + MongoDB (optional)
├── backend/
│   ├── .env.example        # Copy to .env and fill in your values
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── index.ts        # Express + Socket.IO server
│       ├── models/         # Mongoose schemas (Assignment, QuestionPaper)
│       ├── routes/         # REST API routes (assignments, papers)
│       └── queue/          # BullMQ queue + worker (AI generation)
└── frontend/
    └── src/
        ├── app/            # Next.js app router pages
        ├── components/     # SocketProvider, AssignmentForm
        └── store/          # Zustand state (useAssignmentStore)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis instance (Upstash free tier or local)
- Google Gemini API key ([get one here](https://aistudio.google.com/))

### 1. Clone & Install

```bash
git clone <repo-url>
cd Veda-ai

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# In /backend — copy the example and fill in real values
cp .env.example .env
```

Edit `backend/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vedaai
PORT=5000
GEMINI_API_KEY=your_key_here
REDIS_URL=redis://localhost:6379
```

For frontend, create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/assignments` | Create assignment + queue AI generation |
| `GET` | `/api/assignments` | List all assignments |
| `GET` | `/api/assignments/:id` | Get assignment + associated paper |
| `GET` | `/api/papers/:id` | Get a generated question paper by ID |

**WebSocket events (Socket.IO):**
- `job-update` — job status changed (pending → processing)
- `job-complete` — generation done, `paperId` in payload
- `job-failed` — generation failed

---

## Flow

```
Teacher fills form → POST /api/assignments (with optional file)
  → Assignment saved in MongoDB
  → Job added to BullMQ queue (Redis)
  → Worker picks up job → calls Gemini API
  → Structured paper saved to MongoDB
  → Socket.IO emits job-complete to frontend
  → Frontend navigates to /output/:paperId
  → GET /api/papers/:paperId returns the paper
```

---

## Development Notes

- `uploads/` directory is auto-created at runtime and is gitignored
- The `.env` file is gitignored — **never commit real credentials**
- Run `docker-compose up` for local Redis + MongoDB if you don't have cloud instances
