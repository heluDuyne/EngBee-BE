import { AppDataSource } from './src/data-source';

AppDataSource.initialize().then(async () => {
  await AppDataSource.query('UPDATE tasks SET course_id = "courseId" WHERE course_id IS NULL AND "courseId" IS NOT NULL');
  console.log('Fixed DB!');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
