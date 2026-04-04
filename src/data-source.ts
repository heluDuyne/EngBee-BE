import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entities/User";
import { LearnerProfile } from "./entities/LearnerProfile";
import { Prompt } from "./entities/Prompt";
import { Attempt } from "./entities/Attempt";
import { AttemptMedia } from "./entities/AttemptMedia";
import { ScoringJob } from "./entities/ScoringJob";
import { Score } from "./entities/Score";
import { Feedback } from "./entities/Feedback";
import { Class } from "./entities/Class";
import { Assignment } from "./entities/Assignment";
import { AIRule } from "./entities/AIRule";

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  TYPEORM_LOGGING,
} = process.env;

/**
 * Main DataSource for TypeORM
 * Used for both application runtime and migration generation/execution
 *
 * CLI Usage (via package.json scripts):
 * - npm run migration:generate src/migrations/<MigrationName>
 * - npm run migration:run
 * - npm run migration:revert
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST || "localhost",
  port: parseInt(DB_PORT || "54321"),
  username: DB_USER || "postgres",
  password: DB_PASSWORD || "postgres",
  database: DB_NAME || "engbee_db",
  synchronize: true,
  logging: TYPEORM_LOGGING === "true",
  entities: [User, LearnerProfile, Prompt, Attempt, AttemptMedia, ScoringJob, Score, Feedback, Class, Assignment, AIRule],
  // For migrations: works with both ts-node (src/**) and compiled output (dist/**)
  migrations: [
    __dirname + "/migrations/*.ts",
    __dirname + "/migrations/*.js",
  ],
  subscribers: [],
});
