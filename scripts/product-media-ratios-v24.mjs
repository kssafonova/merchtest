import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_MEDIA_RATIOS_V24';

if (!app.includes(MARKER)) {
  const variantMarker = 'const PRODUCT_VARIANTS_V23 = true;';
  if (!app.includes(variantMarker)) throw new Error('PRODUCT_MEDIA_RATIOS_V24: V23 variant layer missing');
  app = app.replace(variantMarker, variantMarker + '\nconst ' + MARKER + ' = true;');

  const start = app.indexOf('function ProductMediaVisual(');
  const candidateEnds = [
    '\nconst PRODUCTS = [...expandColorVariants(CATALOG_PRODUCTS), ...FEED_PRODUCTS];',
    '\nconst PRODUCTS = expandColorVariants(CATALOG_PRODUCTS);',
  ];
  const end = candidateEnds.map((anchor) => app.indexOf(anchor, start)).find((index) => index >= 0) ?? -1;
  if (start < 0 || end < 0) throw new Error('PRODUCT_MEDIA_RATIOS_V24: ProductMediaVisual anchors not found');

  const replacement = `function RatioMediaImage({ src, alt = '', className = '', loading = 'lazy', ratioMode = 'hero' }) {\n  const [orientation, setOrientation] = useState('portrait');\n  const handleLoad = (event) => {\n    const image = event.currentTarget;\n    setOrientation(image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait');\n  };\n  return <span className={'product-ratio-frame ' + orientation + ' ' + ratioMode + ' ' + className}><img src={src} alt={alt} loading={loading} onLoad={handleLoad}/></span>;\n}\n\nfunction ProductMediaVisual({ media, alt = '', className = '', loading = 'lazy', ratioMode = 'fill' }) {\n  if (!media) return <div className={'media-placeholder ' + className}><ImageIcon size={28}/></div>;\n  const useRatio = ratioMode === 'hero' || ratioMode === 'thumb';\n  if (typeof media === 'string') {\n    return useRatio ? <RatioMediaImage src={media} alt={alt} className={className} loading={loading} ratioMode={ratioMode}/> : <img className={className} src={media} alt={alt} loading={loading}/>;\n  }\n  if (media.kind === 'atlas') {\n    const x = (Number(media.col || 0) / 29) * 100;\n    const y = (Number(media.row || 0) / 15) * 100;\n    const atlas = <span className={'variant-atlas-frame ' + className} role=\"img\" aria-label={alt} style={{ backgroundImage: 'url(\"' + media.src + '\")', backgroundPosition: x + '% ' + y + '%' }}/>;\n    return useRatio ? <span className={'product-ratio-frame portrait ' + ratioMode}>{atlas}</span> : atlas;\n  }\n  if (media.src) {\n    return useRatio ? <RatioMediaImage src={media.src} alt={alt} className={className} loading={loading} ratioMode={ratioMode}/> : <img className={className} src={media.src} alt={alt} loading={loading}/>;\n  }\n  return <div className={'media-placeholder ' + className}><ImageIcon size={28}/></div>;\n}\n`;
  app = app.slice(0, start) + replacement + app.slice(end);

  const thumbPlain = '<ProductMediaVisual media={media} alt={\'Фото \' + (index + 1)} loading="eager"/>';
  const thumbRatio = '<ProductMediaVisual media={media} alt={\'Фото \' + (index + 1)} loading="eager" ratioMode="thumb"/>';
  if (app.includes(thumbPlain)) app = app.replace(thumbPlain, thumbRatio);

  const heroPlain = '<ProductMediaVisual media={activeMedia} alt={entity.name} loading="eager"/>';
  const heroRatio = '<ProductMediaVisual media={activeMedia} alt={entity.name} loading="eager" ratioMode="hero"/>';
  if (app.includes(heroPlain)) app = app.replace(heroPlain, heroRatio);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-media-ratios-v24 */')) {
  css += String.raw`
/* product-media-ratios-v24 */
.product-master-thumbs button{height:auto!important;min-height:0!important;display:block;background:#f3f4f5}
.product-ratio-frame{display:block;position:relative;overflow:hidden;background:#f1f2f3;flex:0 0 auto}
.product-ratio-frame.portrait{aspect-ratio:2/3}
.product-ratio-frame.landscape{aspect-ratio:3/2}
.product-ratio-frame>img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center}
.product-ratio-frame.thumb{width:100%;border-radius:8px}
.product-master-hero{height:430px;min-height:430px;padding:0;display:flex;align-items:center;justify-content:center;background:#f1f2f3}
.product-master-hero>.product-ratio-frame.hero.portrait{height:100%;width:auto;max-width:100%}
.product-master-hero>.product-ratio-frame.hero.landscape{width:100%;height:auto;max-height:100%}
.product-ratio-frame>.variant-atlas-frame{position:absolute!important;left:0!important;top:50%!important;right:auto!important;bottom:auto!important;width:100%!important;height:auto!important;min-height:0!important;aspect-ratio:1/1;transform:translateY(-50%);background-size:3000% 1600%;background-repeat:no-repeat}
.product-master-thumbs .product-ratio-frame>.variant-atlas-frame{min-height:0!important}
.product-master-hero .product-ratio-frame>.variant-atlas-frame{min-height:0!important}
@media(max-width:900px){.product-master-hero{height:min(64vh,520px);min-height:340px}.product-master-thumbs button{width:58px}}
`;
  writeFileSync(cssPath, css);
}
