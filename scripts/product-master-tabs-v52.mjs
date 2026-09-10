import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_MASTER_TABS_V52';

if (!app.includes(MARKER)) {
  const anchor = 'const PRODUCT_MASTER_CONTEXT_V50 = true;';
  if (!app.includes(anchor)) throw new Error('PRODUCT_MASTER_TABS_V52: V50 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const modalStart = app.indexOf('function ProductMasterDataModal(');
  const modalEnd = modalStart >= 0 ? app.indexOf('function EditableEntityModal(', modalStart) : -1;
  if (modalStart < 0 || modalEnd < 0) throw new Error('PRODUCT_MASTER_TABS_V52: product master modal boundaries missing');

  const modalSource = String.raw`
function productDateFieldV52(entity, keys) {
  for (const key of keys) {
    const value = entity?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return null;
}

function formatProductDateV52(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function productLifecycleV52(entity) {
  return [
    {
      label: 'В ассортименте с',
      value: productDateFieldV52(entity, ['assortmentStart', 'assortmentStartAt', 'inAssortmentFrom', 'assortmentDate', 'createdAt', 'created_at']),
      source: 'PIM'
    },
    {
      label: 'В наличии с',
      value: productDateFieldV52(entity, ['availableFrom', 'availableAt', 'firstAvailableAt', 'stockStartAt', 'availabilityDate']),
      source: 'ERP'
    },
    {
      label: 'Опубликован',
      value: productDateFieldV52(entity, ['publishedAt', 'published_at', 'publicationDate', 'publication_date', 'onlineFrom']),
      source: 'CMS'
    }
  ];
}

function ProductMasterDataModal({ entity, region = 'RU', onClose }) {
  const [activeTabV52, setActiveTabV52] = useState('product');
  const [viewEntityId, setViewEntityId] = useState(entity?.id || '');
  const viewEntity = PRODUCTS.find((product) => product.id === viewEntityId) || entity;
  const images = productMediaItems(viewEntity);
  const [activeImage, setActiveImage] = useState(0);
  const activeMedia = images[Math.min(activeImage, Math.max(images.length - 1, 0))] || null;
  const stock = Number(viewEntity?.stock?.[region] ?? viewEntity?.stockValue ?? 0);
  const l7d = Number(viewEntity?.l7d ?? 0);
  const price = Number(viewEntity?.price ?? 0);
  const discount = Math.max(0, Number(viewEntity?.discount ?? 0));
  const sizeRows = productSizeRows(viewEntity, region);
  const availableSizes = sizeRows.filter((row) => row.stock > 0).length;
  const hasRealSizeRows = Array.isArray(viewEntity?.sizeRows) && viewEntity.sizeRows.length > 0;
  const colorVariants = productColorVariantsV50(viewEntity);
  const publications = productPublicationLocationsV50(viewEntity, PRODUCT_MASTER_RUNTIME_V50);
  const lifecycle = productLifecycleV52(viewEntity);
  const attributes = [
    ['Отдел', viewEntity.department, 'PIM'],
    ['Пол / Гендер', viewEntity.gender, 'PIM'],
    ['Категория', viewEntity.category, 'PIM'],
    ['Подкатегория', viewEntity.subcategory, 'PIM'],
    ['Коллекция', viewEntity.collection, 'PIM'],
    ['Модель', viewEntity.modelId || viewEntity.baseSku || viewEntity.id, 'PIM'],
    ['Цветовой SKU', viewEntity.id, 'PIM'],
    ['Цвет', viewEntity.color, 'PIM'],
    ['Материал', viewEntity.material, 'PIM'],
    ['Силуэт / фасон', viewEntity.silhouette, 'PIM'],
    ['Посадка', viewEntity.fit, 'PIM'],
    ['Длина изделия', viewEntity.length, 'PIM'],
    ['Длина рукава', viewEntity.sleeveLength, 'PIM'],
    ['Возрастная группа', viewEntity.ageGroup, 'PIM'],
    ['Детали', viewEntity.details, 'PIM'],
    ['Новинка', viewEntity.isNew ? 'Да' : 'Нет', 'PIM']
  ];
  const navigateToPublication = (placement) => {
    PRODUCT_MASTER_RUNTIME_V50?.navigate?.(placement.market, placement.pageId, placement.sectionId);
    onClose();
  };

  return createPortal(<div className="product-master-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}>
    <div className="product-master-modal product-master-modal-v50 product-master-modal-v52" onClick={(event) => event.stopPropagation()}>
      <header className="product-master-head product-master-head-v50 product-master-head-v52">
        <div className="product-master-head-copy-v52">
          <span>КАРТОЧКА ТОВАРА · MASTER DATA</span>
          <strong>{viewEntity.name}</strong>
          <small>{viewEntity.id + (viewEntity.collection ? ' · ' + viewEntity.collection : '') + (viewEntity.color ? ' · ' + viewEntity.color : '')}</small>
        </div>
        <button className="product-master-close" onClick={onClose} aria-label="Закрыть"><X size={20}/></button>
      </header>

      <nav className="product-master-tabs-v52" aria-label="Разделы карточки товара">
        <button className={activeTabV52 === 'product' ? 'active' : ''} onClick={() => setActiveTabV52('product')}><span>Товар</span></button>
        <button className={activeTabV52 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV52('relations')}><span>Связи SKU</span><em>{publications.length}</em></button>
      </nav>

      <div className="product-master-scroll product-master-scroll-v50 product-master-scroll-v52">
        {activeTabV52 === 'product' ? <>
          <section className="product-summary-v52">
            <aside className="product-master-gallery product-master-gallery-v50 product-gallery-v52">
              <div className="product-master-thumbs">{images.slice(0, 8).map((media, index) => <button key={viewEntity.id + '-media-' + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><ProductMediaVisual media={media} alt={'Фото ' + (index + 1)} loading="eager"/></button>)}</div>
              <div className="product-master-hero">{activeMedia ? <ProductMediaVisual media={activeMedia} alt={viewEntity.name} loading="eager"/> : <div className="product-master-noimage"><ImageIcon size={38}/><span>Нет изображения</span></div>}</div>
            </aside>

            <div className="product-summary-info-v52">
              <div className="product-color-mini-v52">
                <div className="product-summary-section-head-v52"><div><span>COLOR MODEL</span><strong>Связанные цвета модели</strong></div><em>{colorVariants.length} SKU</em></div>
                <div className="product-color-mini-list-v52">{colorVariants.map((variant) => {
                  const media = productMediaItems(variant)[0] || null;
                  const variantStock = Number(variant?.stock?.[region] ?? variant?.stockValue ?? 0);
                  return <button key={variant.id} className={'product-color-mini-item-v52 ' + (variant.id === viewEntity.id ? 'active' : '')} onClick={() => { setViewEntityId(variant.id); setActiveImage(0); }}>
                    <span className="product-color-mini-media-v52">{media ? <ProductMediaVisual media={media} alt={variant.color || variant.name} loading="eager"/> : <ImageIcon size={18}/>}</span>
                    <span className="product-color-mini-copy-v52"><small>{variant.id}</small><strong>{variant.color || 'Цвет не указан'}</strong><em><StatusDot value={variantStock} kind="stock"/>{variantStock} шт</em></span>
                  </button>;
                })}</div>
              </div>

              <div className="product-kpis-v52">
                <div className="product-kpi-v52 price"><span>Цена</span><strong>{money(price)}</strong></div>
                {discount > 0 && <div className="product-kpi-v52 discount"><span>Скидка</span><strong>{'-' + discount + '%'}</strong></div>}
                <div className="product-kpi-v52"><span>{'Остаток · ' + region}</span><strong>{stock + ' шт'}</strong><small><StatusDot value={stock} kind="stock"/>{money(stock * price)}</small></div>
                <div className="product-kpi-v52"><span>Продажи L7D</span><strong>{l7d + ' шт'}</strong><small><StatusDot value={l7d} kind="l7d"/>{money(l7d * price)}</small></div>
                <div className="product-kpi-v52"><span>Размеры</span><strong>{availableSizes + '/' + sizeRows.length}</strong><small>{availableSizes ? 'в наличии' : 'нет в наличии'}</small></div>
              </div>

              <div className="product-lifecycle-v52">
                {lifecycle.map((item) => <div key={item.label}><span>{item.label}</span><strong>{formatProductDateV52(item.value)}</strong><small>{item.value ? item.source : 'нет данных в фиде'}</small></div>)}
              </div>
            </div>
          </section>

          <section className="master-size-card master-size-card-v50 master-size-card-v52">
            <div className="master-size-head"><div><strong>Остатки и продажи по размерам</strong><small>{hasRealSizeRows ? 'Операционные данные · каждый размер — отдельный SKU' : 'Демо-распределение из общего остатка · подключите size-SKU из ERP для фактических строк'}</small></div><div className="master-legend"><span><i className="high"/>Высокий</span><span><i className="medium"/>Средний</span><span><i className="low"/>Низкий</span></div></div>
            <div className="master-size-table-wrap"><table className="master-size-table"><thead><tr><th>Размер</th><th>Размерная сетка</th><th>SKU</th><th>Остаток, шт</th><th>Остаток, ₽</th><th>L7D, шт</th><th>L7D, ₽</th></tr></thead><tbody>{sizeRows.map((row) => <tr key={row.sku}><td><strong>{row.size}</strong></td><td><span className="size-grid-pill">{row.grid}</span></td><td>{row.sku}</td><td><span className="master-table-metric"><StatusDot value={row.stock} kind="stock"/>{row.stock}</span></td><td>{money(row.stock * price)}</td><td><span className="master-table-metric"><StatusDot value={row.l7d} kind="l7d"/>{row.l7d}</span></td><td>{money(row.l7d * price)}</td></tr>)}</tbody><tfoot><tr><td colSpan="3">Итого по цвету</td><td>{stock}</td><td>{money(stock * price)}</td><td>{l7d}</td><td>{money(l7d * price)}</td></tr></tfoot></table></div>
          </section>

          <section className="master-attributes-card master-attributes-card-v50 master-attributes-card-v52">
            <div className="master-section-title"><div><span>MASTER DATA</span><strong>Характеристики товара</strong></div><span>Вторичные данные PIM / ERP</span></div>
            <div className="master-attributes-columns-v50 master-attributes-columns-v52">{attributes.map(([label, value, source]) => <MasterAttribute key={label} label={label} value={value} source={source}/>)}</div>
            <div className="master-bottom-grid master-bottom-grid-v50 master-bottom-grid-v52">
              <div><strong>Состав</strong><span>{viewEntity.composition || viewEntity.material || '—'}</span></div>
              <div><strong>Уход</strong><span>{viewEntity.care || '—'}</span></div>
              <div><strong>Идентификация</strong><span>{'SKU: ' + viewEntity.id + ' · Model: ' + (viewEntity.modelId || viewEntity.baseSku || viewEntity.id)}</span></div>
            </div>
          </section>
        </> : <section className="sku-relations-v52">
          <div className="sku-relations-head-v52"><div><span>STOREFRONT USAGE</span><strong>Где используется этот цветовой SKU</strong><small>{viewEntity.id + ' · ' + (viewEntity.color || 'цвет не указан')}</small></div><em>{publications.length} размещений</em></div>
          {publications.length ? <div className="sku-relations-table-wrap-v52"><table className="sku-relations-table-v52">
            <thead><tr><th>Регион</th><th>Страница / раздел</th><th>Секция</th><th>Слот</th><th>Размещение</th><th>Контекст</th><th></th></tr></thead>
            <tbody>{publications.map((placement) => <tr key={placement.key} onClick={() => navigateToPublication(placement)}>
              <td><strong>{placement.market}</strong></td>
              <td><small>{placement.pagePath}</small><strong>{placement.pageName}</strong></td>
              <td><small>{'Секция ' + (placement.sectionIndex + 1)}</small><strong>{placement.sectionName}</strong></td>
              <td>{placement.slotIndex + 1}</td>
              <td><span className={'sku-placement-type-v52 ' + placement.placementType.toLowerCase()}>{placement.placementType}</span></td>
              <td>{placement.viaLook ? <><small>Через образ</small><strong>{placement.lookName}</strong></> : <span>Прямое размещение</span>}</td>
              <td><button title="Открыть размещение"><ChevronRight size={15}/></button></td>
            </tr>)}</tbody>
          </table></div> : <div className="master-publication-empty-v50 sku-relations-empty-v52"><strong>Этот цветовой SKU ещё не размещён на страницах</strong><span>Список формируется по всем регионам, страницам, секциям и слотам текущего прототипа.</span></div>}
        </section>}
      </div>
    </div>
  </div>, document.body);
}

`;

  app = app.slice(0, modalStart) + modalSource + app.slice(modalEnd);
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-master-tabs-v52 */')) {
  css += String.raw`
/* product-master-tabs-v52 */
.product-master-modal-v52{width:min(1440px,96vw)!important;max-height:94vh!important;border-radius:0!important;background:#fff!important}
.product-master-head-v52{min-height:82px!important;padding:18px 24px 14px!important;border-bottom:1px solid #e5e5e5!important}
.product-master-head-copy-v52{display:grid;gap:3px!important}.product-master-head-copy-v52>span{font-size:9px!important;letter-spacing:.08em!important;color:#767676!important}.product-master-head-copy-v52>strong{font-size:21px!important;font-weight:500!important}.product-master-head-copy-v52>small{font-size:10px!important;color:#737373!important}
.product-master-tabs-v52{display:flex!important;align-items:flex-end!important;gap:30px!important;height:48px!important;padding:0 24px!important;border-bottom:1px solid #e5e5e5!important;background:#fff!important;flex:0 0 auto!important}
.product-master-tabs-v52 button{height:48px!important;border:0!important;border-bottom:2px solid transparent!important;background:transparent!important;padding:0!important;display:flex!important;align-items:center!important;gap:8px!important;color:#767676!important;font-size:12px!important;font-weight:500!important}
.product-master-tabs-v52 button.active{color:#111!important;border-bottom-color:#111!important}.product-master-tabs-v52 button em{font-style:normal!important;min-width:20px!important;height:20px!important;display:grid!important;place-items:center!important;background:#f1f1f1!important;border-radius:10px!important;font-size:9px!important;color:#555!important}
.product-master-scroll-v52{padding:24px!important;background:#fff!important}
.product-summary-v52{display:grid!important;grid-template-columns:minmax(420px,1.08fr) minmax(430px,.92fr)!important;gap:32px!important;align-items:start!important;margin-bottom:28px!important}
.product-gallery-v52{min-width:0!important}.product-gallery-v52 .product-master-hero{background:#f7f7f5!important}
.product-summary-info-v52{display:grid!important;gap:24px!important;min-width:0!important}
.product-summary-section-head-v52,.sku-relations-head-v52{display:flex!important;justify-content:space-between!important;gap:20px!important;align-items:flex-start!important}.product-summary-section-head-v52>div,.sku-relations-head-v52>div{display:grid!important;gap:3px!important}.product-summary-section-head-v52 span,.sku-relations-head-v52 span{font-size:9px!important;letter-spacing:.08em!important;color:#777!important}.product-summary-section-head-v52 strong,.sku-relations-head-v52 strong{font-size:16px!important;font-weight:500!important;color:#111!important}.product-summary-section-head-v52>em,.sku-relations-head-v52>em{font-style:normal!important;font-size:10px!important;color:#777!important;white-space:nowrap!important}
.product-color-mini-v52{display:grid!important;gap:12px!important}.product-color-mini-list-v52{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important}
.product-color-mini-item-v52{display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;gap:8px!important;align-items:center!important;min-height:72px!important;padding:0!important;border:1px solid #e6e6e6!important;background:#fff!important;text-align:left!important}.product-color-mini-item-v52.active{border-color:#111!important}.product-color-mini-item-v52:hover{border-color:#a8a8a8!important}
.product-color-mini-media-v52{width:48px!important;height:72px!important;overflow:hidden!important;background:#f5f5f3!important;display:block!important}.product-color-mini-media-v52 img,.product-color-mini-media-v52 video,.product-color-mini-media-v52 svg{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}
.product-color-mini-copy-v52{display:grid!important;gap:2px!important;min-width:0!important;padding-right:7px!important}.product-color-mini-copy-v52 small{font-size:8px!important;color:#858585!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.product-color-mini-copy-v52 strong{font-size:10px!important;font-weight:500!important;color:#111!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.product-color-mini-copy-v52 em{font-style:normal!important;font-size:8px!important;color:#666!important;display:flex!important;align-items:center!important;gap:4px!important}
.product-kpis-v52{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;border-top:1px solid #e5e5e5!important;border-bottom:1px solid #e5e5e5!important}.product-kpi-v52{min-height:104px!important;padding:16px 12px!important;border-right:1px solid #e5e5e5!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:5px!important}.product-kpi-v52:last-child{border-right:0!important}.product-kpi-v52>span{font-size:8px!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#777!important}.product-kpi-v52>strong{font-size:22px!important;font-weight:500!important;line-height:1!important;color:#111!important}.product-kpi-v52.price>strong{font-size:28px!important}.product-kpi-v52.discount>strong{font-size:26px!important}.product-kpi-v52>small{display:flex!important;align-items:center!important;gap:5px!important;font-size:8px!important;color:#777!important}
.product-lifecycle-v52{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border-bottom:1px solid #e5e5e5!important}.product-lifecycle-v52>div{padding:13px 12px!important;border-right:1px solid #e5e5e5!important;display:grid!important;gap:3px!important}.product-lifecycle-v52>div:last-child{border-right:0!important}.product-lifecycle-v52 span{font-size:8px!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#777!important}.product-lifecycle-v52 strong{font-size:13px!important;font-weight:500!important;color:#111!important}.product-lifecycle-v52 small{font-size:8px!important;color:#999!important}
.master-size-card-v52{margin:0 0 28px!important;border-top:1px solid #e5e5e5!important;border-bottom:1px solid #e5e5e5!important;border-left:0!important;border-right:0!important;border-radius:0!important;padding:0!important}.master-size-card-v52 .master-size-head{padding:16px 0!important}.master-size-card-v52 .master-size-table-wrap{border-top:1px solid #ececec!important}
.master-attributes-card-v52{border:0!important;border-radius:0!important;padding:0!important;margin-bottom:12px!important}.master-attributes-columns-v52{grid-template-columns:repeat(4,minmax(0,1fr))!important;border-top:1px solid #e5e5e5!important;margin-top:12px!important}.master-attributes-columns-v52>*{padding:14px 10px!important;border-bottom:1px solid #eee!important;border-right:1px solid #eee!important}.master-attributes-columns-v52>*:nth-child(4n){border-right:0!important}.master-bottom-grid-v52{margin-top:20px!important;border-top:1px solid #e5e5e5!important;border-bottom:1px solid #e5e5e5!important;gap:0!important}.master-bottom-grid-v52>div{border:0!important;border-right:1px solid #e5e5e5!important;border-radius:0!important}.master-bottom-grid-v52>div:last-child{border-right:0!important}
.sku-relations-v52{display:grid!important;gap:18px!important}.sku-relations-head-v52{padding-bottom:16px!important;border-bottom:1px solid #e5e5e5!important}.sku-relations-table-wrap-v52{overflow:auto!important;border-bottom:1px solid #e5e5e5!important}.sku-relations-table-v52{width:100%!important;border-collapse:collapse!important;min-width:980px!important}.sku-relations-table-v52 th{text-align:left!important;padding:10px 12px!important;border-bottom:1px solid #dcdcdc!important;font-size:8px!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#777!important;font-weight:500!important;background:#fafafa!important}.sku-relations-table-v52 td{padding:12px!important;border-bottom:1px solid #eee!important;vertical-align:middle!important;font-size:9px!important;color:#555!important}.sku-relations-table-v52 tbody tr{cursor:pointer!important}.sku-relations-table-v52 tbody tr:hover{background:#fafafa!important}.sku-relations-table-v52 td strong{display:block!important;font-size:10px!important;font-weight:500!important;color:#111!important;margin-top:2px!important}.sku-relations-table-v52 td small{display:block!important;font-size:8px!important;color:#888!important}.sku-relations-table-v52 td>button{width:28px!important;height:28px!important;border:1px solid #ddd!important;background:#fff!important;display:grid!important;place-items:center!important}.sku-placement-type-v52{display:inline-flex!important;align-items:center!important;min-height:22px!important;padding:0 7px!important;border:1px solid #d7d7d7!important;font-size:8px!important;letter-spacing:.05em!important;color:#333!important}.sku-relations-empty-v52{min-height:280px!important}
@media(max-width:1180px){.product-summary-v52{grid-template-columns:1fr!important}.product-color-mini-list-v52{grid-template-columns:repeat(4,minmax(0,1fr))!important}.product-kpis-v52{grid-template-columns:repeat(3,minmax(0,1fr))!important}.product-kpi-v52:nth-child(3n){border-right:0!important}.master-attributes-columns-v52{grid-template-columns:repeat(3,minmax(0,1fr))!important}.master-attributes-columns-v52>*:nth-child(4n){border-right:1px solid #eee!important}.master-attributes-columns-v52>*:nth-child(3n){border-right:0!important}}
@media(max-width:760px){.product-master-scroll-v52{padding:14px!important}.product-master-tabs-v52{padding:0 14px!important}.product-summary-v52{gap:18px!important}.product-color-mini-list-v52{grid-template-columns:repeat(2,minmax(0,1fr))!important}.product-kpis-v52{grid-template-columns:repeat(2,minmax(0,1fr))!important}.product-kpi-v52{border-right:1px solid #e5e5e5!important;border-bottom:1px solid #e5e5e5!important}.product-kpi-v52:nth-child(2n){border-right:0!important}.product-lifecycle-v52{grid-template-columns:1fr!important}.product-lifecycle-v52>div{border-right:0!important;border-bottom:1px solid #eee!important}.master-attributes-columns-v52{grid-template-columns:repeat(2,minmax(0,1fr))!important}.master-attributes-columns-v52>*{border-right:1px solid #eee!important}.master-attributes-columns-v52>*:nth-child(2n){border-right:0!important}.master-bottom-grid-v52{grid-template-columns:1fr!important}.master-bottom-grid-v52>div{border-right:0!important;border-bottom:1px solid #e5e5e5!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Product master tabs v52 applied: Product summary + SKU relations table');
