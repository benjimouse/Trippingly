import '@testing-library/jest-dom';
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
  // In newer Node.js, TextEncoder and TextDecoder are globally available,
  // but JSDOM might need them explicitly set on its global scope.
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Silence known non-actionable React Router future-flag warnings in tests
const origWarn = console.warn;
console.warn = (...args) => {
  try {
    const msg = args && args[0] && String(args[0]);
    if (msg && msg.includes('React Router Future Flag Warning')) return;
    if (msg && msg.includes('Relative route resolution within Splat routes is changing')) return;
  } catch (e) {}
  origWarn.apply(console, args);
};