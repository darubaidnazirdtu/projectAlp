import dotenv from 'dotenv'
import { connectDB } from './db/index.js'
import { app } from './app.js'
import { createServer } from 'http'
import { initializeSocket } from './config/socket.js'
import dns from 'dns'
dns.setServers(['8.8.8.8', '1.1.1.1']); // Force Google/Cloudflare DNS
dns.resolveSrv('_mongodb._tcp.flos20.n6rt3bh.mongodb.net', console.log);

dotenv.config({
    path: './env'
})

const port = process.env.PORT || 8000

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

connectDB()
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })

httpServer.listen(port, () => {
    console.log(`✅ Server started on port ${port}`)
    console.log(`✅ Socket.IO ready for real-time sync`)
})

