import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_MASTER_CONTEXT_V50';

if (!app.includes(MARKER)) {
  const anchor = 'const GLOBAL_PAGES_LOCAL_AUTOMATION_V49 = true;';
  if (!app.includes(anchor)) throw new Error('PRODUCT_MASTER_CONTEXT_V50: V49 marker missing');
  app = app.replace(anchor, `${anchor}\nconst ${MARKER} = true;\nlet PRODUCT_MASTER_CONTEXT_V50 = null;`);

  const modalStart = app.indexOf('function ProductMasterDataModal(');
  const modalEnd = modalStart >= 0 ? app.indexOf('function EditableEntityModal(', modalStart) : -1;
  if (modalStart < 0 || modalEnd < 0) throw new Error('PRODUCT_MASTER_CONTEXT_V50: product master modal boundaries missing');

  const modalSource = String.raw`
function productFamilyKeyV50(entity) {
  return String(entity?.modelId || entity?.baseSku || entity?.id || '');
}

function productColorVariantsV50(entity) {
  const family = productFamilyKeyV50(entity);
  return PRODUCTS.filter((product) => productFamilyKeyV50(product) === family)
    .sort((a, b) => Number(a.variantIndex || 1) - Number(b.variantIndex || 1));
}

function collectPageDescriptorsV50(nodes, locale = 'ru', trail = [], out = []) {
  (nodes || []).forEach((node) => {
    const label = nameFor(node, locale);
    const nextTrail = [...trail, label];
    if (node.page) out.push({ id: node.id, name: label, path: nextTrail.join(' / ') });
    if (node.children?.length) collectPageDescriptorsV50(node.children, locale, nextTrail, out);
  });
  return out;
}

function lookContainsExactSkuV50(look, sku) {
  const ids = look?.productIds || look?.products || [];
  return ids.some((item) => String(typeof item === 'object' ? (item.id || item.sku || '') : item) === String(sku));
}

function productPublicationLocationsV50(entity, context) {
  if (!entity || !context?.siteTrees || !context?.pageSections) return [];
  const placements = [];
  Object.entries(context.siteTrees).forEach(([market, tree]) => {
    const pages = collectPageDescriptorsV50(tree, context.locale || 'ru');
    pages.forEach((page) => {
      const sections = context.pageSections?.[market]?.[page.id] || [];
      sections.forEach((section, sectionIndex) => {
        let resolved = null;
        try { resolved = resolveSection(section, market, null); } catch { resolved = null; }
        const slots = resolved?.resolvedSlots || [];
        slots.forEach((slot) => {
          const content = slot.entity;
          if (!content) return;
          if (String(content.id) === String(entity.id)) {
            placements.push({
              key: [market, page.id, section.id, slot.index, 'direct'].join(':'),
              market,
              pageId: page.id,
              pageName: page.name,
              pagePath: page.path,
              sectionId: section.id,
              sectionName: section.titles?.[context.locale] || section.titles?.ru || 'Секция ' + (sectionIndex + 1),
              sectionIndex,
              slotIndex: Number(slot.index || 0),
              placementType: slot.status === 'auto' ? 'AUTO' : 'PIN',
              viaLook: false,
            });
            return;
          }
          if (content.kind === 'look' && lookContainsExactSkuV50(content, entity.id)) {
            placements.push({
              key: [market, page.id, section.id, slot.index, 'look', content.id].join(':'),
              market,
              pageId: page.id,
              pageName: page.name,
              pagePath: page.path,
              sectionId: section.id,
              sectionName: section.titles?.[context.locale] || section.titles?.ru || 'Секция ' + (sectionIndex + 1),
              sectionIndex,
              slotIndex: Number(slot.index || 0),
              placementType: 'ОБРАЗ',
              lookName: content.name || content.nameRu || content.id,
              viaLook: true,
            });
          }
        });
      });
    });
  });
  const unique = Array.from(new Map(placements.map((item) => [item.key, item])).values());
  return unique.sort((a, b) => {
    const aCurrent = a.market === context.region && a.pageId === context.pageId ? 0 : a.market === context.region ? 1 : 2;
    const bCurrent = b.market === context.region && b.pageId === context.pageId ? 0 : b.market === context.region ? 1 : 2;
    if (aCurrent !== bCurrent) return aCurrent - bCurrent;
    if (a.market !== b.market) return a.market.localeCompare(b.market);
    if (a.pagePath !== b.pagePath) return a.pagePath.localeCompare(b.pagePath, 'ru');
    if (a.sectionIndex !== b.sectionIndex) return a.sectionIndex - b.sectionIndex;
    return a.slotIndex - b.slotIndex;
  });
}

function ProductMasterDataModal({ entity, region = 'RU', onClose }) {
  const [viewEntityId, setViewEntityId] = useState(entity?.id || '');
  const viewEntity = PRODUCTS.find((product) => product.id === viewEntityId) || entity;
  const images = productMediaItems(viewEntity);
  const [activeImage, setActiveImage] = useState(0);
  const activeMedia = images[Math.min(activeImage, Math.max(images.length - 1, 0))] || null;
  const stock = Number(viewEntity?.stock?.[region] ?? viewEntity?.stockValue ?? 0);
  const l7d = Number(viewEntity?.l7d ?? 0);
  const price = Number(viewEntity?.price ?? 0);
  const sizeRows = productSizeRows(viewEntity, region);
  const availableSizes = sizeRows.filter((row) => row.stock > 0).length;
  const hasRealSizeRows = Array.isArray(viewEntity?.sizeRows) && viewEntity.sizeRows.length > 0;
  const colorVariants = productColorVariantsV50(viewEntity);
  const publications = productPublicationLocationsV50(viewEntity, PRODUCT_MASTER_CONTEXT_V50);
  const attributes = [
    ['Отдел', viewEntity.department, 'PIM'], ['Пол / Гендер', viewEntity.gender, 'PIM'], ['Категория', viewEntity.category, 'PIM'], ['Подкатегория', viewEntity.subcategory, 'PIM'],
    ['Коллекция', viewEntity.collection, 'PIM'], ['Модель', viewEntity.modelId || viewEntity.baseSku || viewEntity.id, 'PIM'], ['Цветовой SKU', viewEntity.id, 'PIM'], ['Цвет', viewEntity.color, 'PIM'],
    ['Материал', viewEntity.material, 'PIM'], ['Силуэт / фасон', viewEntity.silhouette, 'PIM'], ['Посадка', viewEntity.fit, 'PIM'], ['Длина изделия', viewEntity.length, 'PIM'],
    ['Длина рукава', viewEntity.sleeveLength, 'PIM'], ['Возрастная группа', viewEntity.ageGroup, 'PIM'], ['Детали', viewEntity.details, 'PIM'], ['Скидка', viewEntity.discount ? viewEntity.discount + '%' : '0%', 'ERP'],
    ['Новинка', viewEntity.isNew ? 'Да' : 'Нет', 'PIM']
  ];
  const navigateToPublication = (placement) => {
    PRODUCT_MASTER_CONTEXT_V50?.navigate?.(placement.market, placement.pageId, placement.sectionId);
    onClose();
  };

  return createPortal(<div className="product-master-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}>
    <div className="product-master-modal product-master-modal-v50" onClick={(event) => event.stopPropagation()}>
      <header className="product-master-head product-master-head-v50">
        <div><span>КАРТОЧКА ТОВАРА · MASTER DATA</span><strong>{viewEntity.name}</strong><small>{viewEntity.id + (viewEntity.collection ? ' · ' + viewEntity.collection : '') + (viewEntity.color ? ' · ' + viewEntity.color : '')}</small></div>
        <div><span className="master-data-pill">{colorVariants.length} цветов</span><button className="product-master-close" onClick={onClose} aria-label="Закрыть"><X size={20}/></button></div>
      </header>

      <div className="product-master-scroll product-master-scroll-v50">
        <section className="product-master-overview product-master-overview-v50">
          <aside className="product-master-gallery product-master-gallery-v50">
            <div className="product-master-thumbs">{images.slice(0, 8).map((media, index) => <button key={viewEntity.id + '-media-' + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><ProductMediaVisual media={media} alt={'Фото ' + (index + 1)} loading="eager"/></button>)}</div>
            <div className="product-master-hero">{activeMedia ? <ProductMediaVisual media={activeMedia} alt={viewEntity.name} loading="eager"/> : <div className="product-master-noimage"><ImageIcon size={38}/><span>Нет изображения</span></div>}</div>
          </aside>

          <div className="product-master-info product-master-info-v50">
            <div className="master-identity-grid master-identity-grid-v50"><MasterAttribute label="Название" value={viewEntity.name}/><MasterAttribute label="Цветовой SKU" value={viewEntity.id}/><MasterAttribute label="Модель" value={viewEntity.modelId || viewEntity.baseSku || viewEntity.id}/><MasterAttribute label="Цвет" value={viewEntity.color}/></div>
            <div className="master-kpi-grid master-kpi-grid-v50">
              <MasterKpi label="Цена" value={money(price)} hint="Текущая цена"/>
              <MasterKpi label={'Остаток · ' + region} value={stock + ' шт'} secondary={money(stock * price)} kind={{ value: stock, type: 'stock' }}/>
              <MasterKpi label="Продажи L7D" value={l7d + ' шт'} secondary={money(l7d * price)} kind={{ value: l7d, type: 'l7d' }}/>
              <MasterKpi label="Размеров" value={availableSizes + '/' + sizeRows.length} secondary={availableSizes ? 'в наличии' : 'нет в наличии'} kind={{ value: availableSizes, type: 'stock' }}/>
            </div>
          </div>
        </section>

        <section className="master-size-card master-size-card-v50">
          <div className="master-size-head"><div><strong>Остатки и продажи по размерам</strong><small>{hasRealSizeRows ? 'Операционные данные · каждый размер — отдельный SKU' : 'Демо-распределение из общего остатка · подключите size-SKU из ERP для фактических строк'}</small></div><div className="master-legend"><span><i className="high"/>Высокий</span><span><i className="medium"/>Средний</span><span><i className="low"/>Низкий</span></div></div>
          <div className="master-size-table-wrap"><table className="master-size-table"><thead><tr><th>Размер</th><th>Размерная сетка</th><th>SKU</th><th>Остаток, шт</th><th>Остаток, ₽</th><th>L7D, шт</th><th>L7D, ₽</th></tr></thead><tbody>{sizeRows.map((row) => <tr key={row.sku}><td><strong>{row.size}</strong></td><td><span className="size-grid-pill">{row.grid}</span></td><td>{row.sku}</td><td><span className="master-table-metric"><StatusDot value={row.stock} kind="stock"/>{row.stock}</span></td><td>{money(row.stock * price)}</td><td><span className="master-table-metric"><StatusDot value={row.l7d} kind="l7d"/>{row.l7d}</span></td><td>{money(row.l7d * price)}</td></tr>)}</tbody><tfoot><tr><td colSpan="3">Итого по цвету</td><td>{stock}</td><td>{money(stock * price)}</td><td>{l7d}</td><td>{money(l7d * price)}</td></tr></tfoot></table></div>
        </section>

        <section className="master-attributes-card master-attributes-card-v50">
          <div className="master-section-title"><div><span>MASTER DATA</span><strong>Атрибуты товара</strong></div><span>Под медиа · данные PIM / ERP</span></div>
          <div className="master-attributes-columns-v50">{attributes.map(([label, value, source]) => <MasterAttribute key={label} label={label} value={value} source={source}/>)}</div>
        </section>

        <section className="master-color-models-v50">
          <div className="master-section-title"><div><span>COLOR MODEL</span><strong>Связанные цвета модели</strong></div><span>{colorVariants.length} цветовых SKU</span></div>
          <div className="master-color-grid-v50">{colorVariants.map((variant) => {
            const media = productMediaItems(variant)[0] || null;
            const variantStock = Number(variant?.stock?.[region] ?? variant?.stockValue ?? 0);
            return <button key={variant.id} className={'master-color-card-v50 ' + (variant.id === viewEntity.id ? 'active' : '')} onClick={() => { setViewEntityId(variant.id); setActiveImage(0); }}>
              <span className="master-color-media-v50">{media ? <ProductMediaVisual media={media} alt={variant.color || variant.name} loading="eager"/> : <ImageIcon size={22}/>}</span>
              <span className="master-color-copy-v50"><small>{variant.id}</small><strong>{variant.color || 'Цвет не указан'}</strong><em><StatusDot value={variantStock} kind="stock"/>Остаток {variantStock}</em></span>
            </button>;
          })}</div>
        </section>

        <section className="master-publications-v50">
          <div className="master-section-title"><div><span>STOREFRONT USAGE</span><strong>Где используется этот цветовой SKU</strong></div><span>{publications.length} размещений</span></div>
          {publications.length ? <div className="master-publication-list-v50">{publications.map((placement) => <button key={placement.key} className="master-publication-row-v50" onClick={() => navigateToPublication(placement)}>
            <span className="master-publication-market-v50">{placement.market}</span>
            <span className="master-publication-path-v50"><small>{placement.pagePath}</small><strong>{placement.pageName}</strong></span>
            <span className="master-publication-section-v50"><small>Секция {placement.sectionIndex + 1} · слот {placement.slotIndex + 1}</small><strong>{placement.sectionName}</strong>{placement.viaLook && <em>через образ · {placement.lookName}</em>}</span>
            <span className={'master-publication-type-v50 ' + placement.placementType.toLowerCase()}>{placement.placementType}</span>
            <ChevronRight size={15}/>
          </button>)}</div> : <div className="master-publication-empty-v50"><strong>Этот цветовой SKU ещё не размещён на страницах</strong><span>Список формируется по всем регионам, страницам, секциям и слотам текущего прототипа.</span></div>}
        </section>

        <section className="master-bottom-grid master-bottom-grid-v50">
          <div><strong>Состав</strong><span>{viewEntity.composition || viewEntity.material || '—'}</span></div>
          <div><strong>Уход</strong><span>{viewEntity.care || 'Данные ухода не переданы из PIM'}</span></div>
          <div><strong>Идентификация</strong><span>{viewEntity.barcode ? 'Штрихкод: ' + viewEntity.barcode : 'Штрихкод: —'}{viewEntity.country ? ' · ' + viewEntity.country : ''}</span></div>
        </section>
      </div>

      <footer className="product-master-footer"><span>Размещения вычисляются по текущему состоянию всех storefront-страниц. Для перехода нажмите на строку страницы.</span><button onClick={onClose}>Закрыть</button></footer>
    </div>
  </div>, document.body);
}

`;
  app = app.slice(0, modalStart) + modalSource + app.slice(modalEnd);

  // Expose live page/site state to the product master without duplicating the editor state.
  const appStart = app.indexOf('export default function AppV3()');
  const rootReturn = appStart >= 0 ? app.indexOf('  return <div className={`lego-app', appStart) : -1;
  if (appStart < 0 || rootReturn < 0) throw new Error('PRODUCT_MASTER_CONTEXT_V50: AppV3 root return missing');
  const contextSource = String.raw`  const navigateProductPlacementV50 = (targetRegion, targetPageId, targetSectionId) => {
    const allowed = REGION_CONFIG[targetRegion]?.languages || ['ru'];
    setRegion(targetRegion);
    if (!allowed.includes(locale)) setLocale('ru');
    setPageIdByRegion((previous) => ({ ...previous, [targetRegion]: targetPageId }));
    setPageSections((previous) => ({ ...previous, [targetRegion]: { ...(previous[targetRegion] || {}), [targetPageId]: previous[targetRegion]?.[targetPageId] || [] } }));
    setSelectedId(targetSectionId || null);
    setHistory([]);
    setFuture([]);
    setShowMenu(false);
    setRightTab('settings');
  };
  PRODUCT_MASTER_CONTEXT_V50 = { pageSections, siteTrees, locale, region, pageId, navigate: navigateProductPlacementV50 };

`;
  app = app.slice(0, rootReturn) + contextSource + app.slice(rootReturn);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-master-context-v50 */')) {
  css += String.raw`
/* product-master-context-v50 */
.product-master-modal-v50{width:min(1500px,98vw)!important;height:min(1080px,96vh)!important;border-radius:0!important}
.product-master-scroll-v50{padding:24px 28px 36px!important;display:grid!important;gap:28px!important;background:#fff!important}
.product-master-overview-v50{display:grid!important;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr)!important;gap:32px!important;align-items:start!important}
.product-master-gallery-v50{min-width:0!important}.product-master-info-v50{min-width:0!important;display:grid!important;gap:24px!important;align-content:start!important}
.master-identity-grid-v50{grid-template-columns:repeat(2,minmax(0,1fr))!important;border-top:1px solid #e5e5e5!important}.master-identity-grid-v50 .master-attribute{padding:13px 0!important;border-bottom:1px solid #e5e5e5!important}
.master-kpi-grid-v50{grid-template-columns:repeat(2,minmax(0,1fr))!important;border-top:1px solid #e5e5e5!important;border-left:0!important}.master-kpi-grid-v50 .master-kpi{min-height:112px!important;padding:14px 18px 14px 0!important;border:0!important;border-bottom:1px solid #e5e5e5!important}.master-kpi-grid-v50 .master-kpi:nth-child(odd){border-right:1px solid #e5e5e5!important;margin-right:18px!important}
.master-size-card-v50{order:2!important;margin:0!important;border-top:1px solid #111!important;border-bottom:1px solid #e5e5e5!important;border-left:0!important;border-right:0!important;border-radius:0!important;box-shadow:none!important;padding-top:18px!important}
.master-size-card-v50 .master-size-table th,.master-size-card-v50 .master-size-table td{border-color:#ececec!important}.master-size-card-v50 .master-size-table tbody tr:nth-child(even){background:#fafafa!important}
.master-attributes-card-v50{order:3!important;margin:0!important;border:0!important;border-top:1px solid #111!important;border-radius:0!important;box-shadow:none!important;padding:18px 0 0!important}
.master-section-title{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:18px!important;margin-bottom:14px!important}.master-section-title>div{display:grid!important;gap:3px!important}.master-section-title>div>span{font-size:8px!important;letter-spacing:.09em!important;color:#777!important}.master-section-title>div>strong,.master-section-title>strong{font-size:18px!important;font-weight:500!important;color:#111!important}.master-section-title>span{font-size:9px!important;color:#777!important}
.master-attributes-columns-v50{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;border-top:1px solid #e5e5e5!important}
.master-attributes-columns-v50 .master-attribute{min-width:0!important;min-height:78px!important;padding:12px 16px 12px 0!important;border-bottom:1px solid #e5e5e5!important;border-right:1px solid #e5e5e5!important;background:#fff!important}.master-attributes-columns-v50 .master-attribute:nth-child(4n){border-right:0!important;padding-left:16px!important}.master-attributes-columns-v50 .master-attribute:nth-child(4n+2),.master-attributes-columns-v50 .master-attribute:nth-child(4n+3){padding-left:16px!important}.master-attributes-columns-v50 .master-attribute strong{font-size:11px!important;font-weight:500!important;line-height:1.35!important}.master-attributes-columns-v50 .master-attribute>div span{font-size:7px!important;letter-spacing:.07em!important;text-transform:uppercase!important;color:#777!important}
.master-color-models-v50,.master-publications-v50{border-top:1px solid #111;padding-top:18px}.master-color-grid-v50{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px}.master-color-card-v50{min-width:0;padding:0;border:1px solid transparent;background:#fff;text-align:left;cursor:pointer;display:grid;gap:8px}.master-color-card-v50:hover{border-color:#d7d7d7}.master-color-card-v50.active{border-color:#111}.master-color-media-v50{display:block;aspect-ratio:2/3;background:#f7f7f5;overflow:hidden}.master-color-media-v50>img,.master-color-media-v50>.variant-atlas-frame{width:100%!important;height:100%!important;object-fit:cover!important}.master-color-copy-v50{display:grid;gap:3px;padding:0 6px 8px}.master-color-copy-v50 small{font-size:7px;letter-spacing:.06em;color:#858585}.master-color-copy-v50 strong{font-size:10px;font-weight:500;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.master-color-copy-v50 em{display:flex;align-items:center;gap:5px;font-size:8px;font-style:normal;color:#6b6b6b}.master-color-copy-v50 .master-status{display:inline-flex}
.master-publication-list-v50{border-top:1px solid #e5e5e5}.master-publication-row-v50{width:100%;min-height:66px;padding:10px 0;border:0;border-bottom:1px solid #e5e5e5;background:#fff;display:grid;grid-template-columns:48px minmax(170px,1.25fr) minmax(190px,1fr) 64px 22px;gap:12px;align-items:center;text-align:left;color:#111;cursor:pointer}.master-publication-row-v50:hover{background:#fafafa}.master-publication-market-v50{font-size:8px;font-weight:600;letter-spacing:.06em}.master-publication-path-v50,.master-publication-section-v50{display:grid;gap:2px;min-width:0}.master-publication-path-v50 small,.master-publication-section-v50 small{font-size:7px;color:#858585;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.master-publication-path-v50 strong,.master-publication-section-v50 strong{font-size:9px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.master-publication-section-v50 em{font-size:7px;font-style:normal;color:#777;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.master-publication-type-v50{justify-self:start;font-size:7px;font-weight:600;letter-spacing:.07em;color:#666}.master-publication-type-v50.pin{color:#111}.master-publication-type-v50.auto{color:#555}.master-publication-empty-v50{min-height:94px;padding:20px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;display:grid;align-content:center;gap:4px}.master-publication-empty-v50 strong{font-size:11px;font-weight:500}.master-publication-empty-v50 span{font-size:8px;color:#777}
.master-bottom-grid-v50{margin:0!important;border-top:1px solid #111!important;padding-top:18px!important}
@media(max-width:1100px){.product-master-overview-v50{grid-template-columns:1fr!important}.master-attributes-columns-v50{grid-template-columns:repeat(3,minmax(0,1fr))!important}.master-attributes-columns-v50 .master-attribute{padding-left:0!important;border-right:1px solid #e5e5e5!important}.master-attributes-columns-v50 .master-attribute:nth-child(3n){border-right:0!important}.master-attributes-columns-v50 .master-attribute:nth-child(3n+2){padding-left:14px!important}.master-publication-row-v50{grid-template-columns:42px minmax(0,1fr) 58px 20px}.master-publication-section-v50{grid-column:2/3}.master-publication-type-v50{grid-column:3/4;grid-row:1/3}.master-publication-row-v50>svg{grid-column:4/5;grid-row:1/3}}
@media(max-width:720px){.product-master-scroll-v50{padding:16px!important;gap:22px!important}.master-kpi-grid-v50{grid-template-columns:1fr!important}.master-kpi-grid-v50 .master-kpi:nth-child(odd){border-right:0!important;margin-right:0!important}.master-identity-grid-v50{grid-template-columns:1fr!important}.master-attributes-columns-v50{grid-template-columns:repeat(2,minmax(0,1fr))!important}.master-attributes-columns-v50 .master-attribute{padding-left:0!important;border-right:1px solid #e5e5e5!important}.master-attributes-columns-v50 .master-attribute:nth-child(2n){border-right:0!important;padding-left:12px!important}.master-color-grid-v50{grid-template-columns:repeat(2,minmax(0,1fr))}.master-publication-row-v50{grid-template-columns:38px minmax(0,1fr) 48px 16px;gap:7px}.master-publication-row-v50 .master-publication-path-v50 small{white-space:normal}.master-section-title{align-items:start!important;flex-direction:column!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Product master context v50 applied: sizes first, attribute columns, color variants and storefront usage links');
