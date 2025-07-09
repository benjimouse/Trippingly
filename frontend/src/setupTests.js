import '@testing-library/jest-dom';
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
  // In newer Node.js, TextEncoder and TextDecoder are globally available,
  // but JSDOM might need them explicitly set on its global scope.
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}