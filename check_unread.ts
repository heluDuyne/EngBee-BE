import { AppDataSource } from './src/data-source';

AppDataSource.initialize().then(async () => {
  const notifs = await AppDataSource.query('SELECT count(*) as unread_count, "userId" FROM notifications WHERE "isRead" = true GROUP BY "userId"');
  console.log('Read: ', notifs);
  const unread = await AppDataSource.query('SELECT count(*) as unread_count, "userId" FROM notifications WHERE "isRead" = false OR "isRead" IS NULL GROUP BY "userId"');
  console.log('Unread: ', unread);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
