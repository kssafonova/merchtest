import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync('src/AppV3.jsx', 'utf8');
writeFileSync('public/debug-generated-AppV3.jsx', source, 'utf8');
console.log('Generated AppV3 source exported for runtime diagnosis');
