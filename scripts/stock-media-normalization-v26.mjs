import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'STOCK_MEDIA_NORMALIZATION_V26';

if (!app.includes(MARKER)) {
  const anchor = 'const STOCK_PHOTO_FALLBACK_V25 = true;';
  if (!app.includes(anchor)) throw new Error('STOCK_MEDIA_NORMALIZATION_V26: V25 stock layer missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const mediaStart = app.indexOf('function productMediaItems(product) {');
  const mediaEnd = app.indexOf('\nfunction RatioMediaImage(', mediaStart);
  if (mediaStart < 0 || mediaEnd < 0) throw new Error('STOCK_MEDIA_NORMALIZATION_V26: productMediaItems anchors not found');

  const productMediaFn = `function isTechnicalProductMedia(media) {
  if (!media) return true;
  if (typeof media === 'object' && media.kind === 'atlas') return true;
  const src = typeof media === 'string' ? media : String(media.src || '');
  return /variant-atlas|product_sheet|contact.?sheet|atlas_/i.test(src);
}

function productMediaItems(product) {
  const sourceItems = Array.isArray(product?.mediaItems) && product.mediaItems.length
    ? [...product.mediaItems]
    : Array.isArray(product?.images) && product.images.length
      ? [...product.images]
      : product?.image ? [product.image] : [];

  const safeOwn = sourceItems.filter((media) => !isTechnicalProductMedia(media));
  const pool = stockPoolForProduct(product);
  const portraits = pool.filter((media) => media.orientation === 'portrait');
  const seed = Math.max(0, Number(String(product?.id || '').replace(/\\D/g, '')) || 0) + Number(product?.variantIndex || 0);
  const primaryPool = portraits.length ? portraits : pool;
  const primary = primaryPool.length ? primaryPool[seed % primaryPool.length] : null;
  const orderedStock = pool.map((_, index) => pool[(seed + index) % pool.length]);

  const result = [];
  const signatures = new Set();
  const pushUnique = (media) => {
    if (!media) return;
    const signature = mediaSignature(media);
    if (!signature || signatures.has(signature)) return;
    result.push(media);
    signatures.add(signature);
  };

  // First product image is always a stock photo URL.
  pushUnique(primary);
  safeOwn.forEach(pushUnique);
  orderedStock.forEach(pushUnique);

  return result.slice(0, 6);
}`;
  app = app.slice(0, mediaStart) + productMediaFn + app.slice(mediaEnd);

  const productsAnchor = 'const PRODUCTS = [...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS];';
  if (!app.includes(productsAnchor)) throw new Error('STOCK_MEDIA_NORMALIZATION_V26: product collection anchor not found');

  const libraryHelpers = `
const STOCK_EDITORIAL_MEDIA = [
  ...STOCK_PRODUCT_MEDIA.women,
  ...STOCK_PRODUCT_MEDIA.men,
  ...STOCK_PRODUCT_MEDIA.kids,
];

function stableEntitySeed(entity, index = 0) {
  const id = String(entity?.id || entity?.file || entity?.name || index);
  return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index;
}

function stockPortraitsForEntity(entity) {
  const department = String(entity?.department || '').toLowerCase();
  const pool = department.includes('дет') || department.includes('девоч') || department.includes('мальч')
    ? STOCK_PRODUCT_MEDIA.kids
    : department.includes('муж')
      ? STOCK_PRODUCT_MEDIA.men
      : STOCK_PRODUCT_MEDIA.women;
  const portraits = pool.filter((item) => item.orientation === 'portrait');
  return portraits.length ? portraits : STOCK_EDITORIAL_MEDIA.filter((item) => item.orientation === 'portrait');
}

function normalizeLibraryEntity(entity, index = 0) {
  if (!entity) return entity;
  const seed = stableEntitySeed(entity, index);

  if (entity.kind === 'look') {
    const portraits = stockPortraitsForEntity(entity);
    const first = portraits[seed % portraits.length];
    const second = portraits.length > 1 ? portraits[(seed + 1) % portraits.length] : null;
    const images = [first, second].filter(Boolean).map((item) => item.src);
    return {
      ...entity,
      image: images[0] || entity.image,
      images: images.length ? images : (entity.images || []),
      orientation: 'portrait',
      stockSource: 'Pexels',
    };
  }

  if (entity.kind === 'image') {
    const stock = STOCK_EDITORIAL_MEDIA[seed % STOCK_EDITORIAL_MEDIA.length];
    return {
      ...entity,
      src: stock?.src || entity.src,
      image: stock?.src || entity.image,
      images: stock?.src ? [stock.src] : (entity.images || []),
      orientation: stock?.orientation || 'portrait',
      stockSource: 'Pexels',
    };
  }

  if (entity.kind === 'video') {
    const file = String(entity.file || entity.src || '').toLowerCase();
    return { ...entity, orientation: /vertical|9x16|portrait/.test(file) ? 'portrait' : 'landscape' };
  }

  if (entity.kind === 'svg') return { ...entity, orientation: 'landscape' };
  return { ...entity, orientation: entity.orientation || 'portrait' };
}
`;
  app = app.replace(productsAnchor, libraryHelpers + '\n' + productsAnchor);

  const contentAnchor = 'const CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];';
  if (!app.includes(contentAnchor)) throw new Error('STOCK_MEDIA_NORMALIZATION_V26: content anchor not found');
  app = app.replace(contentAnchor,
    'const NORMALIZED_LOOKS = CATALOG_LOOKS.map((entity, index) => normalizeLibraryEntity(entity, index));\n' +
    'const NORMALIZED_MEDIA = CATALOG_MEDIA.map((entity, index) => normalizeLibraryEntity(entity, index + NORMALIZED_LOOKS.length));\n' +
    'const CONTENT = [...NORMALIZED_LOOKS, ...NORMALIZED_MEDIA];'
  );

  app = app.replace(/return CATALOG_LOOKS;/g, 'return NORMALIZED_LOOKS;');
  app = app.replace(/return CATALOG_MEDIA;/g, 'return NORMALIZED_MEDIA;');

  app = app.replace(
    "const useRatio = ratioMode === 'hero' || ratioMode === 'thumb';",
    "const useRatio = ratioMode === 'hero' || ratioMode === 'thumb' || ratioMode === 'card';"
  );
  app = app.replace(
    '<ProductMediaVisual media={image} alt={product.name}/>',
    '<ProductMediaVisual media={image} alt={product.name} ratioMode="card"/>'
  );

  app = app.replace(
    "const isLook = entity.kind === 'look';\n  const images = entity.images?.length ? entity.images : entity.image ? [entity.image] : [];",
    "const isLook = entity.kind === 'look';\n  const mediaOrientation = entity.orientation === 'landscape' ? 'landscape' : 'portrait';\n  const images = entity.images?.length ? entity.images : entity.image ? [entity.image] : [];"
  );
  app = app.replace(
    "return <div className={`entity-media merch-media-card ${isLook ? 'look-card' : ''} ${compact ? 'compact' : ''}`}}>",
    "return <div className={`entity-media merch-media-card ${isLook ? 'look-card' : ''} ${compact ? 'compact' : ''} ratio-${mediaOrientation}`}}>"
  );

  app = app.replace(
    '<div className="entity-details-preview">',
    '<div className={\'entity-details-preview ratio-\' + (entity.orientation === \'landscape\' ? \'landscape\' : \'portrait\')}>'
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* stock-media-normalization-v26 */')) {
  css += String.raw`
/* stock-media-normalization-v26 */
.product-ratio-frame.card{width:100%;height:auto;min-height:0}
.product-ratio-frame.card.portrait{aspect-ratio:2/3}
.product-ratio-frame.card.landscape{aspect-ratio:3/2}
.merch-product-card .merch-card-media:has(>.product-ratio-frame.card){flex:0 0 auto;min-height:0;height:auto!important;background:#f4f4f3}
.merch-product-card .merch-card-media>.product-ratio-frame.card{display:block;width:100%}
.merch-media-card.ratio-portrait .merch-card-media{aspect-ratio:2/3;flex:0 0 auto;min-height:0;height:auto!important}
.merch-media-card.ratio-landscape .merch-card-media{aspect-ratio:3/2;flex:0 0 auto;min-height:0;height:auto!important}
.merch-media-card.ratio-portrait .merch-card-media>img,.merch-media-card.ratio-landscape .merch-card-media>img,.merch-media-card.ratio-portrait .merch-card-media>video,.merch-media-card.ratio-landscape .merch-card-media>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.entity-details-preview.ratio-portrait{aspect-ratio:2/3!important;height:auto!important;max-height:72vh}
.entity-details-preview.ratio-landscape{aspect-ratio:3/2!important;height:auto!important;max-height:72vh}
.entity-details-preview.ratio-portrait>img,.entity-details-preview.ratio-landscape>img,.entity-details-preview.ratio-portrait>video,.entity-details-preview.ratio-landscape>video{width:100%;height:100%;object-fit:cover}
.library-entity .merch-media-card,.library-entity .merch-product-card{height:auto!important;min-height:0!important}
.library-entity .compact .merch-card-media{min-height:0!important}
`;
  writeFileSync(cssPath, css);
}

console.log('Stock media normalization v26 applied: stock-first products, stock looks/media, 2:3 and 3:2 ratios');
