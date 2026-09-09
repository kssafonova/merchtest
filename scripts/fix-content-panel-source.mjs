import { readFileSync, writeFileSync } from 'node:fs';

const path = 'scripts/content-panel.mjs';
let source = readFileSync(path, 'utf8');
const before = "className={\\`library-entity ${selectedSlot ? 'clickable' : ''}\\`}";
const after = "className={'library-entity ' + (selectedSlot ? 'clickable' : '')}";
if (source.includes(before)) {
  source = source.replace(before, after);
  writeFileSync(path, source);
  console.log('Patched content-panel template interpolation');
} else {
  console.log('Content-panel interpolation already safe');
}
