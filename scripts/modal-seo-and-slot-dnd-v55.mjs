import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'MODAL_SEO_AND_SLOT_DND_V55';

function replaceInChunk(source, startToken, endToken, transform, label) {
  const start = source.indexOf(startToken);
  const end = start >= 0 ? source.indexOf(endToken, start + startToken.length) : -1;
  if (start < 0 || end < 0) throw new Error('V55: ' + label + ' boundaries missing');
  const chunk = source.slice(start, end);
  return source.slice(0, start) + transform(chunk) + source.slice(end);
}

function extractSimpleSection(chunk, className, label) {
  const startToken = '<section className="' + className + '">';
  const start = chunk.indexOf(startToken);
  if (start < 0) throw new Error('V55: ' + label + ' section missing');
  const end = chunk.indexOf('</section>', start);
  if (end < 0) throw new Error('V55: ' + label + ' section end missing');
  return { start, end: end + '</section>'.length, source: chunk.slice(start, end + '</section>'.length) };
}

if (!app.includes(MARKER)) {
  const anchor = 'const MEDIA_MASTER_EDITOR_V54 = true;';
  if (!app.includes(anchor)) throw new Error('V55: V54 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // ---------------------------------------------------------------------------
  // PRODUCT: third SEO tab + independently scrollable modal body.
  // ---------------------------------------------------------------------------
  const productSeoHelper = String.raw`
function ProductSeoPanelV55({ entity }) {
  const [title, setTitle] = useState(entity?.seoTitle || entity?.seo?.title || entity?.name || '');
  const [h1, setH1] = useState(entity?.seoH1 || entity?.seo?.h1 || entity?.name || '');
  const [description, setDescription] = useState(entity?.seoDescription || entity?.seo?.description || '');
  const [slug, setSlug] = useState(entity?.seoSlug || entity?.seo?.slug || String(entity?.id || '').toLowerCase());
  const [canonical, setCanonical] = useState(entity?.seoCanonical || entity?.seo?.canonical || '');
  const [indexable, setIndexable] = useState(entity?.seoIndex !== false && entity?.seo?.index !== false);
  const [saved, setSaved] = useState(false);
  const save = () => {
    entity.seoTitle = title.trim();
    entity.seoH1 = h1.trim();
    entity.seoDescription = description.trim();
    entity.seoSlug = slug.trim();
    entity.seoCanonical = canonical.trim();
    entity.seoIndex = indexable;
    entity.seo = { ...(entity.seo || {}), title: entity.seoTitle, h1: entity.seoH1, description: entity.seoDescription, slug: entity.seoSlug, canonical: entity.seoCanonical, index: entity.seoIndex };
    setSaved(true);
  };
  const touch = (setter) => (event) => { setter(event.target.value); setSaved(false); };
  return <section className="product-seo-v55">
    <div className="v55-seo-head"><div><span>SEO · PRODUCT</span><strong>SEO карточки товара</strong><small>{entity.id} · настройки конкретного цветового SKU</small></div><em>{saved ? 'Сохранено' : 'Изменения не сохранены'}</em></div>
    <div className="v55-seo-grid">
      <label><span>SEO Title</span><input value={title} maxLength={70} onChange={touch(setTitle)}/><small>{title.length}/70</small></label>
      <label><span>H1</span><input value={h1} maxLength={90} onChange={touch(setH1)}/><small>{h1.length}/90</small></label>
      <label className="wide"><span>Description</span><textarea value={description} maxLength={180} onChange={touch(setDescription)}/><small>{description.length}/180</small></label>
      <label><span>URL / slug</span><input value={slug} onChange={touch(setSlug)}/></label>
      <label><span>Canonical URL</span><input value={canonical} placeholder="https://..." onChange={touch(setCanonical)}/></label>
      <label className="v55-index"><span>Индексация</span><button className={indexable ? 'active' : ''} onClick={() => { setIndexable((value) => !value); setSaved(false); }}><i/>{indexable ? 'INDEX' : 'NOINDEX'}</button></label>
    </div>
    <div className="v55-seo-actions"><button className="primary" onClick={save}>Сохранить SEO</button></div>
  </section>;
}

`;
  const productModalIndex = app.indexOf('function ProductMasterDataModal(');
  if (productModalIndex < 0) throw new Error('V55: ProductMasterDataModal missing');
  app = app.slice(0, productModalIndex) + productSeoHelper + app.slice(productModalIndex);

  app = replaceInChunk(app, 'function ProductMasterDataModal(', 'function EditableEntityModal(', (chunk) => {
    if (!chunk.includes('>Связи SKU')) throw new Error('V55: product relations tab missing');
    chunk = chunk.replace(
      /(<button className=\{activeTabV52 === 'relations'[\s\S]*?<\/button>)/,
      `$1\n        <button className={activeTabV52 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV52('seo')}><span>SEO</span></button>`
    );
    chunk = chunk.replace('} : <section className="sku-relations-v52">', '} : activeTabV52 === \'relations\' ? <section className="sku-relations-v52">');
    const tail = chunk.lastIndexOf('</section>}');
    if (tail < 0) throw new Error('V55: product relation tail missing');
    chunk = chunk.slice(0, tail) + '</section> : <ProductSeoPanelV55 key={viewEntity.id} entity={viewEntity}/>}' + chunk.slice(tail + '</section>}'.length);
    return chunk;
  }, 'product modal');

  // ---------------------------------------------------------------------------
  // LOOK: move SEO to third tab; add editable/reorderable look media.
  // Product composition drag/drop from right browser already exists in V53.
  // ---------------------------------------------------------------------------
  app = replaceInChunk(app, 'function LookMasterDataModalV53(', 'function EditableEntityModal(', (chunk) => {
    const seo = extractSimpleSection(chunk, 'look-seo-v53', 'look SEO');
    const seoSource = seo.source;
    chunk = chunk.slice(0, seo.start) + chunk.slice(seo.end);

    chunk = chunk.replace(
      "const images = entity?.images?.length ? entity.images : entity?.image ? [entity.image] : [];",
      String.raw`const initialLookMediaV55 = Array.isArray(entity?.lookMediaItems) && entity.lookMediaItems.length
    ? entity.lookMediaItems.map((item) => typeof item === 'string' ? { src: item, kind: 'image', name: '' } : item)
    : (entity?.images?.length ? entity.images : entity?.image ? [entity.image] : []).map((src) => ({ src, kind: 'image', name: '' }));
  const [draftLookMediaV55, setDraftLookMediaV55] = useState(() => initialLookMediaV55);
  const images = draftLookMediaV55.map((item) => item.src);`
    );

    const metricsAnchor = "const inStockRate = selectedProducts.length ? Math.round(inStockCount / selectedProducts.length * 100) : 0;";
    if (!chunk.includes(metricsAnchor)) throw new Error('V55: look metrics anchor missing');
    chunk = chunk.replace(metricsAnchor, metricsAnchor + String.raw`
  const activeLookMediaV55 = draftLookMediaV55[Math.min(activeImageV53, Math.max(0, draftLookMediaV55.length - 1))] || null;
  const addLookFilesV55 = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const next = files.map((file) => ({ src: URL.createObjectURL(file), kind: mediaKindFromFileV54(file, 'image'), name: file.name, localFile: file }));
    setDraftLookMediaV55((current) => [...current, ...next]);
    setSavedV53(false);
    event.target.value = '';
  };
  const removeLookMediaV55 = (index) => {
    setDraftLookMediaV55((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveImageV53((current) => Math.max(0, Math.min(current, draftLookMediaV55.length - 2)));
    setSavedV53(false);
  };
  const swapLookMediaV55 = (from, to) => {
    if (from === to) return;
    setDraftLookMediaV55((current) => { const next = [...current]; const value = next[from]; next[from] = next[to]; next[to] = value; return next; });
    setActiveImageV53(to);
    setSavedV53(false);
  };
  const dropLookMediaV55 = (event, targetIndex = null) => {
    event.preventDefault();
    event.stopPropagation();
    const internal = event.dataTransfer.getData('application/x-look-media-v55');
    if (internal !== '' && targetIndex !== null) { swapLookMediaV55(Number(internal), targetIndex); return; }
    const id = event.dataTransfer.getData('text/plain');
    const media = CONTENT.find((item) => String(item.id) === String(id) && item.kind !== 'look');
    if (!media) return;
    const src = media.src || media.image || media.images?.[0] || '';
    if (!src) return;
    const item = { src, kind: media.kind || 'image', name: media.name || media.file || media.id, sourceId: media.id };
    setDraftLookMediaV55((current) => current.some((entry) => entry.src === src) ? current : [...current, item]);
    setSavedV53(false);
  };`
    );

    chunk = chunk.replace(
      "entity.productIds = cleanIds;",
      String.raw`entity.productIds = cleanIds;
    entity.lookMediaItems = draftLookMediaV55.map(({ src, kind, name, sourceId }) => ({ src, kind, name, sourceId }));
    entity.images = draftLookMediaV55.filter((item) => item.kind !== 'video').map((item) => item.src);
    entity.image = entity.images[0] || draftLookMediaV55[0]?.src || '';`
    );

    chunk = chunk.replace(
      /<div className="look-master-thumbs-v53">[\s\S]*?<\/div>\n\s*<div className="look-master-hero-v53">[\s\S]*?<\/div>/,
      String.raw`<div className="look-master-media-tools-v55"><label><Plus size={13}/>Добавить медиа<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={addLookFilesV55}/></label><span>Также можно перетащить медиа из правой панели</span></div>
              <div className="look-master-thumbs-v53 look-master-thumbs-v55">{draftLookMediaV55.slice(0, 8).map((item, index) => <button key={(item.src || '') + index} className={index === activeImageV53 ? 'active' : ''} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-look-media-v55', String(index)); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropLookMediaV55(event, index)} onClick={() => setActiveImageV53(index)}>{item.kind === 'video' ? <video src={item.src} muted/> : <img src={item.src} alt=""/>}<span className="look-media-remove-v55" onClick={(event) => { event.stopPropagation(); removeLookMediaV55(index); }}><X size={10}/></span></button>)}</div>
              <div className="look-master-hero-v53 look-master-hero-v55" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={(event) => dropLookMediaV55(event)}>{activeLookMediaV55 ? activeLookMediaV55.kind === 'video' ? <video src={activeLookMediaV55.src} controls/> : <img src={activeLookMediaV55.src} alt={draftName}/> : <div><ImageIcon size={30}/><span>Перетащите или загрузите медиа</span></div>}</div>`
    );

    chunk = chunk.replace(/(<button className=\{activeTabV53 === 'relations'[\s\S]*?<\/button>)/, `$1\n        <button className={activeTabV53 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV53('seo')}>SEO</button>`);
    chunk = chunk.replace('</> : <section className="look-relations-v53', '</> : activeTabV53 === \'relations\' ? <section className="look-relations-v53');
    const tail = chunk.lastIndexOf('</section>}');
    if (tail < 0) throw new Error('V55: look relation tail missing');
    chunk = chunk.slice(0, tail) + '</section> : ' + seoSource + '}' + chunk.slice(tail + '</section>}'.length);
    return chunk;
  }, 'look modal');

  // ---------------------------------------------------------------------------
  // MEDIA: move SEO to third tab; keep upload/link/metrics in Media tab.
  // ---------------------------------------------------------------------------
  app = replaceInChunk(app, 'function MediaMasterDataModalV54(', 'function EditableEntityModal(', (chunk) => {
    const seo = extractSimpleSection(chunk, 'media-seo-v54', 'media SEO');
    const seoSource = seo.source;
    chunk = chunk.slice(0, seo.start) + chunk.slice(seo.end);
    chunk = chunk.replace(/(<button className=\{activeTabV54 === 'relations'[\s\S]*?<\/button>)/, `$1\n        <button className={activeTabV54 === 'seo' ? 'active' : ''} onClick={() => setActiveTabV54('seo')}>SEO</button>`);
    chunk = chunk.replace('</> : <section className="media-relations-v54">', '</> : activeTabV54 === \'relations\' ? <section className="media-relations-v54">');
    const tail = chunk.lastIndexOf('</section>}');
    if (tail < 0) throw new Error('V55: media relation tail missing');
    chunk = chunk.slice(0, tail) + '</section> : ' + seoSource + '}' + chunk.slice(tail + '</section>}'.length);
    return chunk;
  }, 'media modal');

  // ---------------------------------------------------------------------------
  // STOREFRONT CANVAS: slot -> slot drag/drop, including between sections.
  // Filled target => swap. Empty target => move and leave explicit empty source.
  // Right-panel entities keep using text/plain and therefore remain copy-to-slot.
  // ---------------------------------------------------------------------------
  const unpinLine = app.match(/\n\s*const unpin = \(sectionId, slotIndex\) =>[^\n]+\n/);
  if (!unpinLine) throw new Error('V55: unpin handler missing');
  const moveHandler = String.raw`
  const moveSlotEntityV55 = ({ sourceSectionId, sourceSlotIndex, sourceEntityId, targetSectionId, targetSlotIndex, targetEntityId }) => {
    if (!sourceSectionId || !targetSectionId || sourceSlotIndex === undefined || targetSlotIndex === undefined) return;
    if (sourceSectionId === targetSectionId && Number(sourceSlotIndex) === Number(targetSlotIndex)) return;
    mutateSections((previous) => previous.map((section) => {
      if (section.id !== sourceSectionId && section.id !== targetSectionId) return section;
      const pins = { ...(section.pins || {}) };
      if (section.id === targetSectionId) pins[targetSlotIndex] = sourceEntityId;
      if (section.id === sourceSectionId) pins[sourceSlotIndex] = targetEntityId || '__EMPTY_SLOT_V55__';
      return { ...section, pins };
    }));
    setSelectedId(targetSectionId);
    setSelectedSlot({ sectionId: targetSectionId, slotIndex: Number(targetSlotIndex) });
    setToast(targetEntityId ? 'Содержимое слотов поменялось местами' : 'Контент перемещён в новый слот');
    setTimeout(() => setToast(''), 1400);
  };
`;
  app = app.replace(unpinLine[0], unpinLine[0] + moveHandler);

  app = replaceInChunk(app, 'function Slot(', 'function SectionCanvas(', (chunk) => {
    chunk = chunk.replace('function Slot({ slot, region, onDrop, onUnpin })', 'function Slot({ slot, sectionId, region, onDrop, onUnpin })');
    const rootNeedle = 'onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>';
    if (!chunk.includes(rootNeedle)) throw new Error('V55: Slot drag root anchor missing');
    chunk = chunk.replace(rootNeedle, String.raw`draggable={Boolean(slot.entity)} onDragStart={(event) => { if (!slot.entity) return; event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-storefront-slot-v55', JSON.stringify({ sectionId, slotIndex: slot.index, entityId: slot.entity.id })); event.dataTransfer.setData('text/plain', slot.entity.id); }} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/x-storefront-slot-v55') ? 'move' : 'copy'; }} onDrop={onDrop}>`);
    return chunk;
  }, 'Slot');

  app = replaceInChunk(app, 'function SectionCanvas(', 'function SectionNavigator', (chunk) => {
    chunk = chunk.replace('function SectionCanvas({ section, locale, region, selected, onSelect, onPin, onUnpin })', 'function SectionCanvas({ section, locale, region, selected, onSelect, onPin, onUnpin, onMove })');
    const oldDrop = "const onDrop = (event, slotIndex) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };";
    if (!chunk.includes(oldDrop)) throw new Error('V55: SectionCanvas onDrop anchor missing');
    chunk = chunk.replace(oldDrop, String.raw`const onDrop = (event, slotIndex) => {
    event.preventDefault();
    event.stopPropagation();
    const targetSlot = section.resolvedSlots.find((item) => Number(item.index) === Number(slotIndex));
    const sourcePayload = event.dataTransfer.getData('application/x-storefront-slot-v55');
    if (sourcePayload) {
      try {
        const source = JSON.parse(sourcePayload);
        onMove?.({ sourceSectionId: source.sectionId, sourceSlotIndex: Number(source.slotIndex), sourceEntityId: source.entityId, targetSectionId: section.id, targetSlotIndex: Number(slotIndex), targetEntityId: targetSlot?.entity?.id || null });
        return;
      } catch { /* fallback to library copy */ }
    }
    const id = event.dataTransfer.getData('text/plain');
    if (id) onPin(section.id, slotIndex, id);
  };`);
    chunk = chunk.replace(/<Slot slot=\{slot\} region=\{region\}/g, '<Slot slot={slot} sectionId={section.id} region={region}');
    return chunk;
  }, 'SectionCanvas');

  app = app.replace(/onUnpin=\{unpin\}(?!\s+onMove)/g, 'onUnpin={unpin} onMove={moveSlotEntityV55}');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* modal-seo-and-slot-dnd-v55 */')) {
  css += String.raw`
/* modal-seo-and-slot-dnd-v55 */
/* Product modal owns its scroll, even on shorter screens. */
.product-master-modal-v52{height:min(94vh,980px)!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
.product-master-scroll-v52{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;padding-bottom:44px!important}

/* Shared third SEO tab treatment. */
.product-master-tabs-v52,.look-master-tabs-v53,.media-master-tabs-v54{flex:0 0 auto!important}
.product-seo-v55{max-width:1000px;margin:0 auto;padding:4px 0 44px}
.v55-seo-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding-bottom:18px;border-bottom:1px solid #111;margin-bottom:24px}.v55-seo-head>div{display:grid;gap:4px}.v55-seo-head span{font-size:9px;letter-spacing:.08em;color:#777}.v55-seo-head strong{font-size:21px;font-weight:500}.v55-seo-head small,.v55-seo-head em{font-size:9px;color:#888;font-style:normal}.v55-seo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px}.v55-seo-grid label{display:grid;gap:7px;position:relative}.v55-seo-grid label>span{font-size:8px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#666}.v55-seo-grid input,.v55-seo-grid textarea{border:0;border-bottom:1px solid #bbb;background:#fff;border-radius:0;outline:none;font:inherit;font-size:12px;padding:0 2px}.v55-seo-grid input{height:40px}.v55-seo-grid textarea{min-height:96px;padding-top:9px;resize:vertical}.v55-seo-grid input:focus,.v55-seo-grid textarea:focus{border-bottom-color:#111}.v55-seo-grid .wide{grid-column:1/-1}.v55-seo-grid label>small{position:absolute;right:0;bottom:-14px;font-size:7px;color:#999}.v55-index{align-content:end}.v55-index button{height:36px;width:max-content;border:1px solid #bbb;background:#fff;padding:0 11px;display:flex;align-items:center;gap:8px;font-size:9px}.v55-index button i{width:7px;height:7px;border-radius:50%;background:#999}.v55-index button.active i{background:#2e7d32}.v55-seo-actions{display:flex;justify-content:flex-end;margin-top:30px}.v55-seo-actions button{height:38px;padding:0 16px;border:1px solid #111;background:#fff;font-size:10px;font-weight:600}.v55-seo-actions button.primary{background:#111;color:#fff}

/* Look media editor: upload, drag from Assets, reorder thumbnails. */
.look-master-media-tools-v55{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.look-master-media-tools-v55 label{height:34px;padding:0 10px;border:1px solid #111;background:#111;color:#fff;display:flex;align-items:center;gap:6px;font-size:9px;font-weight:600;cursor:pointer}.look-master-media-tools-v55 label input{display:none}.look-master-media-tools-v55>span{font-size:8px;color:#888;text-align:right}.look-master-thumbs-v55 button{position:relative!important;cursor:grab}.look-master-thumbs-v55 button:active{cursor:grabbing}.look-master-thumbs-v55 video{width:100%;height:100%;object-fit:cover}.look-media-remove-v55{position:absolute;right:3px;top:3px;width:18px;height:18px;background:rgba(255,255,255,.94);display:grid;place-items:center;border:1px solid rgba(17,17,17,.15);opacity:0}.look-master-thumbs-v55 button:hover .look-media-remove-v55{opacity:1}.look-master-hero-v55{outline:1px dashed transparent;outline-offset:-1px;transition:outline-color .12s ease}.look-master-hero-v55:hover{outline-color:#bbb}.look-master-hero-v55 video{width:100%;height:100%;object-fit:contain;background:#111}

/* Canvas content is draggable. Drag target gets a crisp AEM-like intent state. */
.lego-slot.filled[draggable="true"]{cursor:grab}.lego-slot.filled[draggable="true"]:active{cursor:grabbing}.lego-slot{transition:outline-color .12s ease,background .12s ease}.lego-slot:has(> .entity-product):hover,.lego-slot:has(> .entity-media):hover{outline:1px solid rgba(17,17,17,.22);outline-offset:-1px}

@media(max-width:720px){.v55-seo-grid{grid-template-columns:1fr}.v55-seo-grid .wide{grid-column:auto}.look-master-media-tools-v55{align-items:flex-start;flex-direction:column}.product-master-modal-v52{height:100vh!important;max-height:none!important}.product-master-scroll-v52{overflow-y:auto!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('V55 applied: separate SEO tabs, editable look media, cross-section slot drag/drop, product modal scroll');
