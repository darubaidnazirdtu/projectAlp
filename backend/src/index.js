import dotenv from 'dotenv'
import { connectDB } from './db/index.js'
import { app } from './app.js'
import { createServer } from 'http'
import { initializeSocket } from './config/socket.js'
import { ensureAparBucket } from './services/minio.service.js'

dotenv.config();

const port = process.env.PORT || 8000

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

connectDB()
    .catch((err) => {
        console.error("MONGO db connection failed !!! ", err);
    })

ensureAparBucket().catch((err) => {
    console.error('MinIO bucket initialization failed:', err.message);
});

httpServer.listen(port, () => {
    // // console.log(`✅ Server started on port ${port}`)
    // console.log(`✅ Socket.IO ready for real-time sync`)
})
