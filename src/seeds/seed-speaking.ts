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

  console.log("Creating speaking practice...");

  const speakingPractice = practiceRepository.create({
    title: "IELTS Speaking Part 2: Describe a memorable journey",
    description: "Record yourself speaking about a memorable journey you have taken.",
    level: "Intermediate",
    skillType: "SPEAKING",
    tags: ["ielts", "travel", "speaking"],
    duration: 2, // 2 minutes
    status: PracticeStatus.PUBLISHED,
    creatorId: admin.id,
    content: "Describe a memorable journey you have made.\nYou should say:\n- where you went\n- how you traveled\n- why you went on the journey\nAnd explain why you remember this journey so well.",
    questions: []
  });

  await practiceRepository.save(speakingPractice);
  
  console.log("Successfully created speaking practice!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
