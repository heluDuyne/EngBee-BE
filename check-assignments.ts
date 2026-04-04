
import { AppDataSource } from "./src/data-source";
import { Assignment } from "./src/entities/Assignment";
import { Prompt } from "./src/entities/Prompt";

async function checkAssignments() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        const assignmentRepository = AppDataSource.getRepository(Assignment);
        
        const assignments = await assignmentRepository.find({
            relations: ["prompt"]
        });

        console.log(`Found ${assignments.length} assignments.`);

        for (const assignment of assignments) {
            console.log(`Assignment: ${assignment.title} (${assignment.id})`);
            console.log(`- Prompt ID: ${assignment.promptId}`);
            if (assignment.prompt) {
                console.log(`- Prompt Content: ${assignment.prompt.content?.substring(0, 50)}...`);
            } else {
                console.log(`- Prompt Relation is MISSING or NULL!`);
                
                if (assignment.promptId) {
                     // Check if prompt exists but relation failed (orphaned)
                     const promptRepo = AppDataSource.getRepository(Prompt);
                     const prompt = await promptRepo.findOne({ where: { id: assignment.promptId } });
                     if (prompt) {
                         console.log(`  -> Prompt actually exists in DB! Why did relation fail?`);
                     } else {
                         console.log(`  -> Prompt does NOT exist in DB. Broken Foreign Key?`);
                     }
                }
            }
            console.log("---");
        }

    } catch (err) {
        console.error("Error during check:", err);
    } finally {
        await AppDataSource.destroy();
    }
}

checkAssignments();
