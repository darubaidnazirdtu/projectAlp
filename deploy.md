# Railway Deployment Guide (Docker)

This guide explains how to deploy the `projectAlp` application to Railway using your existing Docker setup. 

**Note:** Railway does not use `docker-compose.yml` directly. Instead, Railway treats each container or service from your `docker-compose.yml` as a separate "Service" within a single Railway "Project". 

Here is a step-by-step guide on what you have to do and what you'll need to change.

## 1. Setting up the Services in Railway

1. **Create a New Railway Project**
   - Go to your Railway dashboard and create a new empty project.

2. **Add a Database (MongoDB)**
   - Your backend expects a MongoDB instance. Since Railway provides native databases, you don't need a Docker image for this.
   - In your Railway project, click **New** -> **Database** -> **Add MongoDB**.

3. **Deploy the Backend**
   - Click **New** -> **GitHub Repo** and connect your repository.
   - Go to the settings of this newly created service.
   - Under **Build**, set the **Root Directory** to `/backend`. Railway will automatically find the `Dockerfile` inside the `/backend` folder and build it.
   - Go to **Settings** -> **Networking** and click **Generate Domain** to give your backend API a public URL.

4. **Deploy the Frontend**
   - Click **New** -> **GitHub Repo** and select the same repository again.
   - Go to the settings of this new service.
   - Under **Build**, set the **Root Directory** to `/frontend`. Railway will build the frontend using its `Dockerfile`.
   - Go to **Settings** -> **Networking** and click **Generate Domain** so your frontend gets a public URL.

5. **Deploy MinIO (Object Storage)**
   - Click **New** -> **Docker Image** -> type `minio/minio`.
   - Go to **Settings** -> **Volumes** and add a **Persistent Volume** mounted at `/data` (otherwise your uploaded files will be deleted every time the app restarts).
   - Under **Variables**, add your `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` (e.g. `minioadmin` for both).
   - Under **Service**, set the **Custom Start Command** to: `server /data --console-address ":9001"`
   - Go to **Settings** -> **Networking** and generate domains for both port `9000` (API) and port `9001` (Console) if you need public access.

## 2. Environment Variables & Code Changes

You don't need to rewrite your code if it's already using environment variables, but you must configure the **Variables** tab for each service in Railway:

### Backend Variables (in Railway)
- `PORT`: You can leave this blank or let Railway handle it. Railway automatically provides a `$PORT` variable. Ensure your Node.js app listens to `process.env.PORT || 8000`.
- `MONGODB_URI`: Use the connection string provided by the Railway MongoDB service you created (Railway automatically gives you a variable called `MONGO_URL` when you connect the DB to the backend service).
- `ORIGIN`: Change this from `http://localhost:3000` to the **public URL** Railway generated for your Frontend service (e.g., `https://your-frontend-app.up.railway.app`).
- `MINIO_ENDPOINT`: Instead of `minio` (which worked in `docker-compose`), use the Railway internal network name for your MinIO service (e.g., `minio.railway.internal`). 
- *Note:* Alternatively, since you already have Cloudinary variables in your `.env`, you could skip MinIO entirely on Railway and just use Cloudinary for file uploads if your code supports it.

### Frontend Configuration
- Any environment variables in your frontend that point to the backend API (like `VITE_API_URL` or `REACT_APP_API_URL`) must be changed from `http://localhost:8000` to the **public URL** Railway generated for your Backend service.
- *Important:* Because your frontend is likely a static app served by Nginx (standard Dockerfile setup), you must make sure that the API URL is injected at build time in Railway, or you configure your Nginx config to proxy the requests properly.

### Managing the `minio-init` Service
- You can **skip** deploying the `minio-init` service to Railway. 
- Instead, once MinIO is running on Railway, you can simply log into the MinIO Console (using the public domain you generated for port `9001`) and manually create the `apar-storage` bucket once.
