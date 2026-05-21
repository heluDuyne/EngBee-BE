import { AppDataSource } from "./src/data-source";
import { TaskService } from "./src/services/task.service";
import { User } from "./src/entities/User";

import { UserRole } from "./src/enums";

AppDataSource.initialize().then(async (ds) => {
  const learner = await ds.getRepository(User).findOne({ where: { role: UserRole.LEARNER } });
  if (learner) {
    const ts = new TaskService();
    const tasks = await ts.getLearnerTasks(learner.id);
    console.log('Learner tasks:', JSON.stringify(tasks, null, 2));
  } else {
    console.log('No learner found.');
  }
  process.exit(0);
}).catch(console.error);
