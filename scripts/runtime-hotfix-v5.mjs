import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

// section-layouts-v2 is applied after the rules engine and can reintroduce
// an obsolete mode badge that calls section.rules.mode.toUpperCase().
// The current rules model no longer guarantees `mode`, so this crashes
// the whole React tree at runtime and produces a blank GitHub Pages screen.
app = app.replace(
  /<span className=\{`mode-badge \$\{section\.rules\.mode\}`\}>\{section\.rules\.mode\.toUpperCase\(\)\}<\/span>/g,
  ''
);

// Defensive fallback in case the exact markup changes but the unsafe call remains.
app = app.replace(
  /section\.rules\.mode\.toUpperCase\(\)/g,
  "(section.rules.mode || 'AUTO').toUpperCase()"
);

if (app.includes('section.rules.mode.toUpperCase()')) {
  throw new Error('Unsafe section.rules.mode.toUpperCase() call still present');
}

// The content-card transform uses <MediaIndex/> for multi-image products/looks.
// In the current build pipeline the helper itself can be lost by a later source transform,
// which causes ReferenceError: MediaIndex is not defined and leaves GitHub Pages blank.
if (app.includes('<MediaIndex ') && !/function\s+MediaIndex\s*\(/.test(app)) {
  const anchor = 'function ProductCard(';
  const at = app.indexOf(anchor);
  if (at < 0) throw new Error('ProductCard anchor not found for MediaIndex runtime fix');
  const helper = `function MediaIndex({ count = 0, active = 0, onChange }) {\n  if (!count || count <= 1) return null;\n  return <div className="media-index" onClick={(event) => event.stopPropagation()}>\n    {Array.from({ length: count }, (_, index) => <button type="button" key={index} className={active === index ? 'active' : ''} onClick={(event) => { event.stopPropagation(); onChange?.(index); }} aria-label={'Фото ' + (index + 1)}>{index + 1}</button>)}\n  </div>;\n}\n\n`;
  app = app.slice(0, at) + helper + app.slice(at);
}

if (app.includes('<MediaIndex ') && !/function\s+MediaIndex\s*\(/.test(app)) {
  throw new Error('MediaIndex helper is still missing');
}

writeFileSync(appPath, app);
console.log('Runtime hotfix v5 applied: safe rules mode + MediaIndex helper');
