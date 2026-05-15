# APAR / IQAC Project — Sequential Troubleshooting Guide

This README documents a concise, sequential workflow to find, reproduce, and fix issues in this repository (backend + frontend). Follow steps in order — each step verifies or resolves a class of common problems.

## Quick summary
- Backend: Node (Express 5) + MongoDB. Entrypoint: [backend/src/index.js](backend/src/index.js#L1-L32) -> [backend/src/app.js](backend/src/app.js#L1-L196)
- Frontend: React + Vite. Entrypoint: [frontend/src/main.jsx](frontend/src/main.jsx#L1-L97) -> [frontend/src/App.jsx](frontend/src/App.jsx#L1-L26)

## Prerequisites
- Node 18+ and npm
- MongoDB (or a cloud MongoDB URI)
- Environment file named `env` (project uses `dotenv.config({ path: './env' })`) with required vars: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `ORIGIN`, `CLOUDINARY_*`, `BCRYPT_SALT_ROUNDS`.

## Requirements (detailed)
Ensure the following before running the project locally:

- Operating System: Windows, macOS, or Linux (instructions below assume Windows PowerShell).
- Node.js: v18.x or later (LTS). npm is bundled with Node. Verify with:
```bash
node -v
npm -v
```
- Optional: `nvm` / `nvm-windows` if you manage multiple Node versions.
- Git: for cloning and version control (optional but recommended).
- MongoDB: a running MongoDB instance or a cloud MongoDB URI (Atlas). The backend code will connect to `${MONGODB_URI}/apar`.
	- Minimum recommended: MongoDB 5.x+.
- Ports used by default:
	- Backend: `8000` (configurable via `PORT` in `backend/env`).
	- Frontend (Vite): `5173` (Vite default). Frontend expects backend API under `VITE_BASEURL` (e.g. `http://localhost:8000/api/v1`).
- Environment variables (create `backend/env`):
	- `MONGODB_URI` (e.g. `mongodb://localhost:27017`)
	- `JWT_SECRET` (strong secret for JWT signing)
	- `PORT` (optional, default 8000)
	- `ORIGIN` (comma-separated allowed origins for CORS, e.g. `http://localhost:5173`)
	- `BCRYPT_SALT_ROUNDS` (optional, e.g. `12`)
	- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (if file uploads use Cloudinary)
- Frontend env (create `frontend/.env`):
	- `VITE_BASEURL` (should point to backend API base, e.g. `http://localhost:8000/api/v1`)
- Developer utilities (recommended):
	- `nodemon` for backend auto-reload (already in `devDependencies`)
	- `concurrently` or separate terminals to run backend + frontend
	- A modern browser (Chrome, Edge, Firefox) for the frontend

Notes & troubleshooting:
- If PowerShell says `npm` is not recognized, install Node.js and ensure the installer option to add Node to PATH is enabled, or install `nvm-windows` and run `nvm use 18`.
- If using MongoDB Atlas, ensure your connection string allows connections from your IP and includes credentials.
- If uploads or notifications depend on third-party APIs (Cloudinary, SMTP, socket config), supply the relevant credentials in `backend/env` before starting the server.

## Start services (local)
From `backend`:
```bash
cd backend
npm install
npm run dev
```

From `frontend`:
```bash
cd frontend
npm install
npm run dev
```

## Run the route tester (reproduce failing endpoints)
Start the backend, then in `backend` run:
```bash
# Windows (PowerShell or cmd)
set BASE_URL=http://localhost:8000 && node tools/route_tester.js
```
The tool generates `route-test-report.json` and `route-test-report.txt` which show 4xx/5xx endpoints.

## Sequential troubleshooting checklist (do these in order)

1) Verify environment and secrets
- Ensure `env` exists and contains `JWT_SECRET` and `MONGODB_URI`.
- If `JWT_SECRET` is missing the server will throw auth errors: see [backend/src/utils/jwt.js](backend/src/utils/jwt.js#L1-L34).

2) Start DB and backend
- Confirm MongoDB connection string (the code appends `/apar`): [backend/src/db/index.js](backend/src/db/index.js#L1-L12).

3) Reproduce with route tester
- Run `tools/route_tester.js` and inspect `route-test-report.json`.
- Prioritize fixing server errors (5xx) first, then auth (401/403).

4) Fix auth issues (common causes)
- Check `authenticate` and `createRouteGuard` behaviors: [backend/src/middlewares/auth.middleware.js](backend/src/middlewares/auth.middleware.js#L1-L122). 
- Ensure missing `throw` statements are deliberate; otherwise return 401 using `ApiError` for unauthenticated access.

5) Fix file-handling errors
- Guard `fs.unlinkSync` calls in [backend/src/utils/cloudinary.js](backend/src/utils/cloudinary.js#L1-L76) — use `fs.existsSync` and wrap unlink in try/catch.

6) Sync frontend/back-end base URLs
- Set `VITE_BASEURL` in frontend `.env`/dev env to `http://localhost:8000/api/v1` or update fallback in [frontend/src/api/Api.js](frontend/src/api/Api.js#L1-L117).

7) Re-run route tester and targeted tests
- Repeat step 3 until reported 5xx are gone and auth endpoints respond correctly.

8) Harden error handling & logging
- Avoid returning raw stack traces in API responses. Use structured `ApiError` and server logs.

9) Move heavy tooling to devDependencies (optional)
- Check `puppeteer` in frontend `package.json` — move to `devDependencies` if not required at runtime.

## Files to edit for common fixes
- Auth middleware: [backend/src/middlewares/auth.middleware.js](backend/src/middlewares/auth.middleware.js#L1-L122)
- JWT configuration: [backend/src/utils/jwt.js](backend/src/utils/jwt.js#L1-L34)
- Cloudinary helpers: [backend/src/utils/cloudinary.js](backend/src/utils/cloudinary.js#L1-L76)
- API client base URL: [frontend/src/api/Api.js](frontend/src/api/Api.js#L1-L117)

## Useful commands
- Run backend tests / route checks:
```bash
cd backend
node tools/route_tester.js
```
- Start backend in dev with env present:
```bash
cd backend
npm run dev
```

## Next steps (recommended)
1. Run the route tester and attach the latest `route-test-report.json`.
2. I can then apply targeted patches (e.g., safe-unlink, stricter auth checks) and re-run the tester.

If you want, I can now: (A) run the route tester, (B) implement a safe `unlinkSync` patch, or (C) harden the auth middleware — tell me which.
