/**
 * Mock for uuid module
 */

let counter = 0;

module.exports = {
  v4: jest.fn(() => {
    counter++;
    return `12345678-1234-4567-8901-${String(counter).padStart(12, '0')}`;
  }),
  v1: jest.fn(() => '11111111-1111-1111-1111-111111111111'),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
};
