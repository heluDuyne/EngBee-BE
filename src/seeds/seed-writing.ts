import { AppDataSource } from "../data-source";
import { Practice, PracticeStatus } from "../entities/Practice";
import { User } from "../entities/User";
import { UserRole, UserStatus } from "../enums";
import * as bcrypt from "bcryptjs";

async function seed() {
  console.log("Initializing database connection...");
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const practiceRepository = AppDataSource.getRepository(Practice);

  console.log("Finding or creating an admin user...");
  let admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("password123", salt);

    admin = userRepository.create({
      email: "admin_seed@example.com",
      password: password,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(admin);
    console.log("Created dummy admin user.");
  }

  console.log("Creating writing practice...");

  const writingPractice = practiceRepository.create({
    title: "IELTS Writing Task 2: Technology & Society",
    description: "Write an essay discussing the impact of technology on social interactions.",
    level: "Upper-Intermediate",
    skillType: "WRITING",
    tags: ["ielts", "technology", "society"],
    duration: 40,
    status: PracticeStatus.PUBLISHED,
    creatorId: admin.id,
    content: "Some people believe that technology has made it easier for people to connect with others, while others think it has made us more isolated. Discuss both views and give your own opinion.\n\nWrite at least 250 words. You should spend about 40 minutes on this task.",
    questions: []
  });

  await practiceRepository.save(writingPractice);
  
  console.log("Successfully created writing practice!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
