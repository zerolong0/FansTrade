// Setup file for Jest tests
// This runs before all tests

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('⚠️  WARNING: Not using test database!');
  }
});

afterAll(async () => {
  // Cleanup connections
});
