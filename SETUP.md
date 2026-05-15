Setup and run (summary)

This repo contains multiple Node projects (backend + frontend). Follow these commands to prepare your machine and run the project locally.

Prerequisites (manual or automated):
- Git
- Node.js LTS (node + npm)
- MongoDB (local `mongod` or a MongoDB Atlas URI)

Automated bootstrap (PowerShell):

Run the bundled bootstrap to check prerequisites, create env files, and install npm deps:

```powershell
powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
```

What `bootstrap.ps1` does:
- Detects `node`, `npm`, `git`, and `mongod`.
- Offers to install Node and Git via `winget` (if available).
- Copies `backend/.env.example` -> `backend/.env` if missing, and creates `frontend/.env` with a default `VITE_BASEURL`.
- Runs `install-all.ps1` to run `npm install` / `npm ci` in each folder containing `package.json`.

If you prefer to run commands manually:

1) Install Node.js LTS: https://nodejs.org/
2) Install MongoDB Community Server: https://www.mongodb.com/try/download/community or use Atlas
3) From the workspace root run:

```powershell
# Install dependencies for each package (helper script)
powershell -ExecutionPolicy Bypass -File .\install-all.ps1

# Create backend .env (edit values)
Copy-Item backend\.env.example backend\.env
# Edit backend\.env and set MONGODB_URI (e.g. mongodb://localhost:27017), JWT_SECRET, other keys.

# Create frontend .env if needed
Set-Content frontend\.env "VITE_BASEURL=http://localhost:8000/api/v1"

# Start backend (from backend folder)
cd backend
npm run dev

# In another terminal: Start frontend
cd frontend
npm run dev
```

Environment variables required (see backend/.env.example):
- MONGODB_URI (e.g. mongodb://localhost:27017)
- JWT_SECRET
- PORT (optional)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (if using uploads)
- BCRYPT_SALT_ROUNDS (optional)

Frontend dev server expects `VITE_BASEURL` in `frontend/.env` (defaults to `http://localhost:8000/api/v1`).

If you want a single top-level npm workspace (one `npm install` installs everything), I can add a root `package.json` with `workspaces` configured — tell me if you want that.
