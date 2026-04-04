import { AppDataSource } from "../data-source";

/**
 * Initialize database connection for application runtime
 * Migrations are run separately using TypeORM CLI
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Check if datasource is already initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database connection established successfully");
    }
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    throw error;
  }
};

export { AppDataSource };
