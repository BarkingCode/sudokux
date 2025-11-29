module.exports = {
  preset: 'react-native',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@shopify/react-native-skia|moti|@supabase/.*|uuid)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic modules
    '^uuid$': '<rootDir>/__tests__/__mocks__/uuid.js',
    '^react-native-get-random-values$': '<rootDir>/__tests__/__mocks__/react-native-get-random-values.js',
    // Mock expo modules
    '^expo$': '<rootDir>/__tests__/__mocks__/expo.js',
    '^expo/(.*)$': '<rootDir>/__tests__/__mocks__/expo.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/database.types.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  clearMocks: true,
  testEnvironment: 'node',
};
