/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  // Force NODE_ENV=development before any source loads so the production
  // boot-guards (secret checks in TokenService / MockPaymentGateway) don't fire
  // under CI (which sets NODE_ENV=test).
  setupFiles: ['<rootDir>/../test/jest.setup.js'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
