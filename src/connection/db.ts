import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };
