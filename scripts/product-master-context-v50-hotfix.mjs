import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes('const PRODUCT_MASTER_CONTEXT_V50 = true;')) {
  throw new Error('PRODUCT_MASTER_CONTEXT_V50_HOTFIX: V50 marker missing');
}

app = app.replace('let PRODUCT_MASTER_CONTEXT_V50 = null;', 'let PRODUCT_MASTER_RUNTIME_V50 = null;');
app = app.replaceAll('productPublicationLocationsV50(viewEntity, PRODUCT_MASTER_CONTEXT_V50)', 'productPublicationLocationsV50(viewEntity, PRODUCT_MASTER_RUNTIME_V50)');
app = app.replaceAll('PRODUCT_MASTER_CONTEXT_V50?.navigate', 'PRODUCT_MASTER_RUNTIME_V50?.navigate');
app = app.replaceAll('PRODUCT_MASTER_CONTEXT_V50 = { pageSections, siteTrees, locale, region, pageId, navigate: navigateProductPlacementV50 };', 'PRODUCT_MASTER_RUNTIME_V50 = { pageSections, siteTrees, locale, region, pageId, navigate: navigateProductPlacementV50 };');

writeFileSync(appPath, app);
console.log('Product master context V50 hotfix applied: runtime context separated from build marker');
// Pages retry marker: V50 production deploy.
