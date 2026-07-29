const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    // List all tables
    const tables = await p.$queryRawUnsafe("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename;");
    console.log("TABLES: " + JSON.stringify(tables.map(t => t.tablename)));
    // Latest migrations
    const migs = await p.$queryRawUnsafe("SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;");
    console.log("MIGRATIONS: " + JSON.stringify(migs));
    // Check specific community tables
    const targets = ['friend_settings','groups','group_members','conversations','messages',
                      'FriendSetting','Group','GroupMember','Conversation','Message'];
    for (const t of targets) {
      try {
        await p.$queryRawUnsafe('SELECT 1 FROM "' + t + '" LIMIT 0;');
        console.log('TABLE_CHECK: ' + t + ' = EXISTS');
      } catch(e) {
        console.log('TABLE_CHECK: ' + t + ' = MISSING');
      }
    }
  } catch(e) { console.error('FATAL: ' + e.message); }
  await p.$disconnect();
})();
