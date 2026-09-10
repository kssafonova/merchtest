import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AUTOMATION_RUNTIME_INIT_V66';

if (!app.includes(MARKER)) {
  const anchor = 'const AUTOMATION_ACCEPTANCE_V65 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V65 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const eager = 'const AUTOMATION_PRODUCT_INDEX_V63 = buildAutomationIndexV63();';
  if (!app.includes(eager)) throw new Error(MARKER + ': eager product index declaration missing');

  const lazy = `let AUTOMATION_PRODUCT_INDEX_V63 = null;
function automationProductIndexV66() {
  if (!AUTOMATION_PRODUCT_INDEX_V63) AUTOMATION_PRODUCT_INDEX_V63 = buildAutomationIndexV63();
  return AUTOMATION_PRODUCT_INDEX_V63;
}`;
  app = app.replace(eager, lazy);

  app = app.replaceAll('AUTOMATION_PRODUCT_INDEX_V63.docs', 'automationProductIndexV66().docs');
  app = app.replaceAll('AUTOMATION_PRODUCT_INDEX_V63.exact', 'automationProductIndexV66().exact');
  app = app.replaceAll('AUTOMATION_PRODUCT_INDEX_V63.all', 'automationProductIndexV66().all');

  writeFileSync(appPath, app);
}

console.log('V66 applied: automation product index is initialized lazily after PRODUCTS is available');
