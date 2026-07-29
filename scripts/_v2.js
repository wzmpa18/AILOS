
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  let ok = true;
  for (const tbl of ['friend_settings','groups','group_members','conversations','messages']) {
    try {
      const r = await p.$queryRawUnsafe('SELECT COUNT(*) as c FROM "' + tbl + '" LIMIT 1;');
      console.log('OK: ' + tbl + ' (rows=' + r[0].c + ')');
    } catch(e) {
      console.log('FAIL: ' + tbl + ' - ' + e.message.split('\n')[0]);
      ok = false;
    }
  }
  console.log('ALL_TABLES_OK: ' + ok);
  await p.$disconnect();
})();
