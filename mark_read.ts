import { AppDataSource } from './src/data-source';

AppDataSource.initialize().then(async () => {
  await AppDataSource.query('UPDATE notifications SET "isRead" = true WHERE "isRead" = false OR "isRead" IS NULL');
  console.log('Marked all as read!');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
