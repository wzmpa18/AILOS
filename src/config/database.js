const { PrismaClient } = require('@prisma/client');
const config = require('./index');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
  log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle connection errors
prisma.$on('error', (error) => {
  console.error('Database connection error:', error);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
