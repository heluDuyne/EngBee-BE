import { AppDataSource } from "./data-source";
import { Task } from "./entities/Task";
import { TaskAssignment } from "./entities/TaskAssignment";
import { TaskSubmission } from "./entities/TaskSubmission";
import { initializeDatabase } from "./config/database";

const clearTasks = async () => {
    try {
        await initializeDatabase();
        
        console.log("🧹 Starting cleanup of tasks...\n");

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            await queryRunner.query('TRUNCATE TABLE "task_submissions" CASCADE');
            console.log(`✅ Deleted task_submissions`);

            await queryRunner.query('TRUNCATE TABLE "task_assignments" CASCADE');
            console.log(`✅ Deleted task_assignments`);

            await queryRunner.query('TRUNCATE TABLE "tasks" CASCADE');
            console.log(`✅ Deleted tasks`);
            
        } finally {
            await queryRunner.release();
        }

        console.log("\n🎉 Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
    }
};

clearTasks();
