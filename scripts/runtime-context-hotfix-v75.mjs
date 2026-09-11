import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RUNTIME_CONTEXT_HOTFIX_V75';

if (!app.includes(MARKER)) {
  const anchor = 'const MERCHANDISER_UX_V74 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V74 marker missing');

  // Earlier patch generations could leave SECTION_CANVAS_RUNTIME_V58 in a
  // narrower lexical scope while AppV3 referenced it globally. Collapse every
  // use onto one explicit runtime object so order/scope of source transforms
  // can no longer produce a first-render ReferenceError.
  app = app.replace(
    /\b(?:const|let|var)\s+SECTION_CANVAS_RUNTIME_V58\s*=\s*\{\s*\}\s*;?/g,
    'globalThis.__SECTION_CANVAS_RUNTIME_V58__ = globalThis.__SECTION_CANVAS_RUNTIME_V58__ || {};'
  );
  app = app.replace(/\bSECTION_CANVAS_RUNTIME_V58\b/g, 'globalThis.__SECTION_CANVAS_RUNTIME_V58__');
  app = app.replace(
    anchor,
    anchor + '\nconst ' + MARKER + " = true;\nglobalThis.__SECTION_CANVAS_RUNTIME_V58__ = globalThis.__SECTION_CANVAS_RUNTIME_V58__ || {};"
  );

  writeFileSync(appPath, app);
}

console.log('V75 runtime context hotfix applied: section canvas runtime is shared through globalThis');
await import('./automation-editor-reference-v76.mjs');
await import('./automation-scenario-editor-v77.mjs');
await import('./mobile-layout-stability-v78.mjs');
await import('./ops-migration-lab-v79.mjs');
await import('./ux-audit-fixes-v80.mjs');
await import('./runtime-looks-v81.mjs');
await import('./group-automation-unified-v82.mjs');
await import('./sales-merch-v83.mjs');
await import('./storefront-commerce-v84.mjs');
await import('./responsive-shell-v85.mjs');
await import('./logic-audit-v86.mjs');
await import('./market-stock-v87.mjs');
