// Setup file for Jest tests
// This runs before all tests

beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('⚠️  WARNING: Not using test database!');
  }
});

afterAll(async () => {
  // Cleanup connections
});
