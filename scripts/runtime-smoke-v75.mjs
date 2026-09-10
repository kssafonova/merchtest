import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

// Build-time smoke test for the first React render. This catches runtime-only
// ReferenceError/TypeError failures that Vite compilation itself cannot detect.
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    setTimeout,
    clearTimeout,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true; },
    scrollTo() {},
  };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    body: {},
    documentElement: {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
    removeEventListener() {},
  };
}
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  };
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const mod = await server.ssrLoadModule('/src/AppV3.jsx');
  const html = renderToString(React.createElement(mod.default));
  if (!html || html.length < 100) throw new Error('AppV3 rendered an unexpectedly empty document');
  console.log(`V75 runtime smoke passed: initial React render produced ${html.length} chars`);
} catch (error) {
  console.error('V75 RUNTIME SMOKE FAILED');
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  await server.close();
}
