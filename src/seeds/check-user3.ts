
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import * as bcrypt from 'bcryptjs';
import { initializeDatabase } from "../config/database";

const checkUser = async () => {
    try {
        await initializeDatabase();
        const userRepository = AppDataSource.getRepository(User);

        const user = await userRepository.findOneBy({ email: "user3@test.com" });

        if (user) {
            console.log(`User found: ${user.email}`);
            console.log(`Role: ${user.role}`);
            
            // Convert 'password123' to hash to compare or reset
            const defaultPass = "password123";
            const isMatch = await bcrypt.compare(defaultPass, user.password);
            
            if (isMatch) {
                console.log(`Password is: ${defaultPass}`);
            } else {
                console.log("Password is NOT 'password123'. Resetting it now...");
                user.password = await bcrypt.hash(defaultPass, 10);
                await userRepository.save(user);
                console.log(`Password has been reset to: ${defaultPass}`);
            }
        } else {
            console.log("User 'user3@test.com' NOT found.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkUser();
