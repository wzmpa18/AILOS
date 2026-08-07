/**
 * prisma/seeds/vocabulary.count.js
 * 输出词库中可用词条数量（单行数字），供 deploy.sh 门禁使用。
 * 失败时输出 0，不抛异常，保证部署脚本可判定。
 */
(async () => {
  let prisma;
  try {
    prisma = require('../../src/config/database');
    const n = await prisma.vocabularyWord.count({ where: { isActive: true } });
    console.log(n);
  } catch (e) {
    console.log(0);
  } finally {
    try {
      if (prisma && typeof prisma.$disconnect === 'function') await prisma.$disconnect();
    } catch (e) {
      /* ignore */
    }
    process.exit(0);
  }
})();
