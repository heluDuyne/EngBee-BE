import { AppDataSource } from "../data-source";
import { Attempt } from "../entities/Attempt";
import { Assignment } from "../entities/Assignment";
import { Score } from "../entities/Score";
import { Feedback } from "../entities/Feedback";
import { AttemptMedia } from "../entities/AttemptMedia";
import { ScoringJob } from "../entities/ScoringJob";

async function cleanTasks() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Cleaning up data...");

    const scoreRepo = AppDataSource.getRepository(Score);
    const feedbackRepo = AppDataSource.getRepository(Feedback);
    const mediaRepo = AppDataSource.getRepository(AttemptMedia);
    const jobRepo = AppDataSource.getRepository(ScoringJob);
    const attemptRepo = AppDataSource.getRepository(Attempt);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Delete dependent entities first
    console.log("Deleting ScoringJobs...");
    try { await jobRepo.clear(); } catch(e) { await jobRepo.createQueryBuilder().delete().execute(); }
    console.log("Deleting Scores...");
    try { await scoreRepo.clear(); } catch(e) { await scoreRepo.createQueryBuilder().delete().execute(); }

    console.log("Deleting Feedbacks...");
    try { await feedbackRepo.clear(); } catch(e) { await feedbackRepo.createQueryBuilder().delete().execute(); }

    console.log("Deleting AttemptMedia...");
    try { await mediaRepo.clear(); } catch(e) { await mediaRepo.createQueryBuilder().delete().execute(); }

    // Delete Attempts
    console.log("Deleting Attempts...");
    try { await attemptRepo.clear(); } catch(e) { await attemptRepo.createQueryBuilder().delete().execute(); }

    // Delete Assignments
    console.log("Deleting Assignments...");
    try { await assignmentRepo.clear(); } catch(e) { await assignmentRepo.createQueryBuilder().delete().execute(); }

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning up data:", error);
    process.exit(1);
  }
}

cleanTasks();
