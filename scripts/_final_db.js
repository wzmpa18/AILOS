
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  for (const tbl of ['friend_settings','groups','group_members','conversations','messages']) {
    try {
      const r = await p.$queryRawUnsafe('SELECT COUNT(*) as c FROM "' + tbl + '";');
      console.log(tbl + ': EXISTS (' + r[0].c + ' rows)');
    } catch(e) { console.log(tbl + ': MISSING'); }
  }
  await p.$disconnect();
})();
