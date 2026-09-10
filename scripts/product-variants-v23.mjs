import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const variantsPath = 'public/data/catalog_product_variants.csv';
const atlasOut = 'public/products/variant-atlas.jpg';
const atlasParts = [
  'scripts/variant-media/atlas.part01.b64',
  'scripts/variant-media/atlas.part02.b64',
  'scripts/variant-media/atlas.part03.b64',
];

function parseSemicolonCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(';').map((value) => value.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(';');
    return Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()]));
  });
}

if (!existsSync(variantsPath)) throw new Error('PRODUCT_VARIANTS_V23: catalog_product_variants.csv is missing');
for (const part of atlasParts) if (!existsSync(part)) throw new Error(`PRODUCT_VARIANTS_V23: missing ${part}`);
const atlasBase64 = atlasParts.map((part) => readFileSync(part, 'utf8').trim()).join('');
writeFileSync(atlasOut, Buffer.from(atlasBase64, 'base64'));

const variantRows = parseSemicolonCsv(readFileSync(variantsPath, 'utf8')).map((row) => ({
  baseSku: row.base_sku,
  sku: row.sku,
  variantIndex: Number(row.variant_index || 1),
  color: row['Цвет'] || '',
}));

let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_VARIANTS_V23';
if (!app.includes(MARKER)) {
  const productsAnchor = 'const PRODUCTS = CATALOG_PRODUCTS;';
  if (!app.includes(productsAnchor)) throw new Error('PRODUCT_VARIANTS_V23: PRODUCTS anchor not found');

  const helpers = `const ${MARKER} = true;
const COLOR_VARIANT_ROWS = ${JSON.stringify(variantRows, null, 2)};
const PRODUCT_VARIANT_BASE_URL = import.meta.env.BASE_URL || '/';

function variantAtlasShots(baseSku, variantIndex = 1) {
  const baseNumber = Math.max(1, Number(String(baseSku || '').replace(/\\D/g, '')) || 1);
  const group = Math.floor((baseNumber - 1) / 20);
  const local = (baseNumber - 1) % 20;
  const sheet = Math.floor(local / 4);
  const row = group * 4 + (local % 4);
  return [0, 1].map((pose) => ({
    kind: 'atlas',
    src: PRODUCT_VARIANT_BASE_URL + 'products/variant-atlas.jpg',
    col: sheet * 6 + (Number(variantIndex || 1) - 1) * 2 + pose,
    row,
    pose: pose + 1,
  }));
}

function productLookGroup(product) {
  const department = String(product?.department || '').toLowerCase();
  const category = String(product?.category || '').toLowerCase();
  const subcategory = String(product?.subcategory || '').toLowerCase();
  const collection = String(product?.collection || '').toLowerCase();
  const text = [category, subcategory, collection].join(' ');
  if (department.includes('жен')) {
    if (text.includes('деним') || text.includes('джин')) return 'W04';
    if (text.includes('sport') || text.includes('спорт') || text.includes('худи') || text.includes('свитш') || text.includes('леггин')) return 'W05';
    if (text.includes('evening') || text.includes('плать') || text.includes('юбк')) return 'W02';
    if (text.includes('studio') || text.includes('верхняя') || text.includes('пальто') || text.includes('пидж') || text.includes('костюм')) return 'W03';
    return 'W01';
  }
  if (department.includes('муж')) {
    if (text.includes('деним') || text.includes('джин')) return 'M02';
    if (text.includes('sport') || text.includes('спорт') || text.includes('худи') || text.includes('свитш')) return 'M03';
    if (text.includes('summer') || text.includes('casual') || text.includes('карго')) return 'M05';
    if (text.includes('studio') || text.includes('костюм') || text.includes('пальто') || text.includes('бомбер')) return 'M01';
    return 'M04';
  }
  if (text.includes('деним') || text.includes('джин')) return 'K02';
  if (text.includes('sport') || text.includes('спорт') || text.includes('худи') || text.includes('леггин')) return 'K03';
  if (text.includes('school') || text.includes('рубаш') || text.includes('жилет')) return 'K04';
  if (text.includes('верхняя') || text.includes('куртк') || text.includes('карго')) return 'K05';
  return 'K01';
}

function productModelShots(product) {
  const group = productLookGroup(product);
  return [1, 2].map((index) => PRODUCT_VARIANT_BASE_URL + 'looks/' + group + '_' + index + '.jpg');
}

function expandColorVariants(baseProducts) {
  const rowsByBase = new Map();
  COLOR_VARIANT_ROWS.forEach((row) => {
    if (!rowsByBase.has(row.baseSku)) rowsByBase.set(row.baseSku, []);
    rowsByBase.get(row.baseSku).push(row);
  });
  const expanded = [];
  baseProducts.forEach((base) => {
    const baseNumber = Number(String(base.id || '').replace(/\\D/g, '')) || 0;
    const eligible = baseNumber >= 1 && baseNumber <= 80;
    const baseMedia = [
      ...((base.images && base.images.length) ? base.images : (base.image ? [base.image] : [])),
      ...(eligible ? variantAtlasShots(base.id, 1) : []),
      ...productModelShots(base),
    ];
    expanded.push({
      ...base,
      modelId: base.id,
      baseSku: base.id,
      variantIndex: 1,
      isColorVariant: false,
      mediaItems: baseMedia,
    });
    if (!eligible) return;
    (rowsByBase.get(base.id) || []).sort((a, b) => a.variantIndex - b.variantIndex).forEach((row) => {
      expanded.push({
        ...base,
        id: row.sku,
        sku: row.sku,
        modelId: base.id,
        baseSku: base.id,
        variantIndex: row.variantIndex,
        color: row.color,
        isColorVariant: true,
        image: '',
        images: [],
        imageFile: '',
        imageFiles: [],
        looksCount: 0,
        mediaItems: [...variantAtlasShots(base.id, row.variantIndex), ...productModelShots(base)],
      });
    });
  });
  const groups = new Map();
  expanded.forEach((product) => {
    if (!groups.has(product.modelId)) groups.set(product.modelId, []);
    groups.get(product.modelId).push(product);
  });
  return expanded.map((product) => ({
    ...product,
    colorVariantCount: groups.get(product.modelId)?.length || 1,
    colorVariants: (groups.get(product.modelId) || []).map((variant) => ({ id: variant.id, color: variant.color })),
  }));
}

function productMediaItems(product) {
  if (Array.isArray(product?.mediaItems) && product.mediaItems.length) return product.mediaItems;
  if (Array.isArray(product?.images) && product.images.length) return product.images;
  return product?.image ? [product.image] : [];
}

function ProductMediaVisual({ media, alt = '', className = '', loading = 'lazy' }) {
  if (!media) return <div className={'media-placeholder ' + className}><ImageIcon size={28}/></div>;
  if (typeof media === 'string') return <img className={className} src={media} alt={alt} loading={loading}/>;
  if (media.kind === 'atlas') {
    const x = (Number(media.col || 0) / 29) * 100;
    const y = (Number(media.row || 0) / 15) * 100;
    return <span className={'variant-atlas-frame ' + className} role="img" aria-label={alt} style={{ backgroundImage: 'url("' + media.src + '")', backgroundPosition: x + '% ' + y + '%' }}/>;
  }
  if (media.src) return <img className={className} src={media.src} alt={alt} loading={loading}/>;
  return <div className={'media-placeholder ' + className}><ImageIcon size={28}/></div>;
}
`;

  app = app.replace(productsAnchor, helpers + '\nconst PRODUCTS = expandColorVariants(CATALOG_PRODUCTS);');

  const productImagesLine = "const images = product.images?.length ? product.images : product.image ? [product.image] : [];";
  if (app.includes(productImagesLine)) app = app.replace(productImagesLine, 'const images = productMediaItems(product);');
  app = app.replace(
    '{image ? <img src={image} alt={product.name} loading="lazy"/> : <div className="media-placeholder"><ImageIcon size={28}/></div>}',
    '{image ? <ProductMediaVisual media={image} alt={product.name}/> : <div className="media-placeholder"><ImageIcon size={28}/></div>}'
  );
  app = app.replace(
    '<strong>{product.name}</strong><b>{money(product.price)}</b>',
    '<strong>{product.name}</strong><small className="product-color-meta">{product.color} · {product.colorVariantCount || 1} цветовых SKU</small><b>{money(product.price)}</b>'
  );

  if (!app.includes('function ProductMasterDataModal')) throw new Error('PRODUCT_VARIANTS_V23: V22 product modal missing');
  app = app.replace('const images = editorImages(entity);', 'const images = productMediaItems(entity);');
  app = app.replace(
    "const activeSrc = images[Math.min(activeImage, Math.max(images.length - 1, 0))] || '';",
    "const activeMedia = images[Math.min(activeImage, Math.max(images.length - 1, 0))] || null;"
  );
  app = app.replace(
    "{images.slice(0, 6).map((src, index) => <button key={src + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><img src={src} alt={'Фото ' + (index + 1)}/></button>)}",
    "{images.slice(0, 6).map((media, index) => <button key={entity.id + '-media-' + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><ProductMediaVisual media={media} alt={'Фото ' + (index + 1)} loading=\"eager\"/></button>)}"
  );
  app = app.replace(
    "{activeSrc ? <img src={activeSrc} alt={entity.name}/> : <div className=\"product-master-noimage\"><ImageIcon size={38}/><span>Нет изображения</span></div>}",
    "{activeMedia ? <ProductMediaVisual media={activeMedia} alt={entity.name} loading=\"eager\"/> : <div className=\"product-master-noimage\"><ImageIcon size={38}/><span>Нет изображения</span></div>}"
  );
  app = app.replace(
    "['Коллекция', entity.collection, 'PIM'], ['Цвет', entity.color, 'PIM'], ['Материал', entity.material, 'PIM']",
    "['Коллекция', entity.collection, 'PIM'], ['Модель', entity.modelId || entity.id, 'PIM'], ['Цветовой SKU', entity.id, 'PIM'], ['Цвет', entity.color, 'PIM'], ['Цвета модели', (entity.colorVariants || []).map((variant) => variant.color).join(' · '), 'PIM'], ['Материал', entity.material, 'PIM']"
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-variants-v23 */')) {
  css += `
/* product-variants-v23 */
.variant-atlas-frame{display:block;width:100%;height:100%;min-height:100%;background-repeat:no-repeat;background-size:3000% 1600%;background-color:#f3f3f1;background-origin:border-box;background-clip:border-box}
.merch-card-media>.variant-atlas-frame{position:absolute;inset:0}
.product-master-hero>.variant-atlas-frame{width:100%;height:100%;min-height:420px}
.product-master-thumbs .variant-atlas-frame{width:100%;height:100%;min-height:56px}
.product-color-meta{display:block;margin-top:4px;color:#747982;font-size:10px;font-weight:600;line-height:1.25}
`;
  writeFileSync(cssPath, css);
}
