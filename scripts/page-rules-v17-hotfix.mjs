import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const from = `<PageAutoGrid items={pageRules.enabled ? pageResolution.autoGrid : []} region={region} device={device} hasLayouts={pageResolution.hasLayouts}/><div className="page-layout-actions">`;
const to = `<div className="page-layout-actions"><PageAutoGrid items={pageRules.enabled ? pageResolution.autoGrid : []} region={region} device={device} hasLayouts={pageResolution.hasLayouts}/>`;
if (app.includes(from)) app = app.replace(from, to);
else if (!app.includes(to)) throw new Error('PAGE_RULES_V17: page actions/grid anchor not found');
writeFileSync(appPath, app);
console.log('Page-level rules v17 hotfix applied');
