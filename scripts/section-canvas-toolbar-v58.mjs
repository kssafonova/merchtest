import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourcePath = 'scripts/section-canvas-toolbar-v57.mjs';
const runtimePath = 'scripts/.section-canvas-toolbar-v58-runtime.mjs';
let source = readFileSync(sourcePath, 'utf8').replaceAll('SECTION_CANVAS_TOOLBAR_V57', 'SECTION_CANVAS_TOOLBAR_V58');

source = source.replace(
  'onStyleChange={onStyleChange} onTitleChange={onTitleChange}',
  "onStyleChange={(patch) => SECTION_CANVAS_RUNTIME_V58.updateStyle?.(section.id, patch)} onTitleChange={(value) => SECTION_CANVAS_RUNTIME_V58.updateTitle?.(section.id, locale, value)}"
);

const wireStart = source.indexOf('  // Wire style/title persistence from the page state into every rendered section.');
const wireEnd = source.indexOf('\n\n  writeFileSync(appPath, app);', wireStart);
if (wireStart < 0 || wireEnd < 0) throw new Error('SECTION_CANVAS_TOOLBAR_V58: persistence block missing');

const runtimeWire = [
  '  // Runtime-safe persistence: no dependency on the final JSX wrapper around SectionCanvas.',
  "  const markerDecl = 'const SECTION_CANVAS_TOOLBAR_V58 = true;';",
  "  if (!app.includes(markerDecl)) throw new Error(MARKER + ': marker declaration missing');",
  "  app = app.replace(markerDecl, markerDecl + '\\nconst SECTION_CANVAS_RUNTIME_V58 = {};');",
  '',
  '  const updateAnchor = "  const updateSection = (id, updater) => mutateSections((prev) => prev.map((s) => s.id === id ? updater(s) : s));";',
  "  if (!app.includes(updateAnchor)) throw new Error(MARKER + ': updateSection runtime anchor missing');",
  "  const runtimeMethods = '\\n  SECTION_CANVAS_RUNTIME_V58.updateStyle = (sectionId, patch) => updateSection(sectionId, (source) => ({ ...source, styleV57: { ...(source.styleV57 || {}), ...patch } }));\\n  SECTION_CANVAS_RUNTIME_V58.updateTitle = (sectionId, localeKey, value) => { if (!value) return; updateSection(sectionId, (source) => ({ ...source, titles: { ...source.titles, [localeKey]: value } })); };';",
  '  app = app.replace(updateAnchor, updateAnchor + runtimeMethods);',
  ''
].join('\n');

source = source.slice(0, wireStart) + runtimeWire + source.slice(wireEnd);
writeFileSync(runtimePath, source);
try {
  execFileSync(process.execPath, [runtimePath], { stdio: 'inherit' });
} finally {
  try { unlinkSync(runtimePath); } catch {}
}

console.log('Section canvas toolbar V58 applied with runtime-safe style persistence');
