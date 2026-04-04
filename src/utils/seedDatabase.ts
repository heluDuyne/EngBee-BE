import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { AuthService } from "../services/auth.service";
import { ClassService } from "../services/class.service";
import { AIRuleService } from "../services/ai-rule.service";
import { PromptService } from "../services/prompt.service";
import { AssignmentService } from "../services/assignment.service";
import { RegisterDTO } from "../dtos/auth.dto";
import { CreateClassDTO } from "../dtos/class.dto";
import { CreateAIRuleDTO } from "../dtos/ai-rule.dto";
import { CreatePromptDTO } from "../dtos/prompt.dto";
import { CreateAssignmentDTO } from "../dtos/assignment.dto";
import {
  UserRole,
  SkillType,
  DifficultyLevel,
  AssignmentStatus,
} from "../enums";

/**
 * Seed database with initial data
 *
 * Creates:
 * - 2 Teachers
 * - 5 Learners
 * - 2 Classes (one per teacher)
 * - 2 AI Rules (one per teacher)
 * - 4 Prompts (2 speaking, 2 writing)
 * - 4 Assignments
 *
 * Usage:
 *   npx ts-node src/utils/seedDatabase.ts
 *   npx ts-node src/utils/seedDatabase.ts --confirm
 */

// Seed data definitions
const SEED_PASSWORD = "password123";

const teacherData: Omit<RegisterDTO, "confirmPassword">[] = [
  {
    email: "teacher1@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.TEACHER,
  },
  {
    email: "teacher2@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.TEACHER,
  },
];

const learnerData: Omit<RegisterDTO, "confirmPassword">[] = [
  {
    email: "learner1@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.LEARNER,
  },
  {
    email: "learner2@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.LEARNER,
  },
  {
    email: "learner3@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.LEARNER,
  },
  {
    email: "learner4@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.LEARNER,
  },
  {
    email: "learner5@engbee.com",
    password: SEED_PASSWORD,
    role: UserRole.LEARNER,
  },
];

const classData: Omit<CreateClassDTO, "teacherId">[] = [
  {
    name: "IELTS Speaking Fundamentals",
    description:
      "Master the basics of IELTS Speaking with structured practice sessions",
    code: "SPEAK101",
  },
  {
    name: "IELTS Writing Workshop",
    description: "Improve your IELTS Writing skills with intensive exercises",
    code: "WRITE201",
  },
];

const aiRuleData: Omit<CreateAIRuleDTO, "teacherId">[] = [
  {
    name: "Standard IELTS Speaking",
    description: "Balanced scoring for general IELTS speaking practice",
    modelId: "gpt-4",
    rubricId: "ielts_speaking",
    weights: {
      fluency: 0.25,
      coherence: 0.25,
      lexical: 0.25,
      grammar: 0.25,
      pronunciation: 0,
    },
    strictness: 1.0,
  },
  {
    name: "IELTS Writing Academic",
    description: "Academic writing focused scoring with emphasis on coherence",
    modelId: "gpt-4",
    rubricId: "ielts_writing",
    weights: {
      fluency: 0.2,
      coherence: 0.3,
      lexical: 0.25,
      grammar: 0.25,
    },
    strictness: 1.2,
  },
];

const promptData: Omit<CreatePromptDTO, "createdBy">[] = [
  {
    skillType: SkillType.SPEAKING,
    content:
      "Focus on fluency and coherence. Pay attention to the use of discourse markers and linking words. Check if the student maintains a consistent flow without long pauses. Evaluate pronunciation clarity and natural intonation patterns.",
    difficulty: DifficultyLevel.MEDIUM,
    prepTime: 60,
    responseTime: 120,
    description: "AI Scoring Prompt - Speaking Fluency Focus",
  },
  {
    skillType: SkillType.SPEAKING,
    content:
      "Emphasize lexical resource assessment. Look for vocabulary range and appropriateness. Check for idiomatic expressions and collocations. Note any repetition or limited vocabulary usage. Assess the student's ability to paraphrase.",
    difficulty: DifficultyLevel.EASY,
    prepTime: 60,
    responseTime: 120,
    description: "AI Scoring Prompt - Speaking Vocabulary Focus",
  },
  {
    skillType: SkillType.WRITING,
    content:
      "Analyze task achievement and response structure. Check if all parts of the task are addressed. Evaluate the clarity of overview and key features identification. Look for accurate data representation and meaningful comparisons.",
    difficulty: DifficultyLevel.MEDIUM,
    prepTime: 0,
    responseTime: 1200,
    description: "AI Scoring Prompt - Writing Task 1 Analysis",
  },
  {
    skillType: SkillType.WRITING,
    content:
      "Focus on grammatical range and accuracy. Check for variety in sentence structures (simple, compound, complex). Identify errors in tense usage, subject-verb agreement, and article usage. Assess punctuation and spelling accuracy.",
    difficulty: DifficultyLevel.HARD,
    prepTime: 0,
    responseTime: 2400,
    description: "AI Scoring Prompt - Writing Grammar Focus",
  },
];

interface SeedResult {
  teachers: { id: string; email: string }[];
  learners: { id: string; email: string }[];
  classes: { id: string; name: string; code: string }[];
  aiRules: { id: string; name: string }[];
  prompts: { id: string; content: string; skillType: SkillType }[];
  assignments: { id: string; title: string }[];
}

async function seedDatabase(): Promise<SeedResult> {
  const authService = new AuthService();
  const classService = new ClassService();
  const aiRuleService = new AIRuleService();
  const promptService = new PromptService();
  const assignmentService = new AssignmentService();

  const result: SeedResult = {
    teachers: [],
    learners: [],
    classes: [],
    aiRules: [],
    prompts: [],
    assignments: [],
  };

  // 1. Create Teachers
  console.log("\n📚 Creating teachers...");
  for (const teacher of teacherData) {
    try {
      const registerDTO: RegisterDTO = {
        ...teacher,
        confirmPassword: teacher.password,
      };
      const response = await authService.register(registerDTO);
      result.teachers.push({
        id: response.user.id,
        email: response.user.email,
      });
      console.log(`   ✅ Teacher: ${response.user.email}`);
    } catch (error) {
      console.log(
        `   ⚠️  Teacher ${teacher.email}: ${error instanceof Error ? error.message : "Failed"}`,
      );
    }
  }

  // 2. Create Learners
  console.log("\n👨‍🎓 Creating learners...");
  for (const learner of learnerData) {
    try {
      const registerDTO: RegisterDTO = {
        ...learner,
        confirmPassword: learner.password,
      };
      const response = await authService.register(registerDTO);
      result.learners.push({
        id: response.user.id,
        email: response.user.email,
      });
      console.log(`   ✅ Learner: ${response.user.email}`);
    } catch (error) {
      console.log(
        `   ⚠️  Learner ${learner.email}: ${error instanceof Error ? error.message : "Failed"}`,
      );
    }
  }

  // 3. Create Classes (one per teacher)
  console.log("\n🏫 Creating classes...");
  for (let i = 0; i < classData.length && i < result.teachers.length; i++) {
    try {
      const createDTO: CreateClassDTO = {
        ...classData[i],
        teacherId: result.teachers[i].id,
      };
      const response = await classService.createClass(createDTO);
      result.classes.push({
        id: response.id,
        name: response.name,
        code: response.code || "",
      });
      console.log(`   ✅ Class: ${response.name} (${response.code})`);
    } catch (error) {
      console.log(
        `   ⚠️  Class ${classData[i].name}: ${error instanceof Error ? error.message : "Failed"}`,
      );
    }
  }

  // 4. Enroll Learners in Classes
  console.log("\n📝 Enrolling learners...");
  if (result.classes.length > 0 && result.learners.length > 0) {
    // Distribute learners across classes
    for (let i = 0; i < result.learners.length; i++) {
      const classIndex = i % result.classes.length;
      const classId = result.classes[classIndex].id;
      const learnerId = result.learners[i].id;

      try {
        await classService.enrollLearner(classId, { learnerId });
        console.log(
          `   ✅ ${result.learners[i].email} → ${result.classes[classIndex].name}`,
        );
      } catch (error) {
        console.log(
          `   ⚠️  Enrollment failed: ${error instanceof Error ? error.message : "Failed"}`,
        );
      }
    }
  }

  // 5. Create AI Rules (one per teacher)
  console.log("\n🤖 Creating AI rules...");
  for (let i = 0; i < aiRuleData.length && i < result.teachers.length; i++) {
    try {
      const response = await aiRuleService.createAIRule(
        result.teachers[i].id,
        aiRuleData[i],
      );
      result.aiRules.push({ id: response.id, name: response.name });
      console.log(`   ✅ AI Rule: ${response.name}`);
    } catch (error) {
      console.log(
        `   ⚠️  AI Rule ${aiRuleData[i].name}: ${error instanceof Error ? error.message : "Failed"}`,
      );
    }
  }

  // 6. Create Prompts (created by first teacher)
  console.log("\n📋 Creating prompts...");
  if (result.teachers.length > 0) {
    for (const prompt of promptData) {
      try {
        const response = await promptService.createPrompt(
          prompt,
          result.teachers[0].id,
        );
        result.prompts.push({
          id: response.id,
          content: response.content.substring(0, 50) + "...",
          skillType: response.skillType,
        });
        console.log(
          `   ✅ Prompt (${response.skillType}): ${response.content.substring(0, 40)}...`,
        );
      } catch (error) {
        console.log(
          `   ⚠️  Prompt: ${error instanceof Error ? error.message : "Failed"}`,
        );
      }
    }
  }

  // 7. Create Assignments
  console.log("\n📅 Creating assignments...");
  if (result.classes.length > 0 && result.prompts.length > 0) {
    const assignmentConfigs = [
      {
        classIndex: 0,
        promptIndex: 0,
        title: "Speaking Practice: Memorable Journey",
        description:
          "Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why this journey was memorable. Follow-up: Do you prefer traveling alone or with others?",
        aiRuleIndex: 0,
      },
      {
        classIndex: 0,
        promptIndex: 1,
        title: "Speaking Practice: Learning Skills",
        description:
          "Talk about a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how this skill would benefit you. Follow-up: What skills are most important in today's world?",
        aiRuleIndex: 0,
      },
      {
        classIndex: 1,
        promptIndex: 2,
        title: "Writing Task 1: Line Graph Analysis",
        description:
          "The graph below shows the percentage of households with internet access in three different countries between 2000 and 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
        aiRuleIndex: 1,
      },
      {
        classIndex: 1,
        promptIndex: 3,
        title: "Writing Task 2: Discussion Essay",
        description:
          "Some people believe that universities should focus on providing academic skills, while others think they should prepare students for employment. Discuss both views and give your own opinion. Write at least 250 words.",
        aiRuleIndex: 1,
      },
    ];

    for (const config of assignmentConfigs) {
      if (
        config.classIndex < result.classes.length &&
        config.promptIndex < result.prompts.length
      ) {
        try {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7); // 7 days from now

          const createDTO: CreateAssignmentDTO = {
            classId: result.classes[config.classIndex].id,
            promptId: result.prompts[config.promptIndex].id,
            title: config.title,
            description: config.description,
            deadline,
            status: AssignmentStatus.ACTIVE,
            allowLateSubmission: true,
            aiRuleId:
              config.aiRuleIndex < result.aiRules.length
                ? result.aiRules[config.aiRuleIndex].id
                : undefined,
            enableAIScoring: true, // Enable AI scoring for seeded assignments
          };

          const response = await assignmentService.createAssignment(createDTO);
          result.assignments.push({ id: response.id, title: response.title });
          console.log(`   ✅ Assignment: ${response.title}`);
        } catch (error) {
          console.log(
            `   ⚠️  Assignment ${config.title}: ${error instanceof Error ? error.message : "Failed"}`,
          );
        }
      }
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes("--confirm");

  console.log("\n🌱 EngBee Database Seed Utility");
  console.log("═══════════════════════════════════════\n");

  if (!isConfirmed) {
    console.log("This will create the following seed data:");
    console.log(
      "   • 2 Teachers (teacher1@engbee.com, teacher2@engbee.com)",
    );
    console.log("   • 5 Learners (learner1-5@engbee.com)");
    console.log("   • 2 Classes (IELTS Speaking, IELTS Writing)");
    console.log("   • 2 AI Rules (Speaking & Writing scoring)");
    console.log("   • 4 Prompts (2 speaking, 2 writing)");
    console.log("   • 4 Assignments");
    console.log(`\n   Default password: ${SEED_PASSWORD}`);
    console.log("\n📌 To proceed, run with --confirm flag:");
    console.log("   npx ts-node src/utils/seedDatabase.ts --confirm\n");
    process.exit(0);
  }

  try {
    // Initialize database connection
    console.log("🔌 Connecting to database...");
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    // Seed data
    const result = await seedDatabase();

    // Summary
    console.log("\n═══════════════════════════════════════");
    console.log("📊 Seed Summary:");
    console.log(`   Teachers:    ${result.teachers.length}`);
    console.log(`   Learners:    ${result.learners.length}`);
    console.log(`   Classes:     ${result.classes.length}`);
    console.log(`   AI Rules:    ${result.aiRules.length}`);
    console.log(`   Prompts:     ${result.prompts.length}`);
    console.log(`   Assignments: ${result.assignments.length}`);
    console.log("\n✅ Database seeded successfully!\n");
    console.log(`💡 Login with: teacher1@engbee.com / ${SEED_PASSWORD}\n`);
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Database connection closed\n");
    }
  }
}

main();
