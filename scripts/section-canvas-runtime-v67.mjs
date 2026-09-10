import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SECTION_CANVAS_RUNTIME_V67';

if (!app.includes(MARKER)) {
  const anchor = 'const AUTOMATION_RUNTIME_INIT_V66 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V66 marker missing');

  const hasDeclaration = /\b(?:const|let|var)\s+SECTION_CANVAS_RUNTIME_V58\s*=/.test(app);
  let injection = '\nconst ' + MARKER + ' = true;';
  if (!hasDeclaration) injection += '\nconst SECTION_CANVAS_RUNTIME_V58 = {};';
  app = app.replace(anchor, anchor + injection);

  writeFileSync(appPath, app);
}

console.log('V67 applied: SectionCanvas V58 runtime context guaranteed in final app');
await import('./repeat-combo-visible-v68.mjs');
await import('./section-authoring-unified-v69.mjs');
await import('./mobile-canvas-stability-v70.mjs');
