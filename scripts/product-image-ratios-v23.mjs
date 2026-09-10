import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_IMAGE_RATIOS_V23';

if (!app.includes(MARKER)) {
  const markerAnchor = 'const PRODUCT_MASTER_DATA_V22 = true;';
  if (!app.includes(markerAnchor)) throw new Error('PRODUCT_IMAGE_RATIOS_V23: V22 marker missing');
  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;');

  const modalAnchor = 'function ProductMasterDataModal({ entity, region = \'RU\', onClose }) {';
  if (!app.includes(modalAnchor)) throw new Error('PRODUCT_IMAGE_RATIOS_V23: ProductMasterDataModal not found');

  const ratioComponent = `function MasterRatioImage({ src, alt, variant = 'hero' }) {\n  const [orientation, setOrientation] = useState('portrait');\n  const handleLoad = (event) => {\n    const image = event.currentTarget;\n    setOrientation(image.naturalWidth > image.naturalHeight ? 'landscape' : 'portrait');\n  };\n  return <span className={'master-ratio-image ' + orientation + ' ' + variant}><img src={src} alt={alt} onLoad={handleLoad}/></span>;\n}\n\n`;
  app = app.replace(modalAnchor, ratioComponent + modalAnchor);

  app = app.replace(
    `<div className="product-master-thumbs">{images.slice(0, 6).map((src, index) => <button key={src + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><img src={src} alt={'Фото ' + (index + 1)}/></button>)}</div>`,
    `<div className="product-master-thumbs">{images.slice(0, 6).map((src, index) => <button key={src + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><MasterRatioImage src={src} alt={'Фото ' + (index + 1)} variant="thumb"/></button>)}</div>`
  );

  app = app.replace(
    `<div className="product-master-hero">{activeSrc ? <img src={activeSrc} alt={entity.name}/> : <div className="product-master-noimage"><ImageIcon size={38}/><span>Нет изображения</span></div>}</div>`,
    `<div className="product-master-hero">{activeSrc ? <MasterRatioImage key={activeSrc} src={activeSrc} alt={entity.name} variant="hero"/> : <div className="product-master-noimage"><ImageIcon size={38}/><span>Нет изображения</span></div>}</div>`
  );

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-image-ratios-v23 */')) {
  css += String.raw`
/* product-image-ratios-v23 */
.product-master-thumbs button{height:auto;min-height:0;display:block;background:#f3f4f5}
.master-ratio-image{display:block;overflow:hidden;background:#f1f2f3;position:relative}
.master-ratio-image.portrait{aspect-ratio:2/3}
.master-ratio-image.landscape{aspect-ratio:3/2}
.master-ratio-image img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
.master-ratio-image.thumb{width:100%}
.product-master-thumbs button .master-ratio-image{border-radius:8px}
.product-master-hero{height:430px;min-height:430px;padding:0;background:#f1f2f3;display:flex;align-items:center;justify-content:center}
.product-master-hero .master-ratio-image.hero.portrait{height:100%;width:auto;max-width:100%}
.product-master-hero .master-ratio-image.hero.landscape{width:100%;height:auto;max-height:100%}
.product-master-hero .master-ratio-image.hero img{object-fit:cover}
@media(max-width:900px){.product-master-hero{height:min(64vh,520px);min-height:340px}.product-master-thumbs button{width:58px}}
`;
  writeFileSync(cssPath, css);
}
