import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Score } from "../entities/Score";
import { Feedback } from "../entities/Feedback";
import { ScoringJob } from "../entities/ScoringJob";
import { AttemptMedia } from "../entities/AttemptMedia";
import { Attempt } from "../entities/Attempt";
import { Assignment } from "../entities/Assignment";
import { Prompt } from "../entities/Prompt";
import { Class } from "../entities/Class";
import { AIRule } from "../entities/AIRule";
import { LearnerProfile } from "../entities/LearnerProfile";
import { User } from "../entities/User";

/**
 * Clear all entity data from the database
 *
 * Deletion order respects foreign key constraints:
 * 1. Score (depends on Attempt)
 * 2. Feedback (depends on Attempt, User)
 * 3. ScoringJob (depends on Attempt)
 * 4. AttemptMedia (depends on Attempt)
 * 5. Attempt (depends on Prompt, User)
 * 6. Assignment (depends on Prompt, Class, AIRule)
 * 7. Prompt (depends on User)
 * 8. Class (depends on User, has ManyToMany with learners)
 * 9. AIRule (depends on User)
 * 10. LearnerProfile (depends on User)
 * 11. User (root entity)
 *
 * Usage:
 *   npx ts-node src/utils/clearDatabase.ts
 *   npx ts-node src/utils/clearDatabase.ts --confirm
 */

interface ClearResult {
  entity: string;
  deleted: number;
  success: boolean;
  error?: string;
}

async function clearAllEntities(): Promise<ClearResult[]> {
  const results: ClearResult[] = [];

  // Ordered list of entities (children first, parents last)
  const entityConfigs = [
    { name: "Score", entity: Score },
    { name: "Feedback", entity: Feedback },
    { name: "ScoringJob", entity: ScoringJob },
    { name: "AttemptMedia", entity: AttemptMedia },
    { name: "Attempt", entity: Attempt },
    { name: "Assignment", entity: Assignment },
    { name: "Prompt", entity: Prompt },
    { name: "Class", entity: Class },
    { name: "AIRule", entity: AIRule },
    { name: "LearnerProfile", entity: LearnerProfile },
    { name: "User", entity: User },
  ];

  // Clear ManyToMany relationship for Class first
  try {
    const classRepository = AppDataSource.getRepository(Class);
    const classes = await classRepository.find({ relations: ["learners"] });
    for (const classEntity of classes) {
      classEntity.learners = [];
      await classRepository.save(classEntity);
    }
  } catch {
    // Ignore if no classes exist
  }

  for (const config of entityConfigs) {
    try {
      const repository = AppDataSource.getRepository(config.entity);
      const entities = await repository.find();
      const count = entities.length;

      if (count > 0) {
        await repository.remove(entities);
      }

      results.push({
        entity: config.name,
        deleted: count,
        success: true,
      });
    } catch (error) {
      results.push({
        entity: config.name,
        deleted: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes("--confirm");

  console.log("\n🗑️  EngBee Database Clear Utility");
  console.log("═══════════════════════════════════════\n");

  if (!isConfirmed) {
    console.log("⚠️  WARNING: This will DELETE ALL DATA from the following tables:");
    console.log("   - Score");
    console.log("   - Feedback");
    console.log("   - ScoringJob");
    console.log("   - AttemptMedia");
    console.log("   - Attempt");
    console.log("   - Assignment");
    console.log("   - Prompt");
    console.log("   - Class");
    console.log("   - AIRule");
    console.log("   - LearnerProfile");
    console.log("   - User");
    console.log("\n📌 To proceed, run with --confirm flag:");
    console.log("   npx ts-node src/utils/clearDatabase.ts --confirm\n");
    process.exit(0);
  }

  try {
    // Initialize database connection
    console.log("🔌 Connecting to database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    // Clear all entities
    console.log("🧹 Clearing all entity data...\n");
    const results = await clearAllEntities();

    // Print results
    console.log("Results:");
    console.log("─────────────────────────────────────");

    let totalDeleted = 0;
    let hasErrors = false;

    for (const result of results) {
      if (result.success) {
        console.log(`  ✅ ${result.entity.padEnd(15)} ${result.deleted} records deleted`);
        totalDeleted += result.deleted;
      } else {
        console.log(`  ❌ ${result.entity.padEnd(15)} FAILED: ${result.error}`);
        hasErrors = true;
      }
    }

    console.log("─────────────────────────────────────");
    console.log(`\n📊 Total: ${totalDeleted} records deleted`);

    if (hasErrors) {
      console.log("\n⚠️  Some operations failed. Check errors above.\n");
      process.exit(1);
    } else {
      console.log("\n✅ Database cleared successfully!\n");
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Database connection closed\n");
    }
  }
}

// Run if executed directly
main();
