import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'LOOK_MASTER_EDITOR_V53';

if (!app.includes(MARKER)) {
  const anchor = 'const PRODUCT_MASTER_TABS_V52 = true;';
  if (!app.includes(anchor)) throw new Error('LOOK_MASTER_EDITOR_V53: V52 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const editableStart = app.indexOf('function EditableEntityModal(props) {');
  if (editableStart < 0) throw new Error('LOOK_MASTER_EDITOR_V53: EditableEntityModal missing');
  const legacyStart = app.indexOf('function LegacyEditableEntityModal(', editableStart);
  if (legacyStart < 0) throw new Error('LOOK_MASTER_EDITOR_V53: LegacyEditableEntityModal missing');

  const lookModal = String.raw`
function lookPageDescriptorsV53(nodes, locale = 'ru', trail = [], out = []) {
  (nodes || []).forEach((node) => {
    const label = nameFor(node, locale);
    const nextTrail = [...trail, label];
    if (node.page) out.push({ id: node.id, name: label, path: nextTrail.join(' / ') });
    if (node.children?.length) lookPageDescriptorsV53(node.children, locale, nextTrail, out);
  });
  return out;
}

function lookPublicationLocationsV53(entity, context) {
  if (!entity || !context?.siteTrees || !context?.pageSections) return [];
  const rows = [];
  Object.entries(context.siteTrees).forEach(([market, tree]) => {
    const pages = lookPageDescriptorsV53(tree, context.locale || 'ru');
    pages.forEach((page) => {
      const sections = context.pageSections?.[market]?.[page.id] || [];
      sections.forEach((section, sectionIndex) => {
        let resolved = null;
        try { resolved = resolveSection(section, market, null); } catch { resolved = null; }
        (resolved?.resolvedSlots || []).forEach((slot) => {
          if (String(slot?.entity?.id || '') !== String(entity.id)) return;
          rows.push({
            key: [market, page.id, section.id, slot.index].join(':'),
            market,
            pageId: page.id,
            pageName: page.name,
            pagePath: page.path,
            sectionId: section.id,
            sectionIndex,
            sectionName: section.titles?.[context.locale] || section.titles?.ru || 'Секция ' + (sectionIndex + 1),
            slotIndex: Number(slot.index || 0),
            placementType: slot.status === 'auto' ? 'AUTO' : 'PIN',
          });
        });
      });
    });
  });
  return Array.from(new Map(rows.map((row) => [row.key, row])).values()).sort((a, b) => {
    const aCurrent = a.market === context.region && a.pageId === context.pageId ? 0 : a.market === context.region ? 1 : 2;
    const bCurrent = b.market === context.region && b.pageId === context.pageId ? 0 : b.market === context.region ? 1 : 2;
    if (aCurrent !== bCurrent) return aCurrent - bCurrent;
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    if (a.pagePath !== b.pagePath) return a.pagePath.localeCompare(b.pagePath, 'ru');
    if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex;
    return a.slotIndex - b.slotIndex;
  });
}

function lookStockV53(product, region) {
  return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);
}

function LookMasterDataModalV53({ entity, region = 'RU', onClose }) {
  const initialIds = Array.isArray(entity?.productIds) ? entity.productIds : [];
  const minimumSlots = Math.max(6, initialIds.length);
  const [activeTabV53, setActiveTabV53] = useState('look');
  const [draftProductIds, setDraftProductIds] = useState(() => Array.from({ length: minimumSlots }, (_, index) => initialIds[index] || null));
  const [draftName, setDraftName] = useState(entity?.name || '');
  const [draftNameEn, setDraftNameEn] = useState(entity?.nameEn || '');
  const [draftDepartment, setDraftDepartment] = useState(entity?.department || '');
  const [draftCollection, setDraftCollection] = useState(entity?.collection || '');
  const [seoTitle, setSeoTitle] = useState(entity?.seoTitle || entity?.seo?.title || entity?.name || '');
  const [seoH1, setSeoH1] = useState(entity?.seoH1 || entity?.seo?.h1 || entity?.name || '');
  const [seoDescription, setSeoDescription] = useState(entity?.seoDescription || entity?.seo?.description || '');
  const [seoSlug, setSeoSlug] = useState(entity?.seoSlug || entity?.seo?.slug || String(entity?.id || '').toLowerCase());
  const [seoIndex, setSeoIndex] = useState(entity?.seoIndex !== false && entity?.seo?.index !== false);
  const [savedV53, setSavedV53] = useState(false);
  const images = entity?.images?.length ? entity.images : entity?.image ? [entity.image] : [];
  const [activeImageV53, setActiveImageV53] = useState(0);
  const activeImage = images[Math.min(activeImageV53, Math.max(0, images.length - 1))] || '';
  const publications = lookPublicationLocationsV53(entity, PRODUCT_MASTER_RUNTIME_V50);
  const products = draftProductIds.map((id) => id ? PRODUCTS.find((product) => String(product.id) === String(id)) || null : null);
  const selectedProducts = products.filter(Boolean);
  const totalStock = selectedProducts.reduce((sum, product) => sum + lookStockV53(product, region), 0);
  const totalL7d = selectedProducts.reduce((sum, product) => sum + Number(product?.l7d || 0), 0);
  const totalPrice = selectedProducts.reduce((sum, product) => sum + Number(product?.price || 0), 0);
  const inStockCount = selectedProducts.filter((product) => lookStockV53(product, region) > 0).length;
  const inStockRate = selectedProducts.length ? Math.round(inStockCount / selectedProducts.length * 100) : 0;

  const writeSlot = (index, productId) => {
    setDraftProductIds((current) => current.map((value, slotIndex) => slotIndex === index ? productId : value));
    setSavedV53(false);
  };
  const clearSlot = (index) => writeSlot(index, null);
  const swapSlots = (from, to) => {
    if (from === to) return;
    setDraftProductIds((current) => {
      const next = [...current];
      const value = next[from];
      next[from] = next[to];
      next[to] = value;
      return next;
    });
    setSavedV53(false);
  };
  const onDropProduct = (event, index) => {
    event.preventDefault();
    event.stopPropagation();
    const internalIndex = event.dataTransfer.getData('application/x-look-slot-v53');
    if (internalIndex !== '') {
      swapSlots(Number(internalIndex), index);
      return;
    }
    const entityId = event.dataTransfer.getData('text/plain');
    const product = PRODUCTS.find((item) => String(item.id) === String(entityId));
    if (product) writeSlot(index, product.id);
  };
  const saveLook = () => {
    const cleanIds = draftProductIds.filter(Boolean);
    entity.productIds = cleanIds;
    entity.productCount = cleanIds.length;
    entity.stockTotal = totalStock;
    entity.name = draftName.trim() || entity.name;
    entity.nameEn = draftNameEn.trim();
    entity.department = draftDepartment.trim();
    entity.collection = draftCollection.trim();
    entity.seoTitle = seoTitle.trim();
    entity.seoH1 = seoH1.trim();
    entity.seoDescription = seoDescription.trim();
    entity.seoSlug = seoSlug.trim();
    entity.seoIndex = seoIndex;
    entity.seo = { title: entity.seoTitle, h1: entity.seoH1, description: entity.seoDescription, slug: entity.seoSlug, index: entity.seoIndex };
    setSavedV53(true);
  };
  const navigateToPublication = (placement) => {
    PRODUCT_MASTER_RUNTIME_V50?.navigate?.(placement.market, placement.pageId, placement.sectionId);
    onClose();
  };

  return createPortal(<div className="look-master-layer-v53">
    <div className="look-master-modal-v53" onClick={(event) => event.stopPropagation()}>
      <header className="look-master-head-v53">
        <div><span>ОБРАЗ · EDITORIAL MASTER</span><strong>{draftName || entity.id}</strong><small>{entity.id + (draftCollection ? ' · ' + draftCollection : '')}</small></div>
        <button onClick={onClose} aria-label="Закрыть"><X size={19}/></button>
      </header>

      <nav className="look-master-tabs-v53" aria-label="Разделы карточки образа">
        <button className={activeTabV53 === 'look' ? 'active' : ''} onClick={() => setActiveTabV53('look')}>Образ</button>
        <button className={activeTabV53 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV53('relations')}>Связи образа <em>{publications.length}</em></button>
      </nav>

      <div className="look-master-scroll-v53">
        {activeTabV53 === 'look' ? <>
          <section className="look-master-summary-v53">
            <div className="look-master-visual-v53">
              <div className="look-master-thumbs-v53">{images.slice(0, 6).map((src, index) => <button key={src + index} className={index === activeImageV53 ? 'active' : ''} onClick={() => setActiveImageV53(index)}><img src={src} alt=""/></button>)}</div>
              <div className="look-master-hero-v53">{activeImage ? <img src={activeImage} alt={draftName}/> : <div><ImageIcon size={30}/><span>Нет изображения образа</span></div>}</div>
            </div>

            <div className="look-master-composition-v53">
              <div className="look-master-section-head-v53"><div><span>СОСТАВ ОБРАЗА</span><strong>Товары</strong></div><small>Перетащите товар из правой панели или поменяйте слоты местами</small></div>
              <div className="look-product-slots-v53">{products.map((product, index) => <div key={index} className={'look-product-slot-v53 ' + (product ? 'filled' : 'empty')} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }} onDrop={(event) => onDropProduct(event, index)}>
                {product ? <div className="look-product-slot-inner-v53" draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-look-slot-v53', String(index)); event.dataTransfer.setData('text/plain', product.id); }}>
                  <div className="look-product-slot-media-v53">{productMediaItems(product)[0] ? <ProductMediaVisual media={productMediaItems(product)[0]} alt={product.name} loading="eager"/> : <ImageIcon size={22}/>}</div>
                  <div className="look-product-slot-overlay-v53"><span><i className={lookStockV53(product, region) > 7 ? 'ok' : lookStockV53(product, region) > 2 ? 'warn' : 'bad'}/><em>Остаток</em><b>{lookStockV53(product, region)}</b></span><span><i/><em>L7D</em><b>{Number(product.l7d || 0)}</b></span></div>
                  <div className="look-product-slot-copy-v53"><small>{product.id}</small><strong>{product.name}</strong><em>{product.color || '—'}</em></div>
                  <button className="look-product-slot-remove-v53" onClick={(event) => { event.stopPropagation(); clearSlot(index); }} title="Удалить из образа"><X size={13}/></button>
                  <span className="look-product-slot-drag-v53"><GripVertical size={13}/></span>
                </div> : <div className="look-product-slot-empty-v53"><Plus size={22}/><strong>Добавить товар</strong><span>Drag & drop</span></div>}
              </div>)}</div>
            </div>
          </section>

          <section className="look-kpis-v53">
            <div><span>Товаров</span><strong>{selectedProducts.length}</strong></div>
            <div><span>{'Остаток · ' + region}</span><strong>{totalStock}</strong><small>шт. суммарно</small></div>
            <div><span>Продажи L7D</span><strong>{totalL7d}</strong><small>шт. по составу</small></div>
            <div><span>В наличии</span><strong>{inStockRate + '%'}</strong><small>{inStockCount + ' из ' + selectedProducts.length}</small></div>
            <div><span>Стоимость образа</span><strong>{money(totalPrice)}</strong></div>
            <div><span>Размещений</span><strong>{publications.length}</strong><small>страницы / секции</small></div>
          </section>

          <section className="look-master-fields-v53">
            <div className="look-master-section-head-v53"><div><span>MASTER DATA</span><strong>Параметры образа</strong></div></div>
            <div className="look-fields-grid-v53">
              <label><span>Название RU</span><input value={draftName} onChange={(event) => { setDraftName(event.target.value); setSavedV53(false); }}/></label>
              <label><span>Название EN</span><input value={draftNameEn} onChange={(event) => { setDraftNameEn(event.target.value); setSavedV53(false); }}/></label>
              <label><span>Отдел</span><input value={draftDepartment} onChange={(event) => { setDraftDepartment(event.target.value); setSavedV53(false); }}/></label>
              <label><span>Коллекция</span><input value={draftCollection} onChange={(event) => { setDraftCollection(event.target.value); setSavedV53(false); }}/></label>
            </div>
          </section>

          <section className="look-seo-v53">
            <div className="look-master-section-head-v53"><div><span>SEO</span><strong>Поисковые настройки образа</strong></div><small>Отдельно от SEO страницы</small></div>
            <div className="look-seo-grid-v53">
              <label><span>SEO Title</span><input value={seoTitle} maxLength={70} onChange={(event) => { setSeoTitle(event.target.value); setSavedV53(false); }}/><small>{seoTitle.length}/70</small></label>
              <label><span>H1</span><input value={seoH1} maxLength={80} onChange={(event) => { setSeoH1(event.target.value); setSavedV53(false); }}/><small>{seoH1.length}/80</small></label>
              <label className="wide"><span>Description</span><textarea value={seoDescription} maxLength={180} onChange={(event) => { setSeoDescription(event.target.value); setSavedV53(false); }}/><small>{seoDescription.length}/180</small></label>
              <label><span>URL / slug</span><input value={seoSlug} onChange={(event) => { setSeoSlug(event.target.value); setSavedV53(false); }}/></label>
              <label className="look-seo-toggle-v53"><span>Индексация</span><button className={seoIndex ? 'active' : ''} onClick={() => { setSeoIndex((value) => !value); setSavedV53(false); }}><i/>{seoIndex ? 'INDEX' : 'NOINDEX'}</button></label>
            </div>
          </section>
        </> : <section className="look-relations-v53">
          <div className="look-relations-head-v53"><div><span>STOREFRONT USAGE</span><strong>Где используется этот образ</strong><small>{entity.id + ' · ' + (draftName || 'Без названия')}</small></div><em>{publications.length} размещений</em></div>
          {publications.length ? <div className="look-relations-table-wrap-v53"><table className="look-relations-table-v53"><thead><tr><th>Регион</th><th>Страница / раздел</th><th>Секция</th><th>Слот</th><th>Размещение</th><th></th></tr></thead><tbody>{publications.map((placement) => <tr key={placement.key} onClick={() => navigateToPublication(placement)}><td><strong>{placement.market}</strong></td><td><small>{placement.pagePath}</small><strong>{placement.pageName}</strong></td><td><small>{'Секция ' + (placement.sectionIndex + 1)}</small><strong>{placement.sectionName}</strong></td><td>{placement.slotIndex + 1}</td><td><span>{placement.placementType}</span></td><td><ChevronRight size={15}/></td></tr>)}</tbody></table></div> : <div className="look-relations-empty-v53"><strong>Образ ещё не размещён на страницах</strong><span>После добавления образа в LEGO-слот здесь появится полная карта размещений.</span></div>}
        </section>}
      </div>

      <footer className="look-master-footer-v53"><span>{savedV53 ? 'Сохранено' : 'Изменения образа сохраняются локально в прототипе'}</span><div><button onClick={onClose}>Закрыть</button><button className="primary" onClick={saveLook}>Сохранить</button></div></footer>
    </div>
  </div>, document.body);
}

function EditableEntityModal(props) {
  const entity = props.entity;
  const isProduct = Boolean(entity && Object.prototype.hasOwnProperty.call(entity, 'price'));
  const isLook = entity?.kind === 'look';
  if (isProduct) return <ProductMasterDataModal {...props}/>;
  if (isLook) return <LookMasterDataModalV53 {...props}/>;
  return <LegacyEditableEntityModal {...props}/>;
}

`;

  app = app.slice(0, editableStart) + lookModal + app.slice(legacyStart);
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* look-master-editor-v53 */')) {
  css += String.raw`
/* look-master-editor-v53 */
.look-master-layer-v53{position:fixed;z-index:14500;top:58px;left:8px;right:410px;bottom:8px;pointer-events:none;display:flex;align-items:stretch;justify-content:stretch}
.look-master-modal-v53{pointer-events:auto;width:100%;height:100%;background:#fff;border:1px solid #dcdcdc;box-shadow:0 24px 70px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;color:#111}
.look-master-head-v53{flex:0 0 78px;padding:14px 20px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff}.look-master-head-v53>div{display:grid;gap:3px;min-width:0}.look-master-head-v53 span{font-size:9px;letter-spacing:.08em;color:#777}.look-master-head-v53 strong{font-size:24px;font-weight:500;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.look-master-head-v53 small{font-size:9px;color:#858585}.look-master-head-v53>button{width:34px;height:34px;border:0;background:#fff;display:grid;place-items:center}.look-master-head-v53>button:hover{background:#f5f5f5}
.look-master-tabs-v53{flex:0 0 46px;display:flex;align-items:end;gap:28px;padding:0 20px;border-bottom:1px solid #e5e5e5;background:#fff}.look-master-tabs-v53 button{height:46px;border:0;border-bottom:2px solid transparent;background:transparent;padding:0 1px;font-size:12px;font-weight:500;color:#777;display:flex;align-items:center;gap:7px}.look-master-tabs-v53 button.active{color:#111;border-bottom-color:#111}.look-master-tabs-v53 em{font-style:normal;font-size:9px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:#f2f2f2;display:grid;place-items:center}
.look-master-scroll-v53{flex:1 1 auto;min-height:0;overflow:auto;padding:20px;scrollbar-width:thin;background:#fff}
.look-master-summary-v53{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(420px,1.45fr);gap:22px;align-items:stretch}.look-master-visual-v53{display:grid;grid-template-columns:54px minmax(0,1fr);gap:8px;min-height:500px}.look-master-thumbs-v53{display:flex;flex-direction:column;gap:6px}.look-master-thumbs-v53 button{width:54px;aspect-ratio:2/3;padding:0;border:1px solid transparent;background:#f7f7f5;overflow:hidden}.look-master-thumbs-v53 button.active{border-color:#111}.look-master-thumbs-v53 img{width:100%;height:100%;object-fit:cover}.look-master-hero-v53{min-height:500px;background:#f7f7f5;overflow:hidden;display:grid;place-items:center}.look-master-hero-v53>img{width:100%;height:100%;object-fit:cover}.look-master-hero-v53>div{display:grid;place-items:center;gap:8px;color:#888;font-size:9px}
.look-master-composition-v53{min-width:0;border-left:1px solid #eee;padding-left:20px}.look-master-section-head-v53{min-height:44px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.look-master-section-head-v53>div{display:grid;gap:3px}.look-master-section-head-v53 span{font-size:8px;letter-spacing:.08em;color:#858585}.look-master-section-head-v53 strong{font-size:17px;font-weight:500}.look-master-section-head-v53 small{font-size:8px;color:#818181;max-width:260px;text-align:right;line-height:1.4}
.look-product-slots-v53{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.look-product-slot-v53{aspect-ratio:2/3;min-width:0;background:#f7f5f2;position:relative;overflow:hidden}.look-product-slot-v53.empty{border:1px dashed #d3d0cc}.look-product-slot-v53:has(.look-product-slot-inner-v53:hover){box-shadow:0 4px 16px rgba(0,0,0,.07)}.look-product-slot-inner-v53{position:absolute;inset:0;cursor:grab;background:#f7f7f5}.look-product-slot-inner-v53:active{cursor:grabbing}.look-product-slot-media-v53{position:absolute;inset:0;overflow:hidden}.look-product-slot-media-v53 img,.look-product-slot-media-v53 video{width:100%;height:100%;object-fit:cover}.look-product-slot-copy-v53{position:absolute;left:0;right:0;bottom:0;padding:24px 7px 7px;background:linear-gradient(transparent,rgba(255,255,255,.96) 42%);display:grid;gap:1px}.look-product-slot-copy-v53 small{font-size:6px;color:#777;letter-spacing:.05em}.look-product-slot-copy-v53 strong{font-size:8px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.look-product-slot-copy-v53 em{font-size:6.5px;font-style:normal;color:#777}.look-product-slot-overlay-v53{position:absolute;right:6px;bottom:48px;z-index:3;display:grid;gap:2px}.look-product-slot-overlay-v53 span{height:18px;min-width:70px;padding:0 5px;background:rgba(255,255,255,.92);border:1px solid rgba(0,0,0,.1);display:grid;grid-template-columns:5px 1fr auto;align-items:center;gap:4px}.look-product-slot-overlay-v53 i{width:5px;height:5px;border-radius:50%;background:#8c8c8c}.look-product-slot-overlay-v53 i.ok{background:#2e7d32}.look-product-slot-overlay-v53 i.warn{background:#c9a227}.look-product-slot-overlay-v53 i.bad{background:#c0392b}.look-product-slot-overlay-v53 em{font-size:5.5px;font-style:normal;color:#777;text-transform:uppercase}.look-product-slot-overlay-v53 b{font-size:7px}.look-product-slot-remove-v53{position:absolute;right:5px;top:5px;z-index:4;width:24px;height:24px;border:1px solid rgba(0,0,0,.12);background:rgba(255,255,255,.94);display:grid;place-items:center;opacity:0}.look-product-slot-inner-v53:hover .look-product-slot-remove-v53{opacity:1}.look-product-slot-drag-v53{position:absolute;left:5px;top:5px;width:24px;height:24px;background:rgba(255,255,255,.9);display:grid;place-items:center;color:#666;opacity:0}.look-product-slot-inner-v53:hover .look-product-slot-drag-v53{opacity:1}.look-product-slot-empty-v53{position:absolute;inset:0;display:grid;place-content:center;place-items:center;gap:5px;color:#8a8782;text-align:center}.look-product-slot-empty-v53 strong{font-size:8px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}.look-product-slot-empty-v53 span{font-size:7px;color:#aaa}
.look-kpis-v53{margin-top:24px;padding:18px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}.look-kpis-v53>div{min-height:76px;padding:3px 16px;border-right:1px solid #e5e5e5;display:flex;flex-direction:column;justify-content:center;gap:4px}.look-kpis-v53>div:first-child{padding-left:0}.look-kpis-v53>div:last-child{border-right:0}.look-kpis-v53 span{font-size:7px;letter-spacing:.06em;text-transform:uppercase;color:#777}.look-kpis-v53 strong{font-size:23px;font-weight:500}.look-kpis-v53 small{font-size:7px;color:#777}
.look-master-fields-v53,.look-seo-v53{padding:24px 0 4px;border-bottom:1px solid #e5e5e5}.look-fields-grid-v53,.look-seo-grid-v53{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px;row-gap:18px}.look-fields-grid-v53 label,.look-seo-grid-v53 label{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:end}.look-fields-grid-v53 label>span,.look-seo-grid-v53 label>span{grid-column:1/-1;font-size:7px;letter-spacing:.07em;text-transform:uppercase;color:#777}.look-fields-grid-v53 input,.look-seo-grid-v53 input,.look-seo-grid-v53 textarea{grid-column:1/-1;width:100%;border:0;border-bottom:1px solid #cfcfcf;background:#fff;padding:7px 0;font:inherit;font-size:11px;outline:none;border-radius:0}.look-fields-grid-v53 input:focus,.look-seo-grid-v53 input:focus,.look-seo-grid-v53 textarea:focus{border-bottom-color:#111}.look-seo-grid-v53 textarea{min-height:68px;resize:vertical}.look-seo-grid-v53 label.wide{grid-column:1/-1}.look-seo-grid-v53 label>small{grid-column:2;font-size:7px;color:#999}.look-seo-toggle-v53 button{grid-column:1/-1;width:max-content;height:30px;padding:0 10px;border:1px solid #d9d9d9;background:#fff;font-size:8px;display:flex;align-items:center;gap:7px}.look-seo-toggle-v53 button i{width:7px;height:7px;border-radius:50%;background:#999}.look-seo-toggle-v53 button.active{border-color:#111}.look-seo-toggle-v53 button.active i{background:#2e7d32}
.look-relations-v53{min-height:420px}.look-relations-head-v53{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding-bottom:18px;border-bottom:1px solid #e5e5e5}.look-relations-head-v53>div{display:grid;gap:3px}.look-relations-head-v53 span{font-size:8px;letter-spacing:.08em;color:#777}.look-relations-head-v53 strong{font-size:22px;font-weight:500}.look-relations-head-v53 small{font-size:9px;color:#777}.look-relations-head-v53>em{font-style:normal;font-size:9px;color:#777}.look-relations-table-wrap-v53{overflow:auto}.look-relations-table-v53{width:100%;border-collapse:collapse;font-size:9px}.look-relations-table-v53 th{height:38px;text-align:left;font-size:7px;text-transform:uppercase;letter-spacing:.06em;color:#777;font-weight:500;border-bottom:1px solid #ddd}.look-relations-table-v53 td{padding:12px 8px;border-bottom:1px solid #eee;vertical-align:middle}.look-relations-table-v53 tbody tr{cursor:pointer}.look-relations-table-v53 tbody tr:hover{background:#fafafa}.look-relations-table-v53 td>small,.look-relations-table-v53 td>strong{display:block}.look-relations-table-v53 td>small{font-size:7px;color:#858585;margin-bottom:3px}.look-relations-table-v53 td>strong{font-size:9px;font-weight:500}.look-relations-table-v53 td>span{font-size:7px;letter-spacing:.05em}.look-relations-empty-v53{min-height:300px;display:grid;place-content:center;place-items:center;gap:6px;text-align:center;color:#777}.look-relations-empty-v53 strong{font-size:13px;font-weight:500}.look-relations-empty-v53 span{font-size:9px}
.look-master-footer-v53{flex:0 0 58px;border-top:1px solid #e5e5e5;padding:0 18px;display:flex;align-items:center;justify-content:space-between;background:#fff}.look-master-footer-v53>span{font-size:8px;color:#777}.look-master-footer-v53>div{display:flex;gap:8px}.look-master-footer-v53 button{height:34px;padding:0 14px;border:1px solid #ddd;background:#fff;font-size:9px}.look-master-footer-v53 button.primary{background:#111;color:#fff;border-color:#111}
@media(max-width:1439.98px){.look-master-layer-v53{right:380px}.look-master-summary-v53{grid-template-columns:minmax(250px,.8fr) minmax(360px,1.3fr)}.look-kpis-v53{grid-template-columns:repeat(3,1fr);row-gap:16px}.look-kpis-v53>div:nth-child(3){border-right:0}.look-kpis-v53>div:nth-child(n+4){border-top:1px solid #eee;padding-top:14px}}
@media(max-width:1239.98px){.look-master-layer-v53{right:350px;left:4px;top:54px;bottom:4px}.look-master-scroll-v53{padding:14px}.look-master-summary-v53{grid-template-columns:1fr;}.look-master-visual-v53{min-height:440px}.look-master-composition-v53{border-left:0;border-top:1px solid #eee;padding-left:0;padding-top:18px}.look-product-slots-v53{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1023.98px){.look-master-layer-v53{inset:0}.look-master-modal-v53{border:0}.look-master-summary-v53{grid-template-columns:1fr}.look-master-visual-v53{min-height:420px}.look-kpis-v53{grid-template-columns:repeat(2,1fr)}.look-kpis-v53>div{border-top:1px solid #eee}.look-fields-grid-v53,.look-seo-grid-v53{grid-template-columns:1fr}.look-seo-grid-v53 label.wide{grid-column:auto}}
@media(max-width:560px){.look-master-head-v53{padding:12px 14px}.look-master-head-v53 strong{font-size:18px}.look-master-tabs-v53{padding:0 14px;gap:18px}.look-master-scroll-v53{padding:12px}.look-master-visual-v53{grid-template-columns:1fr;min-height:0}.look-master-thumbs-v53{order:2;flex-direction:row;overflow:auto}.look-master-thumbs-v53 button{flex:0 0 48px}.look-master-hero-v53{min-height:62vh}.look-product-slots-v53{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.look-kpis-v53{grid-template-columns:1fr 1fr}.look-kpis-v53 strong{font-size:18px}.look-master-footer-v53>span{display:none}.look-relations-table-v53{min-width:720px}}
`;
  writeFileSync(cssPath, css);
}

console.log('Look master editor V53 applied: editable composition, SEO, KPI and storefront relations');
