import { AppDataSource } from "./data-source";
import { User } from "./entities/User";
import * as bcrypt from "bcryptjs";

async function resetPass() {
  try {
    await AppDataSource.initialize();
    console.log("Data Source initialized");

    const email = "student2@example.com";
    const user = await AppDataSource.getRepository(User).findOne({ where: { email } });
    
    if (user) {
      const newPass = "Password123!";
      user.password = await bcrypt.hash(newPass, 10);
      await AppDataSource.getRepository(User).save(user);
      console.log(`Password for ${email} reset to: ${newPass}`);
    } else {
      console.log(`User ${email} not found.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

resetPass();
