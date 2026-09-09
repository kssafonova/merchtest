import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

const parentFitHandler = "onFitChange={(sectionId, slotIndex, fit) => updateSection(sectionId, (source) => ({ ...source, slotFits: { ...(source.slotFits || {}), [slotIndex]: fit } }))}";
if (!app.includes(parentFitHandler)) {
  const anchor = 'onUnpin={unpinEntity}';
  if (!app.includes(anchor)) throw new Error('SectionCanvas parent onUnpin prop not found for fit handler');
  app = app.replace(anchor, `${anchor} ${parentFitHandler}`);
}

if (!app.includes(parentFitHandler)) throw new Error('Media fit handler was not attached');
writeFileSync(appPath, app);
console.log('Media fit handler v6b applied');
