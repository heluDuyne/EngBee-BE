import { AppDataSource } from "./data-source";
import { Class } from "./entities/Class";
import { TaskAssignment } from "./entities/TaskAssignment";
import { Task } from "./entities/Task";

async function clearData() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source initialized");

    // Clear TaskAssignments first since they reference Classes and Tasks
    await AppDataSource.createQueryBuilder().delete().from(TaskAssignment).execute();
    console.log("Deleted all TaskAssignments");

    // Clear Classes
    await AppDataSource.createQueryBuilder().delete().from(Class).execute();
    console.log("Deleted all Classes");

    console.log("Database successfully cleared of old classes");
  } catch (error) {
    console.error("Error clearing data:", error);
  } finally {
    process.exit(0);
  }
}

clearData();
