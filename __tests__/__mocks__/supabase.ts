/**
 * Mock implementation for Supabase client.
 * Provides configurable responses for testing services.
 */

type MockResponse<T> = {
  data: T | null;
  error: { message: string; code: string } | null;
};

type MockQueryBuilder = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
};

// Store for mock responses that can be configured per test
let mockResponses: Map<string, MockResponse<unknown>> = new Map();

/**
 * Configure a mock response for a specific table/operation
 */
export const setMockResponse = <T>(key: string, response: MockResponse<T>): void => {
  mockResponses.set(key, response as MockResponse<unknown>);
};

/**
 * Clear all mock responses
 */
export const clearMockResponses = (): void => {
  mockResponses.clear();
};

/**
 * Get a mock response, defaulting to empty success
 */
const getMockResponse = <T>(key: string): MockResponse<T> => {
  return (mockResponses.get(key) as MockResponse<T>) || { data: null, error: null };
};

/**
 * Create a chainable mock query builder
 */
const createMockQueryBuilder = (tableName: string): MockQueryBuilder => {
  const builder: MockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve(getMockResponse(`${tableName}.single`))),
    maybeSingle: jest.fn(() => Promise.resolve(getMockResponse(`${tableName}.maybeSingle`))),
  };

  // Make chainable methods return builder
  Object.keys(builder).forEach(key => {
    if (key !== 'single' && key !== 'maybeSingle') {
      (builder as Record<string, jest.Mock>)[key].mockImplementation(() => builder);
    }
  });

  return builder;
};

/**
 * Mock Supabase client
 */
export const mockSupabase = {
  from: jest.fn((tableName: string) => createMockQueryBuilder(tableName)),
  auth: {
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  rpc: jest.fn((functionName: string) => {
    return Promise.resolve(getMockResponse(`rpc.${functionName}`));
  }),
};

// Default export for easy mocking
export default mockSupabase;

// Re-export types for tests
export type { MockResponse, MockQueryBuilder };
