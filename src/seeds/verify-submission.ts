import { AppDataSource } from "../data-source";
import { AttemptService } from "../services/attempt.service";
import { AssignmentService } from "../services/assignment.service";
import { SkillType, AssignmentStatus, AttemptStatus } from "../enums";
import { User } from "../entities/User";
import { Prompt } from "../entities/Prompt";
import { Class } from "../entities/Class";

async function verify() {
    try {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const attemptService = new AttemptService();
        const assignmentService = new AssignmentService();
        const userRepo = AppDataSource.getRepository(User);
        const promptRepo = AppDataSource.getRepository(Prompt);
        const classRepo = AppDataSource.getRepository(Class);

        console.log("1. Setup Test Data");
        let user: any = await userRepo.findOne({ where: { role: "learner" as any } });
        if (!user) {
             console.log("Creating temp user");
             user = await userRepo.save(userRepo.create({ email: "test-learner@test.com", password: "password", name: "Test User", role: "learner" } as any));
        }

        let prompt: any = await promptRepo.findOne({ where: { skillType: SkillType.WRITING } });
        if (!prompt) {
            console.log("Creating temp prompt");
            prompt = await promptRepo.save(promptRepo.create({ content: "Write about AI", skillType: SkillType.WRITING, difficulty: "medium" } as any));
        }

        let cls: any = (await classRepo.find({ take: 1 }))[0];
        if (!cls) {
             const teacher = await userRepo.findOne({ where: { role: "teacher" as any } });
             cls = await classRepo.save(classRepo.create({ name: "Test Class", teacher: teacher || user } as any));
        }

        const assignment = await assignmentService.createAssignment({
            classId: cls!.id,
            promptId: prompt!.id,
            title: "Test Assignment " + Date.now(),
            deadline: new Date(Date.now() + 86400000),
            status: AssignmentStatus.ACTIVE
        });
        console.log("Assignment Created:", assignment.id);

        console.log("2. Create Attempt");
        const attempt = await attemptService.createAttempt({
            learnerId: user!.id,
            promptId: prompt!.id,
            assignmentId: assignment.id,
            skillType: SkillType.WRITING
        } as any);
        console.log("Attempt Created:", attempt.id, "AssignmentID:", (attempt as any).assignment?.id || "N/A"); // Check relations safely

        console.log("3. Submit Attempt");
        const submissionContent = "This is a test submission content for verification.";
        const submitted = await attemptService.submitAttempt(attempt.id, {
            content: submissionContent
        });
        console.log("Submit Response Content:", submitted.content);

        console.log("4. Verify Persistence");
        const fetched = await attemptService.getAttemptById(attempt.id);
        console.log("Fetched Content:", fetched.content);
        console.log("Fetched Status:", fetched.status);

        if (fetched.content !== submissionContent) {
            console.error("FAILURE: Content mismatch!");
        } else {
            console.log("SUCCESS: Content persisted correctly.");
        }
        
        console.log("5. Verify Dashboard API (getLearnerAssignments)");
        const dashboard = await assignmentService.getLearnerAssignments(user.id);
        const dashAssignment = dashboard.data.find(a => a.id === assignment.id);
        
        console.log("Dashboard Status:", dashAssignment?.submissionStatus);
        console.log("Dashboard Score:", dashAssignment?.score);
        console.log("Dashboard AttemptId:", dashAssignment?.attemptId);

        if (dashAssignment?.submissionStatus !== 'SUBMITTED' && dashAssignment?.submissionStatus !== 'submitted') {
             console.error("FAILURE: Dashboard API does not show SUBMITTED status!");
        } else {
             console.log("SUCCESS: Dashboard API shows SUBMITTED status.");
        }

        process.exit(0);

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

verify();
