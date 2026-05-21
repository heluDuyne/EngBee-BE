import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UserRole, UILanguage, UserStatus } from "../enums";
import * as bcrypt from 'bcryptjs';
import { initializeDatabase } from "../config/database";

const seedUsers = async () => {
    try {
        await initializeDatabase();
        const userRepository = AppDataSource.getRepository(User);

        // 1. Seed Teacher
        const teacherEmail = "teacher@example.com";
        const teacherPassword = "password123";
        let teacher = await userRepository.findOneBy({ email: teacherEmail });

        if (!teacher) {
            console.log("Creating default teacher...");
            const hashedPassword = await bcrypt.hash(teacherPassword, 10);
            teacher = userRepository.create({
                email: teacherEmail,
                password: hashedPassword,
                role: UserRole.TEACHER,
                firstName: "Jane",
                lastName: "Teacher",
                uiLanguage: UILanguage.EN,
                status: UserStatus.ACTIVE
            });
            await userRepository.save(teacher);
            console.log("Teacher created.");
        } else {
            console.log("Teacher already exists.");
        }

        // 2. Seed Student
        const studentEmail = "student@example.com";
        const studentPassword = "password123";
        let student = await userRepository.findOneBy({ email: studentEmail });

        if (!student) {
            console.log("Creating default student...");
            const hashedPassword = await bcrypt.hash(studentPassword, 10);
            student = userRepository.create({
                email: studentEmail,
                password: hashedPassword,
                role: UserRole.LEARNER,
                firstName: "John",
                lastName: "Student",
                uiLanguage: UILanguage.EN,
                status: UserStatus.ACTIVE
            });
            await userRepository.save(student);
            console.log("Student created.");
        } else {
            console.log("Student already exists.");
        }

        // 3. Seed Admin
        const adminEmail = "admin@example.com";
        const adminPassword = "password123";
        let admin = await userRepository.findOneBy({ email: adminEmail });

        if (!admin) {
            console.log("Creating default admin...");
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin = userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.ADMIN,
                firstName: "Alex",
                lastName: "Admin",
                uiLanguage: UILanguage.EN,
                status: UserStatus.ACTIVE
            });
            await userRepository.save(admin);
            console.log("Admin created.");
        } else {
            console.log("Admin already exists.");
        }

        console.log("\n✅ Seeding complete!");
        console.log("-----------------------------------------");
        console.log("Credential Summary:");
        console.log(`Teacher: ${teacherEmail} / ${teacherPassword}`);
        console.log(`Student: ${studentEmail} / ${studentPassword}`);
        console.log(`Admin: ${adminEmail} / ${adminPassword}`);
        console.log("-----------------------------------------");

        process.exit(0);

    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
