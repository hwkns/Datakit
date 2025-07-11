// Fix for crypto in Node.js < 19
if (!globalThis.crypto) {
  globalThis.crypto = require('crypto').webcrypto;
}