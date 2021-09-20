// @ts-check
/* eslint-env node */

/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
const options = {
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  roots: ["tests"],
  collectCoverage: true,
  coverageReporters: ['lcov', 'text', 'text-summary'],
  reporters: [
    'default'
  ],
};

module.exports = options;
