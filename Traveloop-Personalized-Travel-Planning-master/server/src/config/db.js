const { PrismaClient } = require('@prisma/client');

// Singleton pattern: reuse the same Prisma instance across the whole app.
// Prevents connection pool exhaustion from multiple instantiations.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

module.exports = prisma;
