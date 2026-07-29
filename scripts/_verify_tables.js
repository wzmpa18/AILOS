
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  for (const tbl of ['friend_settings','groups','group_members','conversations','messages']) {
    try {
      const r = await p.$queryRawUnsafe('SELECT COUNT(*) as c FROM "' + tbl + '" LIMIT 1;');
      console.log(tbl + ': EXISTS (rows=' + r[0].c + ')');
    } catch(e) {
      console.log(tbl + ': MISSING - ' + e.message.split('\n')[0]);
    }
  }
  await p.$disconnect();
})();
