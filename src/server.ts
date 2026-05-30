import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { ChatService } from "./services/chat.service";
import { jwtAuthService } from "./services/jwt-auth.service";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import { RegisterRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Load environment variables
config();

const app: Application = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "EngBee Backend API",
  });
});

// Swagger documentation
try {
  const swaggerDocument = require("./swagger.json");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "EngBee API Documentation",
    customCss: ".swagger-ui .topbar { display: none }",
  }));
  console.log("📚 Swagger documentation available at /docs");
} catch (error) {
  console.warn("⚠️  Swagger documentation not available. Run 'npm run swagger' to generate.");
}

// Register tsoa routes
RegisterRoutes(app);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to EngBee API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/docs",
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
// Force Restart Triggered at 2026-01-22

// Initialize database and start server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Socket.IO Logic
    const chatService = new ChatService();
    const connectedUsers = new Map<string, Set<string>>();

    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: No token"));
      try {
        const decoded = jwtAuthService.verifyAccessToken(token);
        socket.data.user = decoded;
        next();
      } catch (err) {
        next(new Error("Authentication error: Invalid token"));
      }
    });

    io.on("connection", (socket) => {
      const userId = socket.data.user.id;
      console.log(`🔌 User connected: ${userId} (Socket: ${socket.id})`);

      if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
      connectedUsers.get(userId)!.add(socket.id);
      
      // Broadcast online status globally for simplicity in this demo
      io.emit("user_status", { userId, status: "online" });

      // Fetch inbox
      socket.on("get_inbox", async () => {
        try {
          const inbox = await chatService.getUserConversations(userId);
          socket.emit("inbox_data", inbox);
        } catch (error) {
          console.error("Error fetching inbox:", error);
        }
      });

      // Join a conversation to receive real-time messages
      socket.on("join_conversation", async (conversationId) => {
        try {
          socket.join(conversationId);
          const messages = await chatService.getConversationMessages(userId, conversationId, 50);
          socket.emit("conversation_messages", { conversationId, messages });
        } catch (error) {
          console.error("Error joining conversation:", error);
        }
      });

      // Leave conversation
      socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
      });

      socket.on("send_message", async (data) => {
        try {
          const { conversationId, content } = data;
          if (conversationId && content) {
            const savedMessage = await chatService.saveMessage(userId, conversationId, content);
            io.to(conversationId).emit("receive_message", savedMessage);
            
            // Notify other participants for inbox update
            const convData = await chatService.getUserConversations(userId);
            // In a real app we'd emit only to specific users, but for simplicity here we let clients refetch inbox
            io.emit("inbox_updated", conversationId);
          }
        } catch (error) {
          console.error("Error saving message:", error);
          socket.emit("message_error", { error: "Failed to send message" });
        }
      });

      socket.on("disconnect", () => {
        console.log(`🔌 User disconnected: ${userId} (Socket: ${socket.id})`);
        const userSockets = connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            connectedUsers.delete(userId);
            io.emit("user_status", { userId, status: "offline" });
          }
        }
      });
    });

    // Start server
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 EngBee is running on port ${PORT}`);
      console.log(`📍 API Base URL: http://0.0.0.0:${PORT}/api`);
      console.log(`📚 API Documentation: http://0.0.0.0:${PORT}/docs`);
      console.log(`❤️  Health Check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  // process.exit(1); // Do not crash the server on unhandled rejections
});

// Start the application
startServer();

export default app;
