import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'STOCK_PHOTO_FALLBACK_V25';

if (!app.includes(MARKER)) {
  const anchor = 'const PRODUCT_MEDIA_RATIOS_V24 = true;';
  if (!app.includes(anchor)) throw new Error('STOCK_PHOTO_FALLBACK_V25: V24 media layer missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const oldFn = `function productMediaItems(product) {
  if (Array.isArray(product?.mediaItems) && product.mediaItems.length) return product.mediaItems;
  if (Array.isArray(product?.images) && product.images.length) return product.images;
  return product?.image ? [product.image] : [];
}`;

  if (!app.includes(oldFn)) throw new Error('STOCK_PHOTO_FALLBACK_V25: productMediaItems not found');

  const replacement = `const STOCK_PRODUCT_MEDIA = {
  women: [
    { kind: 'stock', src: 'https://images.pexels.com/photos/22742255/pexels-photo-22742255.jpeg?auto=compress&cs=tinysrgb&w=1200', source: 'Pexels', orientation: 'portrait' },
    { kind: 'stock', src: 'https://images.pexels.com/photos/37646397/pexels-photo-37646397.jpeg?auto=compress&cs=tinysrgb&w=1200', source: 'Pexels', orientation: 'portrait' },
    { kind: 'stock', src: 'https://images.pexels.com/photos/6347618/pexels-photo-6347618.jpeg?auto=compress&cs=tinysrgb&w=1400', source: 'Pexels', orientation: 'landscape' }
  ],
  men: [
    { kind: 'stock', src: 'https://images.pexels.com/photos/20440141/pexels-photo-20440141.jpeg?auto=compress&cs=tinysrgb&w=1200', source: 'Pexels', orientation: 'portrait' },
    { kind: 'stock', src: 'https://images.pexels.com/photos/10482937/pexels-photo-10482937.jpeg?auto=compress&cs=tinysrgb&w=1200', source: 'Pexels', orientation: 'portrait' },
    { kind: 'stock', src: 'https://images.pexels.com/photos/7164503/pexels-photo-7164503.jpeg?auto=compress&cs=tinysrgb&w=1400', source: 'Pexels', orientation: 'landscape' }
  ],
  kids: [
    { kind: 'stock', src: 'https://images.pexels.com/photos/6261908/pexels-photo-6261908.jpeg?auto=compress&cs=tinysrgb&w=1200', source: 'Pexels', orientation: 'portrait' },
    { kind: 'stock', src: 'https://images.pexels.com/photos/5560083/pexels-photo-5560083.jpeg?auto=compress&cs=tinysrgb&w=1400', source: 'Pexels', orientation: 'landscape' }
  ]
};

function stockPoolForProduct(product) {
  const department = String(product?.department || product?.gender || '').toLowerCase();
  if (department.includes('дет') || department.includes('девоч') || department.includes('мальч')) return STOCK_PRODUCT_MEDIA.kids;
  if (department.includes('муж')) return STOCK_PRODUCT_MEDIA.men;
  return STOCK_PRODUCT_MEDIA.women;
}

function mediaSignature(media) {
  if (!media) return '';
  if (typeof media === 'string') return media;
  if (media.kind === 'atlas') return [media.src, media.col, media.row].join(':');
  return media.src || JSON.stringify(media);
}

function productMediaItems(product) {
  const own = Array.isArray(product?.mediaItems) && product.mediaItems.length
    ? [...product.mediaItems]
    : Array.isArray(product?.images) && product.images.length
      ? [...product.images]
      : product?.image ? [product.image] : [];

  const targetCount = 6;
  if (own.length >= targetCount) return own;

  const pool = stockPoolForProduct(product);
  if (!pool.length) return own;
  const seed = Math.max(0, Number(String(product?.id || '').replace(/\\D/g, '')) || 0) + Number(product?.variantIndex || 0);
  const ordered = pool.map((_, index) => pool[(seed + index) % pool.length]);
  const signatures = new Set(own.map(mediaSignature));
  let cursor = 0;
  while (own.length < targetCount && cursor < ordered.length * 3) {
    const candidate = ordered[cursor % ordered.length];
    const signature = mediaSignature(candidate);
    if (!signatures.has(signature)) {
      own.push(candidate);
      signatures.add(signature);
    }
    cursor += 1;
  }
  return own;
}`;

  app = app.replace(oldFn, replacement);
  writeFileSync(appPath, app);
}

console.log('Stock photo fallback v25 applied: missing product media filled from Pexels');
