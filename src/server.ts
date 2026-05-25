import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import { initializeDatabase } from "./config/database";
import { RegisterRoutes } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Load environment variables
config();

const app: Application = express();
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

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 EngBee is running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
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
