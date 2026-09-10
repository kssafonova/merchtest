import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'MEDIA_QUALITY_STOCK_V26';

if (!app.includes(MARKER)) {
  const anchor = 'const STOCK_PHOTO_FALLBACK_V25 = true;';
  if (!app.includes(anchor)) throw new Error('MEDIA_QUALITY_STOCK_V26: V25 stock layer missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const productStart = app.indexOf('function productMediaItems(product) {');
  const productEnd = app.indexOf('\nfunction RatioMediaImage(', productStart);
  if (productStart < 0 || productEnd < 0) throw new Error('MEDIA_QUALITY_STOCK_V26: productMediaItems anchors not found');

  const productMedia = String.raw`function stableMediaSeed(value = '') {
  return String(value).split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function stockPrimaryForProduct(product) {
  const pool = stockPoolForProduct(product);
  if (!pool.length) return null;
  const portraits = pool.filter((item) => item.orientation !== 'landscape');
  const source = portraits.length ? portraits : pool;
  const index = stableMediaSeed(product?.id || product?.sku || product?.modelId || '') % source.length;
  return { ...source[index], primary: true, stockFallback: true };
}

function productMediaItems(product) {
  const raw = Array.isArray(product?.mediaItems) && product.mediaItems.length
    ? [...product.mediaItems]
    : Array.isArray(product?.images) && product.images.length
      ? [...product.images]
      : product?.image ? [product.image] : [];

  // Generated atlas frames were the main source of visually broken / black cards.
  // Keep only real image URLs and supported media; the first frame is always a stock URL.
  const cleaned = raw.filter((media) => {
    if (!media) return false;
    if (typeof media === 'object' && media.kind === 'atlas') return false;
    const src = typeof media === 'string' ? media : (media.src || '');
    return !String(src).includes('variant-atlas');
  });

  const primary = stockPrimaryForProduct(product);
  const result = primary ? [primary] : [];
  const signatures = new Set(result.map(mediaSignature));
  cleaned.forEach((media) => {
    const signature = mediaSignature(media);
    if (signature && !signatures.has(signature)) {
      result.push(media);
      signatures.add(signature);
    }
  });

  const targetCount = 6;
  const pool = stockPoolForProduct(product);
  const seed = stableMediaSeed(product?.id || '') + Number(product?.variantIndex || 0);
  const ordered = pool.map((_, index) => pool[(seed + index) % pool.length]);
  let cursor = 0;
  while (result.length < targetCount && cursor < Math.max(12, ordered.length * 4)) {
    const candidate = ordered[cursor % ordered.length];
    const signature = mediaSignature(candidate);
    if (candidate && signature && !signatures.has(signature)) {
      result.push({ ...candidate, stockFallback: true });
      signatures.add(signature);
    }
    cursor += 1;
  }
  return result.slice(0, targetCount);
}
`;
  app = app.slice(0, productStart) + productMedia + app.slice(productEnd);

  const runtimeAnchor = 'function RatioMediaImage(';
  const runtimeIndex = app.indexOf(runtimeAnchor);
  if (runtimeIndex < 0) throw new Error('MEDIA_QUALITY_STOCK_V26: RatioMediaImage not found');

  const runtime = String.raw`const UNIVERSAL_STOCK_FALLBACKS = [
  'https://images.pexels.com/photos/22742255/pexels-photo-22742255.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/37646397/pexels-photo-37646397.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6347618/pexels-photo-6347618.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'https://images.pexels.com/photos/20440141/pexels-photo-20440141.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/10482937/pexels-photo-10482937.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/7164503/pexels-photo-7164503.jpeg?auto=compress&cs=tinysrgb&w=1400',
  'https://images.pexels.com/photos/6261908/pexels-photo-6261908.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/5560083/pexels-photo-5560083.jpeg?auto=compress&cs=tinysrgb&w=1400'
];

function visualFallbackUrl(key = '') {
  return UNIVERSAL_STOCK_FALLBACKS[stableMediaSeed(key) % UNIVERSAL_STOCK_FALLBACKS.length];
}

function setVisualRatioClass(node, width, height) {
  if (!node || !width || !height) return;
  const orientation = width > height ? 'landscape' : 'portrait';
  node.classList.remove('ratio-portrait', 'ratio-landscape');
  node.classList.add('ratio-' + orientation);
  const frame = node.closest?.('.merch-card-media, .entity-details-preview, .product-master-hero, .product-master-thumbs button, .content-card-media, .look-preview, .media-preview');
  if (frame) {
    frame.classList.remove('ratio-portrait', 'ratio-landscape');
    frame.classList.add('ratio-' + orientation);
  }
}

function inspectDarkLocalImage(image) {
  if (!image || image.dataset.mediaQualityChecked === '1') return;
  image.dataset.mediaQualityChecked = '1';
  const src = image.currentSrc || image.src || '';
  if (!src || src.includes('images.pexels.com')) return;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(image, 0, 0, 20, 20);
    const pixels = context.getImageData(0, 0, 20, 20).data;
    let luminance = 0;
    let darkPixels = 0;
    let visiblePixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3];
      if (alpha < 20) continue;
      const light = 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
      luminance += light;
      visiblePixels += 1;
      if (light < 18) darkPixels += 1;
    }
    if (!visiblePixels) return;
    const average = luminance / visiblePixels;
    const darkShare = darkPixels / visiblePixels;
    if (average < 24 || darkShare > 0.9) {
      image.dataset.replacedWithStock = '1';
      image.src = visualFallbackUrl((image.alt || '') + src);
    }
  } catch {
    // Remote/CORS images cannot be sampled; keep them unless loading fails.
  }
}

function normalizeLoadedVisual(target) {
  if (target instanceof HTMLImageElement) {
    setVisualRatioClass(target, target.naturalWidth, target.naturalHeight);
    inspectDarkLocalImage(target);
  } else if (target instanceof HTMLVideoElement) {
    setVisualRatioClass(target, target.videoWidth, target.videoHeight);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('load', (event) => normalizeLoadedVisual(event.target), true);
  document.addEventListener('loadedmetadata', (event) => normalizeLoadedVisual(event.target), true);
  document.addEventListener('error', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    if (target.dataset.stockErrorFallback === '1' || (target.src || '').includes('images.pexels.com')) return;
    target.dataset.stockErrorFallback = '1';
    target.src = visualFallbackUrl((target.alt || '') + (target.src || ''));
  }, true);
}

`;
  app = app.slice(0, runtimeIndex) + runtime + app.slice(runtimeIndex);
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* media-quality-stock-v26 */')) {
  css += String.raw`
/* media-quality-stock-v26 */
/* Universal merchandising media geometry: portrait 2:3, landscape 3:2. */
.merch-card-media.ratio-portrait,.content-card-media.ratio-portrait,.entity-details-preview.ratio-portrait,.look-preview.ratio-portrait,.media-preview.ratio-portrait{aspect-ratio:2/3!important;height:auto!important;min-height:0!important}
.merch-card-media.ratio-landscape,.content-card-media.ratio-landscape,.entity-details-preview.ratio-landscape,.look-preview.ratio-landscape,.media-preview.ratio-landscape{aspect-ratio:3/2!important;height:auto!important;min-height:0!important}
.merch-card-media.ratio-portrait>img,.merch-card-media.ratio-landscape>img,.content-card-media.ratio-portrait>img,.content-card-media.ratio-landscape>img,.entity-details-preview.ratio-portrait>img,.entity-details-preview.ratio-landscape>img,.look-preview.ratio-portrait>img,.look-preview.ratio-landscape>img,.media-preview.ratio-portrait>img,.media-preview.ratio-landscape>img{width:100%!important;height:100%!important;object-fit:cover!important;display:block}
.merch-card-media.ratio-portrait>video,.merch-card-media.ratio-landscape>video,.content-card-media.ratio-portrait>video,.content-card-media.ratio-landscape>video,.media-preview.ratio-portrait>video,.media-preview.ratio-landscape>video{width:100%!important;height:100%!important;object-fit:cover!important;display:block}
.product-master-thumbs button.ratio-portrait{aspect-ratio:2/3!important;height:auto!important}
.product-master-thumbs button.ratio-landscape{aspect-ratio:3/2!important;height:auto!important}
.product-master-hero.ratio-portrait{aspect-ratio:2/3!important;height:min(64vh,540px)!important;width:auto;max-width:100%;margin-inline:auto}
.product-master-hero.ratio-landscape{aspect-ratio:3/2!important;height:auto!important;width:100%;max-height:540px}
.product-master-hero.ratio-portrait>img,.product-master-hero.ratio-landscape>img{width:100%!important;height:100%!important;object-fit:cover!important}
img[data-replaced-with-stock="1"]{object-fit:cover!important;background:#f2f2f0}
`;
  writeFileSync(cssPath, css);
}

console.log('Media quality stock v26 applied: stock primary images, dark-image fallback, universal 2:3 / 3:2 ratios');
