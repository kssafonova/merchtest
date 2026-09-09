import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');

if (!app.includes("from './catalogProducts.js'")) {
  app = app.replace(
    "import React, { useMemo, useState } from 'react';",
    "import React, { useMemo, useState } from 'react';\nimport { CATALOG_PRODUCTS, CATALOG_COLLECTIONS, CATALOG_META, CATALOG_SPRITE_DATA } from './catalogProducts.js';",
  );
}

// Replace the temporary demo products with the complete CSV catalog.
app = app.replace(
  /const PRODUCTS = \[[\s\S]*?\];\n\nconst CONTENT = \[/,
  "const PRODUCTS = CATALOG_PRODUCTS;\n\nconst CONTENT = [",
);

// The CSV has a single stock column rather than regional stock columns.
// catalogProducts.js keeps that exact value as stockValue and mirrors it into the
// regional demo keys only so the existing regional prototype mechanics keep working.
app = app.replace(
  "const DEFAULT_RULES = { mode: 'manual', collection: 'S26', stockMin: 3, l7dMin: 10, dedupe: true, oos: 'fallback', emptyBehavior: 'keep', ttl: 15 };",
  "const DEFAULT_RULES = { mode: 'manual', collection: 'Все', stockMin: 3, l7dMin: 10, dedupe: true, oos: 'fallback', emptyBehavior: 'keep', ttl: 15 };",
);

app = app.replace(
  "if (id?.startsWith('P-')) return 'product';",
  "if (PRODUCTS.some((p) => p.id === id)) return 'product';",
);

[
  ["'P-101'", "'LIM001'"],
  ["'P-102'", "'LIM002'"],
  ["'P-103'", "'LIM003'"],
  ["'P-104'", "'LIM004'"],
  ["'P-105'", "'LIM005'"],
  ["'P-106'", "'LIM006'"],
].forEach(([from, to]) => {
  app = app.replaceAll(from, to);
});

if (!app.includes('function productSpriteStyle')) {
  const productBlock = String.raw`function productSpriteStyle(product) {
  const cols = product.spriteCols || 14;
  const rows = product.spriteRows || 10;
  const x = cols > 1 ? (product.spriteX / (cols - 1)) * 100 : 0;
  const y = rows > 1 ? (product.spriteY / (rows - 1)) * 100 : 0;
  return {
    backgroundImage: \`url(\${CATALOG_SPRITE_DATA})\`,
    backgroundSize: \`\${cols * 100}% \${rows * 100}%\`,
    backgroundPosition: \`\${x}% \${y}%\`,
    backgroundRepeat: 'no-repeat',
  };
}

function ProductCard({ product, region, compact = false }) {
  const attributes = [
    ['Артикул', product.article],
    ['Отдел', product.department],
    ['Гендер', product.gender],
    ['Категория', product.category],
    ['Подкатегория', product.subcategory],
    ['Материал', product.material],
    ['Цвет', product.color],
    ['Коллекция', product.collection],
    ['Силуэт / фасон', product.silhouette],
    ['Возрастная группа', product.ageGroup],
    ['Посадка', product.fit],
    ['Длина изделия', product.length],
    ['Длина рукава', product.sleeveLength],
    ['Детали', product.details],
    ['Цена', money(product.price)],
    ['Скидка', product.discount ? \`\${product.discount}%\` : 'Нет'],
    ['Остатки', product.stockValue],
    ['L7D', product.l7d],
    ['Новинка', product.isNew ? 'Да' : 'Нет'],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');

  return <div className={\`entity-product catalog-product \${compact ? 'compact' : ''}\`}>
    <div className="entity-art catalog-art" style={productSpriteStyle(product)} role="img" aria-label={product.name}/>
    <div className="entity-info">
      <div className="catalog-name-row"><strong>{product.name}</strong>{product.isNew && <em>NEW</em>}</div>
      <span className="catalog-article">{product.article}</span>
      {!compact && <span className="catalog-price">{money(product.price)}{product.discount > 0 && <em>−{product.discount}%</em>}</span>}
      <small>{[product.department, product.category, product.color].filter(Boolean).join(' · ')}</small>
      <small>Остатки: {product.stockValue} · L7D: {product.l7d}</small>
      {compact && <details className="catalog-characteristics" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <summary>Характеристики</summary>
        <div className="catalog-attrs-grid">{attributes.map(([label, value]) => <div key={label}><span>{label}</span><b>{String(value)}</b></div>)}</div>
      </details>}
    </div>
  </div>;
}
function MediaCard`;

  app = app.replace(
    /function ProductCard\(\{ product, region, compact = false \}\) \{[\s\S]*?\n\}\nfunction MediaCard/,
    productBlock,
  );
}

app = app.replace(
  "return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()));",
  "return PRODUCTS.filter((p) => { const q = query.trim().toLowerCase(); if (!q) return true; return [p.name, p.id, p.article, p.department, p.gender, p.category, p.subcategory, p.material, p.color, p.collection, p.silhouette, p.details].some((value) => String(value || '').toLowerCase().includes(q)); });",
);

app = app.replace(
  '<option>S26</option><option value="Все">Все</option>',
  '<option value="Все">Все</option>{CATALOG_COLLECTIONS.map((collection) => <option key={collection} value={collection}>{collection}</option>)}',
);

app = app.replace(
  'placeholder="Название / ID"',
  'placeholder="Название / артикул / категория / цвет"',
);

app = app.replace(
  'Перетащите в любой пустой слот товар, образ, изображение, видео или SVG.',
  'Перетащите в любой пустой слот товар, образ, изображение, видео или SVG. Загружено {CATALOG_META.productCount} товаров и {CATALOG_META.imageCount} фотографий из каталога.',
);

writeFileSync(appPath, app);

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');
const marker = '/* catalog-products-v1 */';
if (!css.includes(marker)) {
  css += `
${marker}
.catalog-product{background:#fff!important;height:184px!important}.catalog-product .catalog-art{background-color:#f7f7f7;background-repeat:no-repeat}.catalog-product .entity-info{gap:3px}.catalog-name-row{display:flex;align-items:center;gap:5px;min-width:0}.catalog-name-row strong{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.catalog-name-row em{font-style:normal;font-size:7px;font-weight:800;letter-spacing:.04em;color:#245fca;background:#eaf2ff;border-radius:3px;padding:2px 4px}.catalog-article{font-size:8px!important;letter-spacing:.05em;color:#7d818b}.catalog-price{display:flex;align-items:center;gap:5px;font-weight:700}.catalog-price em{font-style:normal;font-size:8px;color:#bf4e4e;background:#fff0f0;border-radius:3px;padding:1px 4px}.entity-product.catalog-product.compact{height:auto!important;min-height:88px;grid-template-columns:78px minmax(0,1fr);align-items:stretch}.entity-product.catalog-product.compact .catalog-art{height:88px!important;min-height:88px}.entity-product.catalog-product.compact .entity-info{padding:7px 8px;align-content:start}.catalog-characteristics{margin-top:4px;border-top:1px solid #eceef2;padding-top:4px}.catalog-characteristics summary{font-size:8px;font-weight:800;color:#3564c8;cursor:pointer;list-style:none}.catalog-characteristics summary::-webkit-details-marker{display:none}.catalog-characteristics summary:after{content:' +';font-weight:900}.catalog-characteristics[open] summary:after{content:' −'}.catalog-attrs-grid{display:grid;grid-template-columns:1fr;gap:0;margin-top:5px;max-height:260px;overflow:auto;border:1px solid #eceef2;border-radius:5px;background:#fbfbfc}.catalog-attrs-grid>div{display:grid;grid-template-columns:42% 58%;gap:5px;padding:5px 6px;border-bottom:1px solid #eceef2;font-size:8px}.catalog-attrs-grid>div:last-child{border-bottom:0}.catalog-attrs-grid span{color:#858993}.catalog-attrs-grid b{font-weight:650;color:#353941;word-break:break-word}.library-entity:has(.catalog-characteristics[open]){align-items:start}.library-entity:has(.catalog-characteristics[open])>svg{margin-top:8px}.lego-slot:has(.catalog-product){min-height:210px}.storefront-frame.mobile .lego-slot:has(.catalog-product){min-height:220px}
`;
  writeFileSync(cssPath, css);
}

console.log('Prepared complete catalog: 140 products / 140 images');
