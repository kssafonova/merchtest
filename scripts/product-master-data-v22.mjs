import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PRODUCT_MASTER_DATA_V22';

if (!app.includes(MARKER)) {
  const markerAnchor = 'const ADJACENT_SECTION_INSERT_V21 = true;';
  if (!app.includes(markerAnchor)) throw new Error('PRODUCT_MASTER_DATA_V22: V21 marker missing');
  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;');

  const oldName = 'function EditableEntityModal(';
  if (!app.includes(oldName)) throw new Error('PRODUCT_MASTER_DATA_V22: EditableEntityModal not found');
  app = app.replace(oldName, 'function LegacyEditableEntityModal(');
  const legacyIndex = app.indexOf('function LegacyEditableEntityModal(');

  const modal = String.raw`
function productStatus(value, kind) {
  const number = Number(value || 0);
  if (kind === 'stock') {
    if (number <= 2) return { key: 'low', label: 'Низкий' };
    if (number <= 7) return { key: 'medium', label: 'Средний' };
    return { key: 'high', label: 'Высокий' };
  }
  if (number <= 1) return { key: 'low', label: 'Низкий' };
  if (number <= 5) return { key: 'medium', label: 'Средний' };
  return { key: 'high', label: 'Высокий' };
}

function splitMetric(total, weights) {
  const safeTotal = Math.max(0, Math.round(Number(total || 0)));
  if (!weights.length) return [];
  const raw = weights.map((weight) => safeTotal * weight);
  const values = raw.map((value) => Math.floor(value));
  let remainder = safeTotal - values.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction);
  let cursor = 0;
  while (remainder > 0) {
    values[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  return values;
}

function productSizeTemplate(entity) {
  const category = String(entity?.category || '').toLowerCase();
  const subcategory = String(entity?.subcategory || '').toLowerCase();
  const department = String(entity?.department || '').toLowerCase();
  if (category.includes('обув') || subcategory.includes('обув') || subcategory.includes('туф') || subcategory.includes('бот')) {
    return [
      { size: '36', grid: 'RU 36' }, { size: '37', grid: 'RU 37' }, { size: '38', grid: 'RU 38' }, { size: '39', grid: 'RU 39' }, { size: '40', grid: 'RU 40' }
    ];
  }
  if (category.includes('сум') || category.includes('аксесс') || subcategory.includes('сум') || subcategory.includes('аксесс')) {
    return [{ size: 'ONE SIZE', grid: 'ONE SIZE' }];
  }
  if (department.includes('дет') || department.includes('девоч') || department.includes('мальч')) {
    return [
      { size: '116', grid: '116 см' }, { size: '122', grid: '122 см' }, { size: '128', grid: '128 см' }, { size: '134', grid: '134 см' }, { size: '140', grid: '140 см' }
    ];
  }
  return [
    { size: 'XS', grid: 'RU 40' }, { size: 'S', grid: 'RU 42' }, { size: 'M', grid: 'RU 44' }, { size: 'L', grid: 'RU 46' }, { size: 'XL', grid: 'RU 48' }
  ];
}

function productSizeRows(entity, region) {
  if (Array.isArray(entity?.sizeRows) && entity.sizeRows.length) {
    return entity.sizeRows.map((row, index) => ({
      size: row.size || row.label || '—',
      grid: row.grid || row.sizeGrid || '—',
      sku: row.sku || row.id || entity.id + '-' + String(index + 1).padStart(2, '0'),
      stock: Number(row.stock ?? row.stockValue ?? 0),
      l7d: Number(row.l7d ?? row.salesL7d ?? 0),
    }));
  }
  const template = productSizeTemplate(entity);
  const weights = template.length === 1 ? [1] : [0.12, 0.22, 0.28, 0.23, 0.15];
  const stockTotal = Number(entity?.stock?.[region] ?? entity?.stockValue ?? 0);
  const l7dTotal = Number(entity?.l7d ?? 0);
  const stocks = splitMetric(stockTotal, weights);
  const sales = splitMetric(l7dTotal, weights);
  return template.map((item, index) => ({
    ...item,
    sku: entity.id + '-' + String(index + 1).padStart(2, '0'),
    stock: stocks[index] || 0,
    l7d: sales[index] || 0,
  }));
}

function StatusDot({ value, kind, withLabel = false }) {
  const status = productStatus(value, kind);
  return <span className={'master-status master-status-' + status.key}><i/>{withLabel && <em>{status.label}</em>}</span>;
}

function MasterKpi({ label, value, secondary, kind, hint }) {
  return <div className="master-kpi">
    <div className="master-kpi-label"><span>{label}</span>{kind && <StatusDot value={kind.value} kind={kind.type} withLabel/>}</div>
    <strong>{value}</strong>
    {secondary && <small>{secondary}</small>}
    {hint && <em className="master-kpi-hint">{hint}</em>}
  </div>;
}

function MasterAttribute({ label, value, source = 'PIM' }) {
  return <div className="master-attribute"><div><span>{label}</span><em>{source}</em></div><strong>{value === undefined || value === null || value === '' ? '—' : String(value)}</strong></div>;
}

function ProductMasterDataModal({ entity, region = 'RU', onClose }) {
  const images = editorImages(entity);
  const [activeImage, setActiveImage] = useState(0);
  const activeSrc = images[Math.min(activeImage, Math.max(images.length - 1, 0))] || '';
  const stock = Number(entity?.stock?.[region] ?? entity?.stockValue ?? 0);
  const l7d = Number(entity?.l7d ?? 0);
  const price = Number(entity?.price ?? 0);
  const sizeRows = productSizeRows(entity, region);
  const availableSizes = sizeRows.filter((row) => row.stock > 0).length;
  const hasRealSizeRows = Array.isArray(entity?.sizeRows) && entity.sizeRows.length > 0;
  const attributes = [
    ['Отдел', entity.department, 'PIM'], ['Пол / Гендер', entity.gender, 'PIM'], ['Категория', entity.category, 'PIM'], ['Подкатегория', entity.subcategory, 'PIM'],
    ['Коллекция', entity.collection, 'PIM'], ['Цвет', entity.color, 'PIM'], ['Материал', entity.material, 'PIM'], ['Силуэт / фасон', entity.silhouette, 'PIM'],
    ['Посадка', entity.fit, 'PIM'], ['Длина изделия', entity.length, 'PIM'], ['Длина рукава', entity.sleeveLength, 'PIM'], ['Возрастная группа', entity.ageGroup, 'PIM'],
    ['Детали', entity.details, 'PIM'], ['Цена', money(price), 'ERP'], ['Скидка', entity.discount ? entity.discount + '%' : '0%', 'ERP'], ['Новинка', entity.isNew ? 'Да' : 'Нет', 'PIM']
  ];
  return createPortal(<div className="product-master-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}>
    <div className="product-master-modal" onClick={(event) => event.stopPropagation()}>
      <header className="product-master-head">
        <div><span>КАРТОЧКА ТОВАРА · ТОЛЬКО ПРОСМОТР</span><strong>{entity.name}</strong><small>{entity.id + (entity.collection ? ' · ' + entity.collection : '') + (entity.color ? ' · ' + entity.color : '')}</small></div>
        <div><span className="master-data-pill">Мастер-данные</span><button className="product-master-close" onClick={onClose} aria-label="Закрыть"><X size={20}/></button></div>
      </header>

      <div className="product-master-scroll">
        <section className="product-master-overview">
          <aside className="product-master-gallery">
            <div className="product-master-thumbs">{images.slice(0, 6).map((src, index) => <button key={src + index} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><img src={src} alt={'Фото ' + (index + 1)}/></button>)}</div>
            <div className="product-master-hero">{activeSrc ? <img src={activeSrc} alt={entity.name}/> : <div className="product-master-noimage"><ImageIcon size={38}/><span>Нет изображения</span></div>}</div>
          </aside>

          <div className="product-master-info">
            <div className="master-identity-grid"><MasterAttribute label="Название" value={entity.name}/><MasterAttribute label="Артикул (SKU)" value={entity.id}/></div>
            <div className="master-kpi-grid">
              <MasterKpi label="Цена" value={money(price)} hint="Текущая цена"/>
              <MasterKpi label={'Остаток · ' + region} value={stock + ' шт'} secondary={money(stock * price)} kind={{ value: stock, type: 'stock' }}/>
              <MasterKpi label="Продажи L7D" value={l7d + ' шт'} secondary={money(l7d * price)} kind={{ value: l7d, type: 'l7d' }}/>
              <MasterKpi label="Размеров" value={availableSizes + '/' + sizeRows.length} secondary={availableSizes ? 'в наличии' : 'нет в наличии'} kind={{ value: availableSizes, type: 'stock' }}/>
            </div>

            <section className="master-attributes-card"><div className="master-section-title"><strong>Атрибуты</strong><span>Данные из PIM / ERP · редактирование недоступно</span></div><div className="master-attributes-grid">{attributes.map(([label, value, source]) => <MasterAttribute key={label} label={label} value={value} source={source}/>)}</div></section>
          </div>
        </section>

        <section className="master-size-card">
          <div className="master-size-head"><div><strong>Остатки и продажи по размерам</strong><small>{hasRealSizeRows ? 'Операционные данные · каждый размер — отдельный SKU' : 'Демо-распределение из общего остатка · подключите size-SKU из ERP для фактических строк'}</small></div><div className="master-legend"><span><i className="high"/>Высокий</span><span><i className="medium"/>Средний</span><span><i className="low"/>Низкий</span></div></div>
          <div className="master-size-table-wrap"><table className="master-size-table"><thead><tr><th>Размер</th><th>Размерная сетка</th><th>SKU</th><th>Остаток, шт</th><th>Остаток, ₽</th><th>L7D, шт</th><th>L7D, ₽</th></tr></thead><tbody>{sizeRows.map((row) => <tr key={row.sku}><td><strong>{row.size}</strong></td><td><span className="size-grid-pill">{row.grid}</span></td><td>{row.sku}</td><td><span className="master-table-metric"><StatusDot value={row.stock} kind="stock"/>{row.stock}</span></td><td>{money(row.stock * price)}</td><td><span className="master-table-metric"><StatusDot value={row.l7d} kind="l7d"/>{row.l7d}</span></td><td>{money(row.l7d * price)}</td></tr>)}</tbody><tfoot><tr><td colSpan="3">Итого по модели</td><td>{stock}</td><td>{money(stock * price)}</td><td>{l7d}</td><td>{money(l7d * price)}</td></tr></tfoot></table></div>
        </section>

        <section className="master-bottom-grid">
          <div><strong>Состав</strong><span>{entity.composition || entity.material || '—'}</span></div>
          <div><strong>Уход</strong><span>{entity.care || 'Данные ухода не переданы из PIM'}</span></div>
          <div><strong>Идентификация</strong><span>{entity.barcode ? 'Штрихкод: ' + entity.barcode : 'Штрихкод: —'}{entity.country ? ' · ' + entity.country : ''}</span></div>
        </section>
      </div>

      <footer className="product-master-footer"><span>Мастер-данные и операционные показатели меняются только в системе-источнике. Суммы в ₽ = текущая цена продажи × количество.</span><button onClick={onClose}>Закрыть</button></footer>
    </div>
  </div>, document.body);
}

function EditableEntityModal(props) {
  const entity = props.entity;
  const isProduct = Boolean(entity && Object.prototype.hasOwnProperty.call(entity, 'price'));
  return isProduct ? <ProductMasterDataModal {...props}/> : <LegacyEditableEntityModal {...props}/>;
}

`;

  app = app.slice(0, legacyIndex) + modal + app.slice(legacyIndex);
  app = app.replace(/title="Подробнее и редактировать"/g, 'title="Подробная информация"');
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* product-master-data-v22 */')) {
  css += String.raw`
/* product-master-data-v22 */
.product-master-backdrop{position:fixed;inset:0;z-index:13000;background:rgba(25,28,32,.42);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:12px}.product-master-modal{width:min(1460px,98vw);height:min(1040px,96vh);background:#fff;border-radius:22px;box-shadow:0 30px 90px rgba(14,18,25,.28);display:flex;flex-direction:column;overflow:hidden;color:#15171b}.product-master-head{min-height:96px;padding:17px 22px 15px 28px;border-bottom:1px solid #e6e7e9;display:flex;align-items:center;justify-content:space-between;gap:24px;background:#fff}.product-master-head>div:first-child{display:grid;gap:3px;min-width:0}.product-master-head>div:first-child>span{font-size:10px;letter-spacing:.13em;font-weight:800;color:#8a8d92}.product-master-head>div:first-child>strong{font-size:27px;line-height:1.05;letter-spacing:-.025em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-master-head>div:first-child>small{font-size:11px;color:#6f7379}.product-master-head>div:last-child{display:flex;align-items:center;gap:10px}.master-data-pill{height:34px;padding:0 13px;border:1px solid #dedfe1;border-radius:999px;background:#f7f7f6;display:flex;align-items:center;font-size:10px;font-weight:700;color:#55595f}.product-master-close{width:48px;height:48px;border:1px solid #dadcdf;border-radius:14px;background:#fff;display:grid;place-items:center;cursor:pointer;color:#14171b}.product-master-close:hover{background:#f5f6f7}.product-master-scroll{flex:1;min-height:0;overflow:auto;padding:16px 20px 18px}.product-master-overview{display:grid;grid-template-columns:350px minmax(0,1fr);gap:18px;align-items:start}.product-master-gallery{display:grid;grid-template-columns:62px minmax(0,1fr);gap:9px;min-width:0}.product-master-thumbs{display:flex;flex-direction:column;gap:8px}.product-master-thumbs button{width:62px;height:78px;padding:0;border:1px solid #e2e4e7;border-radius:10px;background:#f3f4f5;overflow:hidden;cursor:pointer}.product-master-thumbs button.active{border:2px solid #24272c}.product-master-thumbs img{width:100%;height:100%;object-fit:cover;display:block}.product-master-hero{height:430px;border-radius:14px;background:#f1f2f3;overflow:hidden;display:flex;align-items:center;justify-content:center}.product-master-hero>img{width:100%;height:100%;object-fit:contain;display:block}.product-master-noimage{display:grid;place-items:center;gap:8px;color:#9a9ea5;font-size:10px}.product-master-info{min-width:0;display:grid;gap:10px}.master-identity-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(220px,1fr);gap:8px}.master-identity-grid .master-attribute{min-height:54px;border:1px solid #e2e4e7;border-radius:12px;background:#fafaf9;padding:10px 12px}.master-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.master-kpi{position:relative;min-height:112px;border:1px solid #e0e2e5;border-radius:14px;background:#f6f6f4;padding:13px 14px;display:flex;flex-direction:column;justify-content:flex-start}.master-kpi-label{display:flex;align-items:center;justify-content:space-between;gap:8px}.master-kpi-label>span{font-size:10px;color:#6d7177}.master-kpi>strong{font-size:27px;line-height:1;margin-top:8px;letter-spacing:-.025em}.master-kpi>small{font-size:11px;color:#666b72;margin-top:10px}.master-kpi-hint{position:absolute;right:10px;bottom:10px;font-size:8px!important;font-style:normal;color:#23714d;background:#e7f5ed;border-radius:6px;padding:4px 6px}.master-status{display:inline-flex;align-items:center;gap:5px}.master-status i,.master-legend i{width:9px;height:9px;border-radius:50%;display:inline-block;flex:0 0 auto}.master-status em{font-size:8px;font-style:normal;font-weight:700}.master-status-high i,.master-legend i.high{background:#269b69}.master-status-high em{color:#237b55}.master-status-medium i,.master-legend i.medium{background:#cc891c}.master-status-medium em{color:#9b6512}.master-status-low i,.master-legend i.low{background:#cf4a4d}.master-status-low em{color:#a8383b}.master-attributes-card{border:1px solid #e1e3e6;border-radius:14px;overflow:hidden;background:#fff}.master-section-title{min-height:48px;padding:0 13px;border-bottom:1px solid #e4e5e7;background:#fafaf9;display:flex;align-items:center;justify-content:space-between;gap:12px}.master-section-title strong{font-size:13px}.master-section-title span{font-size:9px;color:#84888e}.master-attributes-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.master-attribute{min-width:0;padding:9px 11px;border-right:1px solid #ececef;border-bottom:1px solid #ececef}.master-attributes-grid .master-attribute:nth-child(4n){border-right:0}.master-attributes-grid .master-attribute:nth-last-child(-n+4){border-bottom:0}.master-attribute>div{display:flex;align-items:center;justify-content:space-between;gap:7px}.master-attribute span{font-size:9px;color:#7e8288}.master-attribute em{font-size:7px;font-style:normal;color:#a0a3a8;text-transform:uppercase}.master-attribute>strong{display:block;margin-top:3px;font-size:11px;line-height:1.25;white-space:normal;overflow-wrap:anywhere}.master-size-card{margin-top:14px;border:1px solid #dfe1e4;border-radius:14px;overflow:hidden;background:#fff}.master-size-head{min-height:64px;padding:11px 14px;border-bottom:1px solid #e1e3e6;background:#fafaf9;display:flex;align-items:center;justify-content:space-between;gap:16px}.master-size-head>div:first-child{display:grid;gap:3px}.master-size-head strong{font-size:14px}.master-size-head small{font-size:9px;color:#7d8187}.master-legend{display:flex;align-items:center;gap:15px;flex-shrink:0}.master-legend span{display:flex;align-items:center;gap:5px;font-size:8px;color:#70747a}.master-size-table-wrap{overflow:auto}.master-size-table{width:100%;border-collapse:collapse;min-width:900px}.master-size-table th{height:36px;padding:0 12px;text-align:left;font-size:8px;font-weight:700;color:#7b7f85;border-bottom:1px solid #ececef;background:#fff}.master-size-table td{height:42px;padding:0 12px;border-bottom:1px solid #ececef;font-size:10px;color:#1f2227}.master-size-table tbody tr:hover{background:#fafbfc}.master-size-table td>strong{font-size:11px}.master-table-metric{display:inline-flex;align-items:center;gap:8px}.size-grid-pill{display:inline-flex;align-items:center;height:24px;padding:0 9px;border:1px solid #dfe1e4;border-radius:999px;background:#fff;font-size:9px}.master-size-table tfoot td{font-weight:800;background:#f3f3f1;border-bottom:0}.master-bottom-grid{display:grid;grid-template-columns:1.1fr 1.1fr .9fr;gap:10px;margin-top:12px}.master-bottom-grid>div{min-height:76px;padding:13px 14px;border-radius:13px;background:#f7f7f5;display:grid;align-content:center;gap:6px}.master-bottom-grid strong{font-size:11px}.master-bottom-grid span{font-size:10px;line-height:1.45;color:#666b72}.product-master-footer{min-height:66px;border-top:1px solid #e2e4e7;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff}.product-master-footer>span{font-size:9px;color:#777c83}.product-master-footer>button{height:44px;padding:0 22px;border:1px solid #d8dade;border-radius:12px;background:#fff;font-size:16px;font-weight:700;cursor:pointer}.product-master-footer>button:hover{background:#f5f6f7}@media(max-width:1180px){.product-master-overview{grid-template-columns:300px minmax(0,1fr)}.product-master-gallery{grid-template-columns:52px minmax(0,1fr)}.product-master-thumbs button{width:52px;height:66px}.product-master-hero{height:380px}.master-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.master-attributes-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.master-attributes-grid .master-attribute:nth-child(4n){border-right:1px solid #ececef}.master-attributes-grid .master-attribute:nth-child(3n){border-right:0}.master-attributes-grid .master-attribute:nth-last-child(-n+4){border-bottom:1px solid #ececef}}@media(max-width:820px){.product-master-backdrop{padding:0}.product-master-modal{width:100vw;height:100vh;border-radius:0}.product-master-head{min-height:82px;padding:14px 14px 12px}.product-master-head>div:first-child>strong{font-size:21px}.master-data-pill{display:none}.product-master-overview{grid-template-columns:1fr}.product-master-gallery{grid-template-columns:1fr}.product-master-thumbs{order:2;flex-direction:row;overflow:auto}.product-master-thumbs button{flex:0 0 58px;width:58px;height:70px}.product-master-hero{height:430px}.master-identity-grid{grid-template-columns:1fr}.master-kpi-grid{grid-template-columns:1fr 1fr}.master-attributes-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.master-bottom-grid{grid-template-columns:1fr}.product-master-footer>span{display:none}}
`;
  writeFileSync(cssPath, css);
}

console.log('Product master data v22 applied');
