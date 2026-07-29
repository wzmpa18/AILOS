
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    // Delete the fake migration record
    const result = await p.$queryRawUnsafe(
      "DELETE FROM _prisma_migrations WHERE migration_name=$1",
      '20260729120000_community_stage9_baseline'
    );
    console.log('Deleted fake migration record');

    // Verify
    const migs = await p.$queryRawUnsafe(
      "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 3;"
    );
    console.log('Remaining migrations: ' + JSON.stringify(migs.map(m => m.migration_name)));
  } catch(e) { console.error('ERROR: ' + e.message); }
  await p.$disconnect();
})();
