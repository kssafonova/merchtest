import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'MASTER_TABS_MEDIA_DND_V55';

function functionChunk(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(MARKER + ': function ' + name + ' missing');
  const next = source.indexOf('\nfunction ', start + ('function ' + name + '(').length);
  if (next < 0) throw new Error(MARKER + ': end of function ' + name + ' missing');
  return { start, end: next, chunk: source.slice(start, next) };
}

function replaceFunction(source, name, transform) {
  const part = functionChunk(source, name);
  const next = transform(part.chunk);
  return source.slice(0, part.start) + next + source.slice(part.end);
}

function extractSection(chunk, startToken) {
  const start = chunk.indexOf(startToken);
  if (start < 0) throw new Error(MARKER + ': section missing ' + startToken);
  const end = chunk.indexOf('</section>', start);
  if (end < 0) throw new Error(MARKER + ': section end missing ' + startToken);
  return { start, end: end + '</section>'.length, source: chunk.slice(start, end + '</section>'.length) };
}

if (!app.includes(MARKER)) {
  const anchor = 'const MEDIA_MASTER_EDITOR_V54 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V54 marker missing');

  const helpers = String.raw`
function normalizeLookMediaV55(entity) {
  const items = [];
  const seen = new Set();
  const add = (item) => {
    if (!item) return;
    const src = typeof item === 'string' ? item : item.src || item.image || item.url || '';
    const id = typeof item === 'object' ? item.id || item.catalogId || '' : '';
    const key = id ? 'id:' + id : src ? 'src:' + src : '';
    if (!key || seen.has(key)) return;
    seen.add(key);
    const kind = typeof item === 'object' && item.kind ? item.kind : /\.(mp4|webm|mov)(\?|$)/i.test(src) ? 'video' : /\.svg(\?|$)/i.test(src) ? 'svg' : 'image';
    items.push({ id: id || 'LOOK-MEDIA-' + (items.length + 1), catalogId: typeof item === 'object' ? item.catalogId || item.id || '' : '', src, kind, name: typeof item === 'object' ? item.name || item.file || '' : '' });
  };
  (entity?.mediaItems || []).forEach(add);
  (entity?.images || []).forEach(add);
  if (entity?.image) add(entity.image);
  (entity?.mediaIds || []).forEach((id) => {
    const linked = CONTENT.find((item) => String(item.id) === String(id) && item.kind !== 'look');
    if (linked) add({ ...linked, catalogId: linked.id });
  });
  return items;
}

function lookMediaFromCatalogV55(id) {
  const entity = CONTENT.find((item) => String(item.id) === String(id) && item.kind !== 'look');
  if (!entity) return null;
  const src = entity.src || entity.image || entity.images?.[0] || '';
  if (!src) return null;
  return { id: entity.id, catalogId: entity.id, src, kind: entity.kind || 'image', name: entity.name || entity.file || entity.id };
}

function productSeoInitialV55(entity) {
  return {
    title: entity?.seoTitle || entity?.seo?.title || entity?.name || '',
    h1: entity?.seoH1 || entity?.seo?.h1 || entity?.name || '',
    description: entity?.seoDescription || entity?.seo?.description || '',
    slug: entity?.seoSlug || entity?.seo?.slug || String(entity?.id || '').toLowerCase(),
    canonical: entity?.seoCanonical || entity?.seo?.canonical || '',
    index: entity?.seoIndex !== false && entity?.seo?.index !== false,
  };
}
`;
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // PRODUCT: third SEO tab + guaranteed vertical scroll.
  app = replaceFunction(app, 'ProductMasterDataModal', (chunk) => {
    const lifecycleAnchor = '  const lifecycle = productLifecycleV52(viewEntity);';
    if (!chunk.includes(lifecycleAnchor)) throw new Error(MARKER + ': product lifecycle anchor missing');
    chunk = chunk.replace(lifecycleAnchor, lifecycleAnchor + String.raw`
  const [productSeoDraftsV55, setProductSeoDraftsV55] = useState({});
  const productSeoV55 = productSeoDraftsV55[viewEntity.id] || productSeoInitialV55(viewEntity);
  const patchProductSeoV55 = (patch) => setProductSeoDraftsV55((current) => ({ ...current, [viewEntity.id]: { ...(current[viewEntity.id] || productSeoInitialV55(viewEntity)), ...patch } }));
  const saveProductSeoV55 = () => {
    const seo = productSeoDraftsV55[viewEntity.id] || productSeoInitialV55(viewEntity);
    viewEntity.seoTitle = seo.title.trim();
    viewEntity.seoH1 = seo.h1.trim();
    viewEntity.seoDescription = seo.description.trim();
    viewEntity.seoSlug = seo.slug.trim();
    viewEntity.seoCanonical = seo.canonical.trim();
    viewEntity.seoIndex = seo.index;
    viewEntity.seo = { ...(viewEntity.seo || {}), title: viewEntity.seoTitle, h1: viewEntity.seoH1, description: viewEntity.seoDescription, slug: viewEntity.seoSlug, canonical: viewEntity.seoCanonical, index: viewEntity.seoIndex };
  };`);

    const navAnchor = `<button className={activeTabV52 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV52('relations')}><span>Связи SKU</span><em>{publications.length}</em></button>`;
    if (!chunk.includes(navAnchor)) throw new Error(MARKER + ': product nav anchor missing');
    chunk = chunk.replace(navAnchor, navAnchor + `\n        <button className={activeTabV52 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV52('seo')}><span>SEO</span></button>`);

    const branchAnchor = `</> : <section className="sku-relations-v52">`;
    if (!chunk.includes(branchAnchor)) throw new Error(MARKER + ': product branch anchor missing');
    chunk = chunk.replace(branchAnchor, `</> : activeTabV52 === 'relations' ? <section className="sku-relations-v52">`);

    const lastClose = chunk.lastIndexOf('</section>}');
    if (lastClose < 0) throw new Error(MARKER + ': product relation close missing');
    const seo = String.raw`</section> : <section className="product-seo-tab-v55">
          <div className="master-section-title product-seo-head-v55"><div><span>SEO</span><strong>SEO карточки товара</strong></div><span>{viewEntity.id + ' · ' + (viewEntity.color || 'цвет не указан')}</span></div>
          <div className="product-seo-grid-v55">
            <label><span>SEO Title</span><input value={productSeoV55.title} maxLength={70} onChange={(event) => patchProductSeoV55({ title: event.target.value })}/><small>{productSeoV55.title.length}/70</small></label>
            <label><span>H1</span><input value={productSeoV55.h1} maxLength={80} onChange={(event) => patchProductSeoV55({ h1: event.target.value })}/><small>{productSeoV55.h1.length}/80</small></label>
            <label className="wide"><span>Description</span><textarea value={productSeoV55.description} maxLength={180} onChange={(event) => patchProductSeoV55({ description: event.target.value })}/><small>{productSeoV55.description.length}/180</small></label>
            <label><span>URL / slug</span><input value={productSeoV55.slug} onChange={(event) => patchProductSeoV55({ slug: event.target.value })}/></label>
            <label><span>Canonical</span><input value={productSeoV55.canonical} placeholder="https://..." onChange={(event) => patchProductSeoV55({ canonical: event.target.value })}/></label>
            <label className="product-seo-index-v55"><span>Индексация</span><button className={productSeoV55.index ? 'active' : ''} onClick={() => patchProductSeoV55({ index: !productSeoV55.index })}><i/>{productSeoV55.index ? 'INDEX' : 'NOINDEX'}</button></label>
          </div>
          <div className="product-seo-actions-v55"><span>SEO сохраняется для текущего цветового SKU.</span><button onClick={saveProductSeoV55}>Сохранить SEO</button></div>
        </section>}`;
    chunk = chunk.slice(0, lastClose) + seo + chunk.slice(lastClose + '</section>}'.length);
    return chunk;
  });

  // LOOK: editable media composition + dedicated SEO tab.
  app = replaceFunction(app, 'LookMasterDataModalV53', (chunk) => {
    const seoPart = extractSection(chunk, '<section className="look-seo-v53">');
    chunk = chunk.slice(0, seoPart.start) + chunk.slice(seoPart.end);

    const imageStateStart = `  const [savedV53, setSavedV53] = useState(false);\n  const images = entity?.images?.length ? entity.images : entity?.image ? [entity.image] : [];\n  const [activeImageV53, setActiveImageV53] = useState(0);\n  const activeImage = images[Math.min(activeImageV53, Math.max(0, images.length - 1))] || '';`;
    if (!chunk.includes(imageStateStart)) throw new Error(MARKER + ': look image state anchor missing');
    chunk = chunk.replace(imageStateStart, String.raw`  const [savedV53, setSavedV53] = useState(false);
  const [draftLookMediaV55, setDraftLookMediaV55] = useState(() => normalizeLookMediaV55(entity));
  const [activeImageV53, setActiveImageV53] = useState(0);
  const activeLookMediaV55 = draftLookMediaV55[Math.min(activeImageV53, Math.max(0, draftLookMediaV55.length - 1))] || null;
  const images = draftLookMediaV55.map((item) => item.src);
  const activeImage = activeLookMediaV55?.src || '';`);

    const beforeSave = '  const saveLook = () => {';
    if (!chunk.includes(beforeSave)) throw new Error(MARKER + ': look save anchor missing');
    chunk = chunk.replace(beforeSave, String.raw`  const addLookMediaV55 = (items, replaceCurrent = false) => {
    if (!items?.length) return;
    setDraftLookMediaV55((current) => {
      const next = [...current];
      if (replaceCurrent && next.length) next[Math.min(activeImageV53, next.length - 1)] = items[0];
      else items.forEach((item) => { if (!next.some((currentItem) => (item.catalogId && currentItem.catalogId === item.catalogId) || (item.src && currentItem.src === item.src))) next.push(item); });
      return next;
    });
    if (!replaceCurrent) setActiveImageV53((current) => Math.max(current, draftLookMediaV55.length));
    setSavedV53(false);
  };
  const uploadLookMediaV55 = (event, replaceCurrent = false) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const items = files.map((file, index) => ({ id: 'UPLOAD-' + Date.now() + '-' + index, catalogId: '', src: URL.createObjectURL(file), kind: mediaKindFromFileV54(file, 'image'), name: file.name, file }));
    addLookMediaV55(items, replaceCurrent);
    event.target.value = '';
  };
  const dropLookMediaV55 = (event, targetIndex = null) => {
    event.preventDefault();
    event.stopPropagation();
    const internal = event.dataTransfer.getData('application/x-look-media-v55');
    if (internal !== '') {
      const from = Number(internal);
      const to = targetIndex == null ? Math.max(0, draftLookMediaV55.length - 1) : Number(targetIndex);
      if (Number.isFinite(from) && Number.isFinite(to) && from !== to) {
        setDraftLookMediaV55((current) => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
        setActiveImageV53(to);
        setSavedV53(false);
      }
      return;
    }
    const entityId = event.dataTransfer.getData('text/plain');
    const media = lookMediaFromCatalogV55(entityId);
    if (!media) return;
    if (targetIndex == null) addLookMediaV55([media], false);
    else {
      setDraftLookMediaV55((current) => current.map((item, index) => index === targetIndex ? media : item));
      setActiveImageV53(targetIndex);
      setSavedV53(false);
    }
  };
  const removeLookMediaV55 = (index) => {
    setDraftLookMediaV55((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveImageV53((current) => Math.max(0, Math.min(current, draftLookMediaV55.length - 2)));
    setSavedV53(false);
  };

  const saveLook = () => {`);

    const saveAnchor = `    entity.stockTotal = totalStock;`;
    if (!chunk.includes(saveAnchor)) throw new Error(MARKER + ': look save body anchor missing');
    chunk = chunk.replace(saveAnchor, saveAnchor + String.raw`
    entity.mediaItems = draftLookMediaV55.map((item) => ({ id: item.id, catalogId: item.catalogId || '', src: item.src, kind: item.kind, name: item.name || '' }));
    entity.mediaIds = draftLookMediaV55.map((item) => item.catalogId).filter(Boolean);
    entity.images = draftLookMediaV55.filter((item) => item.kind !== 'video').map((item) => item.src);
    entity.image = entity.images[0] || '';`);

    const visualStart = chunk.indexOf('<div className="look-master-visual-v53">');
    const visualEnd = chunk.indexOf('<div className="look-master-composition-v53">', visualStart);
    if (visualStart < 0 || visualEnd < 0) throw new Error(MARKER + ': look visual boundaries missing');
    const visual = String.raw`<div className="look-master-visual-v53 look-media-editor-v55" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={(event) => dropLookMediaV55(event)}>
              <div className="look-media-toolbar-v55">
                <div><span>МЕДИА ОБРАЗА</span><strong>{draftLookMediaV55.length} файлов</strong></div>
                <div><label><Plus size={13}/>Добавить<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={(event) => uploadLookMediaV55(event, false)}/></label><label>Заменить текущее<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={(event) => uploadLookMediaV55(event, true)}/></label></div>
              </div>
              <div className="look-master-hero-v53 look-media-hero-v55">{activeLookMediaV55 ? activeLookMediaV55.kind === 'video' ? <video src={activeLookMediaV55.src} controls/> : <img src={activeLookMediaV55.src} alt={draftName}/> : <div><ImageIcon size={30}/><span>Перетащите медиа из правой панели или загрузите файл</span></div>}<span className="look-media-hero-index-v55">{draftLookMediaV55.length ? (activeImageV53 + 1) + ' / ' + draftLookMediaV55.length : '0'}</span></div>
              <div className="look-media-thumbs-v55">{draftLookMediaV55.map((media, index) => <div key={media.id + '-' + index} className={'look-media-thumb-v55 ' + (index === activeImageV53 ? 'active' : '')} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-look-media-v55', String(index)); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }} onDrop={(event) => dropLookMediaV55(event, index)}><button onClick={() => setActiveImageV53(index)}>{media.kind === 'video' ? <video src={media.src} muted/> : <img src={media.src} alt=""/>}</button><button className="look-media-remove-v55" onClick={() => removeLookMediaV55(index)} title="Удалить медиа"><X size={11}/></button><span>{index + 1}</span></div>)}<label className="look-media-add-tile-v55"><Plus size={17}/><span>Добавить</span><input type="file" multiple accept="image/*,video/mp4,video/webm" onChange={(event) => uploadLookMediaV55(event, false)}/></label></div>
              <small className="look-media-drop-hint-v55">Медиа можно менять местами, заменять загрузкой или перетаскивать из правой панели</small>
            </div>

            `;
    chunk = chunk.slice(0, visualStart) + visual + chunk.slice(visualEnd);

    const navAnchor = `<button className={activeTabV53 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV53('relations')}>Связи образа <em>{publications.length}</em></button>`;
    if (!chunk.includes(navAnchor)) throw new Error(MARKER + ': look nav anchor missing');
    chunk = chunk.replace(navAnchor, navAnchor + `\n        <button className={activeTabV53 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV53('seo')}>SEO</button>`);

    const branchAnchor = `</> : <section className="look-relations-v53">`;
    if (!chunk.includes(branchAnchor)) throw new Error(MARKER + ': look branch anchor missing');
    chunk = chunk.replace(branchAnchor, `</> : activeTabV53 === 'relations' ? <section className="look-relations-v53">`);
    const lastClose = chunk.lastIndexOf('</section>}');
    if (lastClose < 0) throw new Error(MARKER + ': look relation close missing');
    chunk = chunk.slice(0, lastClose) + '</section> : ' + seoPart.source + '}' + chunk.slice(lastClose + '</section>}'.length);
    return chunk;
  });

  // MEDIA: move SEO from main tab to its own tab, preserving link builder and save action.
  app = replaceFunction(app, 'MediaMasterDataModalV54', (chunk) => {
    const seoPart = extractSection(chunk, '<section className="media-seo-v54">');
    chunk = chunk.slice(0, seoPart.start) + chunk.slice(seoPart.end);

    const navAnchor = `<button className={activeTabV54 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV54('relations')}>Связи медиа <em>{publications.length}</em></button>`;
    if (!chunk.includes(navAnchor)) throw new Error(MARKER + ': media nav anchor missing');
    chunk = chunk.replace(navAnchor, navAnchor + `\n        <button className={activeTabV54 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV54('seo')}>SEO</button>`);

    const branchAnchor = `</> : <section className="media-relations-v54">`;
    if (!chunk.includes(branchAnchor)) throw new Error(MARKER + ': media branch anchor missing');
    chunk = chunk.replace(branchAnchor, `</> : activeTabV54 === 'relations' ? <section className="media-relations-v54">`);
    const lastClose = chunk.lastIndexOf('</section>}');
    if (lastClose < 0) throw new Error(MARKER + ': media relation close missing');
    chunk = chunk.slice(0, lastClose) + '</section> : ' + seoPart.source + '}' + chunk.slice(lastClose + '</section>}'.length);
    return chunk;
  });

  // STOREFRONT: every filled slot is draggable. Dropping on another filled slot swaps; dropping on empty moves.
  app = replaceFunction(app, 'Slot', (chunk) => {
    chunk = chunk.replace('function Slot({ slot, region, onDrop, onUnpin })', 'function Slot({ slot, sectionId, region, onDrop, onUnpin })');
    const root = `<div className={\`lego-slot \${slot.entity ? 'filled' : 'empty'} \${slot.status}\`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>`;
    if (!chunk.includes(root)) throw new Error(MARKER + ': slot root anchor missing');
    const nextRoot = `<div className={\`lego-slot \${slot.entity ? 'filled' : 'empty'} \${slot.status} \${slot.entity ? 'slot-draggable-v55' : ''}\`} draggable={Boolean(slot.entity)} onDragStart={(event) => { if (!slot.entity) return; event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-storefront-slot-v55', JSON.stringify({ sectionId, slotIndex: slot.index, entityId: slot.entity.id, status: slot.status })); event.dataTransfer.setData('text/plain', slot.entity.id); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = event.dataTransfer.types.includes('application/x-storefront-slot-v55') ? 'move' : 'copy'; }} onDragEnter={(event) => { event.preventDefault(); event.currentTarget.classList.add('slot-drag-over-v55'); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.classList.remove('slot-drag-over-v55'); }} onDrop={(event) => { event.currentTarget.classList.remove('slot-drag-over-v55'); onDrop(event); }}>`;
    chunk = chunk.replace(root, nextRoot);
    return chunk;
  });

  app = replaceFunction(app, 'SectionCanvas', (chunk) => {
    const oldDrop = /  const onDrop = \(event, slotIndex\) => \{[^\n]*\};/;
    if (!oldDrop.test(chunk)) throw new Error(MARKER + ': SectionCanvas onDrop anchor missing');
    chunk = chunk.replace(oldDrop, String.raw`  const onDrop = (event, slotIndex) => {
    event.preventDefault();
    event.stopPropagation();
    const storefrontPayload = event.dataTransfer.getData('application/x-storefront-slot-v55');
    if (storefrontPayload) {
      try {
        const source = JSON.parse(storefrontPayload);
        if (source.sectionId === section.id && Number(source.slotIndex) === Number(slotIndex)) return;
        const targetSlot = (section.resolvedSlots || []).find((item) => Number(item.index) === Number(slotIndex));
        const targetEntityId = targetSlot?.entity?.id || null;
        if (targetEntityId) onPin(source.sectionId, Number(source.slotIndex), targetEntityId);
        else onUnpin(source.sectionId, Number(source.slotIndex));
        onPin(section.id, Number(slotIndex), source.entityId);
        return;
      } catch (error) {
        console.warn('Не удалось перенести слот', error);
      }
    }
    const id = event.dataTransfer.getData('text/plain');
    if (id) onPin(section.id, slotIndex, id);
  };`);
    chunk = chunk.replaceAll('<Slot slot={slot} region={region}', '<Slot sectionId={section.id} slot={slot} region={region}');
    return chunk;
  });

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* master-tabs-media-dnd-v55 */')) {
  css += String.raw`
/* master-tabs-media-dnd-v55 */
/* All three master modals use the same information architecture and own their vertical scroll. */
.product-master-modal-v52{height:min(920px,94vh)!important;max-height:94vh!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.product-master-scroll-v52{flex:1!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;padding-bottom:56px!important}
.product-master-tabs-v52,.look-master-tabs-v53,.media-master-tabs-v54{overflow-x:auto!important;scrollbar-width:none!important;white-space:nowrap!important}
.product-master-tabs-v52::-webkit-scrollbar,.look-master-tabs-v53::-webkit-scrollbar,.media-master-tabs-v54::-webkit-scrollbar{display:none!important}

/* Product SEO */
.product-seo-tab-v55{max-width:980px;margin:0 auto;padding:4px 0 40px}
.product-seo-head-v55{margin-bottom:24px!important}.product-seo-grid-v55{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 32px}.product-seo-grid-v55 label{display:grid;gap:7px;position:relative}.product-seo-grid-v55 label>span{font-size:8px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#666}.product-seo-grid-v55 input{height:42px;border:0;border-bottom:1px solid #bdbdbd;background:#fff;padding:0 2px;font-size:12px;outline:none;border-radius:0}.product-seo-grid-v55 textarea{min-height:110px;border:0;border-bottom:1px solid #bdbdbd;padding:9px 2px;resize:vertical;font:inherit;font-size:12px;outline:none}.product-seo-grid-v55 input:focus,.product-seo-grid-v55 textarea:focus{border-bottom-color:#111}.product-seo-grid-v55 .wide{grid-column:1/-1}.product-seo-grid-v55 label>small{position:absolute;right:0;bottom:-14px;font-size:8px;color:#999}.product-seo-index-v55{align-content:end}.product-seo-index-v55 button{width:max-content;height:36px;border:1px solid #bbb;background:#fff;padding:0 12px;display:flex;align-items:center;gap:8px;font-size:9px}.product-seo-index-v55 button i{width:7px;height:7px;border-radius:50%;background:#999}.product-seo-index-v55 button.active i{background:#2e7d32}.product-seo-actions-v55{margin-top:34px;padding-top:18px;border-top:1px solid #e5e5e5;display:flex;align-items:center;justify-content:space-between;gap:16px}.product-seo-actions-v55 span{font-size:9px;color:#777}.product-seo-actions-v55 button{height:36px;padding:0 15px;border:1px solid #111;background:#111;color:#fff;font-size:9px;font-weight:600}

/* Look media editor */
.look-media-editor-v55{display:grid!important;gap:12px!important;align-content:start!important;min-width:0}.look-media-toolbar-v55{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}.look-media-toolbar-v55>div:first-child{display:grid;gap:2px}.look-media-toolbar-v55>div:first-child span{font-size:8px;letter-spacing:.07em;color:#777}.look-media-toolbar-v55>div:first-child strong{font-size:13px;font-weight:500}.look-media-toolbar-v55>div:last-child{display:flex;gap:6px}.look-media-toolbar-v55 label{height:32px;padding:0 9px;border:1px solid #bbb;background:#fff;display:flex;align-items:center;gap:5px;font-size:8px;font-weight:600;cursor:pointer}.look-media-toolbar-v55 label:first-child{background:#111;color:#fff;border-color:#111}.look-media-toolbar-v55 label input,.look-media-add-tile-v55 input{display:none}.look-media-hero-v55{position:relative!important;width:100%!important;aspect-ratio:2/3!important;max-height:500px!important;background:#f6f6f4!important;overflow:hidden!important}.look-media-hero-v55 img,.look-media-hero-v55 video{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}.look-media-hero-index-v55{position:absolute;right:8px;bottom:8px;padding:5px 7px;background:rgba(255,255,255,.92);font-size:8px;color:#111}.look-media-thumbs-v55{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.look-media-thumb-v55{position:relative;aspect-ratio:2/3;border:1px solid transparent;background:#f6f6f4;overflow:hidden}.look-media-thumb-v55.active{border-color:#111}.look-media-thumb-v55>button:first-child{position:absolute;inset:0;border:0;background:transparent;padding:0}.look-media-thumb-v55 img,.look-media-thumb-v55 video{width:100%;height:100%;object-fit:cover;display:block}.look-media-thumb-v55>span{position:absolute;left:5px;bottom:4px;padding:2px 4px;background:rgba(255,255,255,.9);font-size:7px}.look-media-remove-v55{position:absolute!important;right:3px!important;top:3px!important;width:22px!important;height:22px!important;border:0!important;background:rgba(255,255,255,.94)!important;display:grid!important;place-items:center!important;z-index:3!important}.look-media-add-tile-v55{aspect-ratio:2/3;border:1px dashed #aaa;background:#faf9f7;display:grid;place-items:center;align-content:center;gap:5px;cursor:pointer;color:#666}.look-media-add-tile-v55 span{font-size:8px}.look-media-drop-hint-v55{font-size:8px;color:#888;line-height:1.4}.look-seo-v53{margin-top:0!important;padding-top:4px!important;border-top:0!important;max-width:980px;margin-left:auto!important;margin-right:auto!important}

/* Media SEO is now a full tab, not a subsection of Media. */
.media-seo-v54{margin-top:0!important;padding-top:4px!important;border-top:0!important;max-width:980px;margin-left:auto!important;margin-right:auto!important}

/* Cross-section slot DnD */
.lego-slot.slot-draggable-v55{cursor:grab!important}.lego-slot.slot-draggable-v55:active{cursor:grabbing!important}.lego-slot.slot-drag-over-v55{outline:1px solid #111!important;outline-offset:-1px!important}.lego-slot.slot-drag-over-v55:after{content:'Переместить сюда';position:absolute;left:50%;top:50%;z-index:60;transform:translate(-50%,-50%);padding:7px 10px;background:rgba(17,17,17,.9);color:#fff;font-size:8px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;pointer-events:none;white-space:nowrap}.lego-slot.slot-draggable-v55[draggable="true"] .merch-card-media img,.lego-slot.slot-draggable-v55[draggable="true"] .merch-card-media video{user-select:none;-webkit-user-drag:none}

@media(max-width:900px){.product-seo-grid-v55{grid-template-columns:1fr}.product-seo-grid-v55 .wide{grid-column:auto}.look-media-thumbs-v55{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.product-master-modal-v52{width:100vw!important;height:100vh!important;max-height:none!important}.product-master-scroll-v52{padding-bottom:70px!important}.product-seo-tab-v55{padding:0 0 28px}.look-media-toolbar-v55{align-items:stretch;flex-direction:column}.look-media-toolbar-v55>div:last-child{width:100%}.look-media-toolbar-v55 label{flex:1;justify-content:center}.look-media-thumbs-v55{grid-template-columns:repeat(3,minmax(0,1fr))}.product-seo-actions-v55{align-items:stretch;flex-direction:column}.product-seo-actions-v55 button{width:100%}}
`;
  writeFileSync(cssPath, css);
}

console.log('Master tabs + editable look media + cross-section slot DnD V55 applied');
