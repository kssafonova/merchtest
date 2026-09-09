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

writeFileSync(appPath, app);
console.log('Runtime hotfix v5 applied: removed unsafe section mode access');
