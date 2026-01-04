// Jest setup file
// Add any global test setup here

// Mock Prisma client to avoid ES module issues with Prisma 7
jest.mock('./lib/prisma', () => ({
  prisma: {
    task: {},
    context: {},
    tag: {},
    taskTag: {},
    habitCompletion: {},
    user: {},
    account: {},
    session: {},
    verificationToken: {},
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  },
}));