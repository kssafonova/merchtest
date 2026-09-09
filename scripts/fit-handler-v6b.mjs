import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

const parentFitHandler = "onFitChange={(sectionId, slotIndex, fit) => updateSection(sectionId, (source) => ({ ...source, slotFits: { ...(source.slotFits || {}), [slotIndex]: fit } }))}";
if (!app.includes(parentFitHandler)) {
  const matches = [...app.matchAll(/onUnpin=\{[^}\n]+\}/g)];
  if (!matches.length) throw new Error('No onUnpin JSX prop found for fit handler');
  const target = matches[matches.length - 1][0];
  app = app.replace(target, `${target} ${parentFitHandler}`);
}

if (!app.includes(parentFitHandler)) throw new Error('Media fit handler was not attached');
writeFileSync(appPath, app);
console.log('Media fit handler v6b applied');
