import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const marker = 'AUTOMATION_MASTER_V63_HOTFIX';

if (!app.includes(marker)) {
  const anchor = 'const AUTOMATION_MASTER_V63 = true;';
  if (!app.includes(anchor)) throw new Error(marker + ': V63 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + marker + ' = true;');
  app = app.replaceAll('rule.distribution.gridCapacity ?? capacity || 1', 'rule.distribution.gridCapacity ?? (capacity || 1)');
  writeFileSync(appPath, app);
}

console.log('V63 hotfix applied: nullish coalescing grouped safely');
