import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/AppV3.jsx';
let app = readFileSync(path, 'utf8');
const catalogOnly = 'const PRODUCTS = expandColorVariants(CATALOG_PRODUCTS);';
const composite = 'const PRODUCTS = [...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS];';
if (app.includes(catalogOnly)) app = app.replace(catalogOnly, composite);
else if (!app.includes(composite)) throw new Error('PRODUCT_VARIANTS_V23_COMPAT_POST: expanded PRODUCTS declaration not found');
writeFileSync(path, app);
console.log('Product variants v23 compatibility post-step applied');
