import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";

import {connectDB} from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import messageRequestRoutes from "./routes/messageRequest.route.js";
import cors from "cors";
import {initializeSocket} from "./lib/socket.js";  

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/requests", messageRequestRoutes);

// Production static files - MUST come after API routes
if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));
    
    // Wildcard route for SPA - must be LAST
    app.get("*", (req,res) => {
        res.sendFile(path.resolve(__dirname,"../frontend/dist/index.html"));
    });
}

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const { io } = initializeSocket(server);

server.listen(PORT, () =>{
    console.log("server is running on PORT:"+ PORT);
    connectDB();
});