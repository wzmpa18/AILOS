
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const u = await p.user.findFirst({ select: { id: true, privacySettings: true } });
    console.log('User found, privacySettings: ' + JSON.stringify(u.privacySettings));
  } catch(e) {
    console.log('ERROR: ' + e.message);
  }
  await p.$disconnect();
})();
