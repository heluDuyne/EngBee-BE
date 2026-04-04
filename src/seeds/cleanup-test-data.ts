import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Class } from "../entities/Class";
import { Assignment } from "../entities/Assignment";
import { Attempt } from "../entities/Attempt";
import { Score } from "../entities/Score";
import { LearnerProfile } from "../entities/LearnerProfile";
import { initializeDatabase } from "../config/database";
import { UserRole } from "../enums";

const cleanupTestData = async () => {
    try {
        await initializeDatabase();
        
        console.log("🧹 Starting cleanup of test data...\n");

        // Get repositories
        const scoreRepo = AppDataSource.getRepository(Score);
        const attemptRepo = AppDataSource.getRepository(Attempt);
        const assignmentRepo = AppDataSource.getRepository(Assignment);
        const classRepo = AppDataSource.getRepository(Class);
        const learnerProfileRepo = AppDataSource.getRepository(LearnerProfile);
        const userRepo = AppDataSource.getRepository(User);

        // Count records before deletion
        const scoreCount = await scoreRepo.count();
        const attemptCount = await attemptRepo.count();
        const assignmentCount = await assignmentRepo.count();
        const classCount = await classRepo.count();
        const learnerProfileCount = await learnerProfileRepo.count();
        const learners = await userRepo.find({ where: { role: UserRole.LEARNER } });
        const learnerCount = learners.length;

        // Use query runner to execute raw SQL with CASCADE
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // Delete in proper order (child tables first) or use CASCADE
            await queryRunner.query('TRUNCATE TABLE "scores" CASCADE');
            console.log(`✅ Deleted ${scoreCount} scores`);

            await queryRunner.query('TRUNCATE TABLE "attempts" CASCADE');
            console.log(`✅ Deleted ${attemptCount} attempts`);

            await queryRunner.query('TRUNCATE TABLE "assignments" CASCADE');
            console.log(`✅ Deleted ${assignmentCount} assignments`);

            await queryRunner.query('TRUNCATE TABLE "classes" CASCADE');
            console.log(`✅ Deleted ${classCount} classes`);

            await queryRunner.query('TRUNCATE TABLE "learner_profiles" CASCADE');
            console.log(`✅ Deleted ${learnerProfileCount} learner profiles`);

            // Delete learner users using repository (to maintain entity integrity)
            if (learners.length > 0) {
                await userRepo.remove(learners);
                console.log(`✅ Deleted ${learnerCount} learner users`);
            } else {
                console.log(`✅ No learner users to delete`);
            }

        } finally {
            await queryRunner.release();
        }

        console.log("\n🎉 Cleanup complete!");
        console.log("-------------------------------------------");
        console.log("Summary:");
        console.log(`- Scores: ${scoreCount}`);
        console.log(`- Attempts: ${attemptCount}`);
        console.log(`- Assignments: ${assignmentCount}`);
        console.log(`- Classes: ${classCount}`);
        console.log(`- Learner Profiles: ${learnerProfileCount}`);
        console.log(`- Learner Users: ${learnerCount}`);
        console.log("-------------------------------------------");
        console.log("✅ Teachers and their data have been preserved.");

        process.exit(0);

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
    }
};

cleanupTestData();
