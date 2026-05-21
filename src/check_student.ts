import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import { Class } from "./entities/Class";

async function checkStudent() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source initialized");

    const email = "student2@example.com";
    const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
    
    if (user) {
      console.log(`User found: ${user.email} (Role: ${user.role})`);
      
      const classes = await AppDataSource.getRepository(Class)
        .createQueryBuilder("class")
        .leftJoinAndSelect("class.learners", "learner")
        .where("learner.id = :id", { id: user.id })
        .getMany();
        
      if (classes.length > 0) {
        console.log(`User is enrolled in the following classes:`);
        classes.forEach(c => {
          console.log(`- ${c.name} (Code: ${c.code || 'None'})`);
        });
      } else {
        console.log("User is NOT enrolled in any classes.");
      }
    } else {
      console.log(`User ${email} does NOT exist in the database.`);
    }

  } catch (error) {
    console.error("Error checking data:", error);
  } finally {
    process.exit(0);
  }
}

checkStudent();
