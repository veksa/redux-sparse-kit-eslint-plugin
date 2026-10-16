module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Test helpers live alongside the suites, so only *.test.ts files are suites.
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        // ts-jest forces `module: commonjs`, which cannot be combined with the
        // `moduleResolution: bundler` of tsconfig.json. node16 keeps the subpath
        // exports of @typescript-eslint/utils resolvable.
        tsconfig: {
          module: 'node16',
          moduleResolution: 'node16',
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/__tests__/**'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
