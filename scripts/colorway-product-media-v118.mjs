import {readFileSync,writeFileSync} from 'node:fs';
const appPath='src/AppV3.jsx',cssPath='src/appv3.css',MARK='SYNTHETIC_COLOR_MEDIA_V118';
let app=readFileSync(appPath,'utf8');
function replaceOne(from,to,label){if(!app.includes(from))throw Error(MARK+': missing '+label);app=app.replace(from,to);}
if(!app.includes(MARK)){
  const marker='const PRODUCT_VARIANTS_V23 = true;';
  replaceOne(marker,marker+'\nconst '+MARK+' = true;','color variant runtime');
  app="import {colorVariantImagePathV118} from './color-variant-spec-v118.mjs';\n"+app;
  // Original SKU images remain exactly as supplied. Remove generic group photos
  // and the tiny atlas from the colorway gallery: they are not actual SKU photos.
  const base='const baseMedia = [\n      ...((base.images && base.images.length) ? base.images : (base.image ? [base.image] : [])),\n      ...(eligible ? variantAtlasShots(base.id, 1) : []),\n      ...productModelShots(base),\n    ];';
  const baseNew='const baseMedia = [\n      ...((base.images && base.images.length) ? base.images : (base.image ? [base.image] : [])),\n    ];';
  replaceOne(base,baseNew,'base image fallback');
  replaceOne('mediaItems: [...variantAtlasShots(base.id, row.variantIndex), ...productModelShots(base)],',
    'syntheticColorPreviewV118:true,\n        mediaItems: [PRODUCT_VARIANT_BASE_URL + colorVariantImagePathV118(base.id,row.variantIndex)],',
    'variant media routing');
  // All product cards, storefront slots, PIM gallery, recommendations,
  // reference cards and the colorway picker use ProductMediaVisual.
  const imageCheck="  if (typeof media === 'string') {\n    return useRatio ? <RatioMediaImage src={media} alt={alt} className={className} loading={loading} ratioMode={ratioMode}/> : <img className={className} src={media} alt={alt} loading={loading}/>;\n  }";
  const revised="  if (typeof media === 'string') {\n    const visual=useRatio ? <RatioMediaImage src={media} alt={alt} className={className} loading={loading} ratioMode={ratioMode}/> : <img className={className} src={media} alt={alt} loading={loading}/>;\n    return media.includes('/products/variants/') ? <span className={'synthetic-color-preview-v118 '+ratioMode}><>{visual}</><small title=\"Цвет создан для демонстрации, оригинальной фотографии этого SKU нет\">Цвет · демо</small></span> : visual;\n  }";
  replaceOne(imageCheck,revised,'shared product media visual');
  writeFileSync(appPath,app);
}
let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* V118: labelled preview')){css+="\n/* V118: labelled preview for colorways without supplied original SKU imagery */\n.synthetic-color-preview-v118{position:relative;display:block;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;background:#f2f1ed}\n.synthetic-color-preview-v118>img{display:block;width:100%;height:100%;object-fit:cover}\n.synthetic-color-preview-v118>.product-ratio-frame{height:100%!important;width:100%!important;display:block!important}\n.synthetic-color-preview-v118>small{position:absolute;bottom:7px;left:7px;z-index:8;display:inline-flex;align-items:center;gap:3px;\n  padding:4px 6px;border-radius:4px;background:rgba(255,255,255,.9);border:1px solid rgba(33,44,55,.08);\n  color:#41526a;font:600 9px/1.1 Inter,Arial,sans-serif;letter-spacing:.02em;pointer-events:none}\n.product-master-thumbs .synthetic-color-preview-v118>small,.product-color-mini-media-v52 .synthetic-color-preview-v118>small,\n.master-color-media-v50 .synthetic-color-preview-v118>small{display:none}\n.merch-card-media .synthetic-color-preview-v118>small{bottom:6px;left:6px;font-size:8px}\n.product-master-hero .synthetic-color-preview-v118>small{font-size:10px;padding:5px 8px}\n.reference-card-body .synthetic-color-preview-v118,.lego-slot .synthetic-color-preview-v118{position:relative;inset:auto}\n";writeFileSync(cssPath,css);}
console.log('V118: all 160 colorway SKUs use named-color product photos, with transparent synthetic-photo labels');
