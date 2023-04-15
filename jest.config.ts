import { pathsToModuleNameMapper } from 'ts-jest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { compilerOptions } = require('./tsconfig.json');

const EXCLUDE_PATHS = new Set(['class-transformer/cjs/storage']);

module.exports = {
  clearMocks: true,
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        diagnostics: { warnOnly: process.env.NODE_ENV === 'development' },
      },
    ],
  },
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(
    Object.fromEntries(
      Object.entries(compilerOptions.paths).filter(
        (e): e is [string, string[]] => !EXCLUDE_PATHS.has(e[0]),
      ),
    ),
  ),
  setupFiles: ['./test/setup.ts'],
  setupFilesAfterEnv: ['jest-extended/all'],
};
