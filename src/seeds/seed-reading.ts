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

  console.log("Creating reading practice...");

  const readingPractice = practiceRepository.create({
    title: "Understanding Climate Change Impacts",
    description: "Read the passage about climate change and answer the questions.",
    level: "Intermediate",
    skillType: "READING",
    tags: ["environment", "science", "ielts"],
    duration: 30,
    status: PracticeStatus.PUBLISHED,
    creatorId: admin.id,
    content: "Climate change is one of the most pressing issues of our time. It refers to long-term shifts in temperatures and weather patterns. These shifts may be natural, but since the 1800s, human activities have been the main driver of climate change, primarily due to the burning of fossil fuels like coal, oil, and gas, which produces heat-trapping gases. As a result, the Earth is now about 1.1°C warmer than it was in the late 1800s. The last decade (2011-2020) was the warmest on record.\n\nThe consequences of climate change include, among others, intense droughts, water scarcity, severe fires, rising sea levels, flooding, melting polar ice, catastrophic storms, and declining biodiversity. People are experiencing climate change in diverse ways. It affects our health, ability to grow food, housing, safety, and work. Some of us are already more vulnerable to climate impacts, such as people living in small island nations and other developing countries.",
    questions: [
      {
        id: "q1",
        type: "multiple_choice",
        text: "What is the primary driver of climate change since the 1800s?",
        options: [
          { id: "opt1", text: "Natural shifts in temperatures" },
          { id: "opt2", text: "Human activities like burning fossil fuels" },
          { id: "opt3", text: "Catastrophic storms" },
          { id: "opt4", text: "Declining biodiversity" }
        ],
        correctAnswer: "opt2",
        points: 10
      },
      {
        id: "q2",
        type: "multiple_choice",
        text: "How much warmer is the Earth now compared to the late 1800s?",
        options: [
          { id: "opt1", text: "0.5°C" },
          { id: "opt2", text: "1.1°C" },
          { id: "opt3", text: "2.0°C" },
          { id: "opt4", text: "3.5°C" }
        ],
        correctAnswer: "opt2",
        points: 10
      },
      {
        id: "q3",
        type: "multiple_choice",
        text: "Which of the following is NOT listed as a consequence of climate change in the passage?",
        options: [
          { id: "opt1", text: "Intense droughts" },
          { id: "opt2", text: "Rising sea levels" },
          { id: "opt3", text: "Earthquakes" },
          { id: "opt4", text: "Melting polar ice" }
        ],
        correctAnswer: "opt3",
        points: 10
      }
    ]
  });

  await practiceRepository.save(readingPractice);
  
  console.log("Successfully created reading practice!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
