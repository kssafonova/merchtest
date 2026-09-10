import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const bad = `{pageRules.enabled && pageResolution.autoGrid?.length > 0 && <PageAutoGrid items={pageResolution.autoGrid} region={region} device={device} hasLayouts={pageResolution.hasLayouts}/>}<div className="page-layout-actions">`;
const good = `<PageAutoGrid items={pageRules.enabled ? pageResolution.autoGrid : []} region={region} device={device} hasLayouts={pageResolution.hasLayouts}/><div className="page-layout-actions">`;
if (app.includes(bad)) app = app.replace(bad, good);
else if (!app.includes(good)) throw new Error('PAGE_RULES_V16: generated grid anchor not found');
writeFileSync(appPath, app);
console.log('Page-level rules v16 hotfix applied');
