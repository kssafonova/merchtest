import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/AppV3.jsx';
let app = readFileSync(path, 'utf8');
const composite = 'const PRODUCTS = [...CATALOG_PRODUCTS, ...FEED_PRODUCTS];';
const catalogOnly = 'const PRODUCTS = CATALOG_PRODUCTS;';
if (app.includes(composite)) app = app.replace(composite, catalogOnly);
else if (!app.includes(catalogOnly)) throw new Error('PRODUCT_VARIANTS_V23_COMPAT_PRE: PRODUCTS declaration not found');
writeFileSync(path, app);
console.log('Product variants v23 compatibility pre-step applied');
