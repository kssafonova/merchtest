import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');

// Keep the current rules model safe after the layout transforms.
app = app.replace(
  /<span className=\{`mode-badge \$\{section\.rules\.mode\}`\}>\{section\.rules\.mode\.toUpperCase\(\)\}<\/span>/g,
  ''
);
app = app.replace(/section\.rules\.mode\.toUpperCase\(\)/g, "(section.rules.mode || 'AUTO').toUpperCase()");
if (app.includes('section.rules.mode.toUpperCase()')) throw new Error('Unsafe rules mode access remains');

// Multi-image index is referenced by cards but can be removed by later source transforms.
if (app.includes('<MediaIndex ') && !/function\s+MediaIndex\s*\(/.test(app)) {
  const at = app.indexOf('function ProductCard(');
  if (at < 0) throw new Error('ProductCard anchor not found');
  const helper = `function MediaIndex({ count = 0, active = 0, onChange }) {\n  if (!count || count <= 1) return null;\n  return <div className="media-index" onClick={(event) => event.stopPropagation()}>{Array.from({ length: count }, (_, index) => <button type="button" key={index} className={active === index ? 'active' : ''} onClick={(event) => { event.stopPropagation(); onChange?.(index); }}>{index + 1}</button>)}</div>;\n}\n\n`;
  app = app.slice(0, at) + helper + app.slice(at);
}

// Eye button: one modal for product, look and media, with view + edit modes.
if (!app.includes('ENTITY_EDITOR_V6')) {
  if (!app.includes("import { createPortal } from 'react-dom';")) {
    app = app.replace(/import React, \{([^}]+)\} from 'react';/, (match) => match + "\nimport { createPortal } from 'react-dom';");
  }
  const at = app.indexOf('function ProductCard(');
  if (at < 0) throw new Error('ProductCard anchor not found for entity editor');
  const editor = String.raw`const ENTITY_EDITOR_V6 = true;
function editorNumber(value) { const number = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(number) ? number : 0; }
function editorList(value) { return String(value || '').split(/\r?\n|\s*\|\s*|\s*,\s*/).map((item) => item.trim()).filter(Boolean); }
function editorImages(entity) { return entity?.images?.length ? entity.images.filter(Boolean) : entity?.image ? [entity.image] : entity?.src && entity.kind !== 'video' ? [entity.src] : []; }
function editorDraft(entity, region) { return {
  name: entity?.name || '', nameEn: entity?.nameEn || '', department: entity?.department || '', gender: entity?.gender || '', category: entity?.category || '', subcategory: entity?.subcategory || '', material: entity?.material || '', price: String(entity?.price ?? ''), discount: String(entity?.discount ?? ''), color: entity?.color || '', collection: entity?.collection || '', silhouette: entity?.silhouette || '', ageGroup: entity?.ageGroup || '', fit: entity?.fit || '', length: entity?.length || '', sleeveLength: entity?.sleeveLength || '', details: entity?.details || '', stock: String(entity?.stock?.[region] ?? entity?.stockValue ?? ''), l7d: String(entity?.l7d ?? ''), isNew: Boolean(entity?.isNew), productIds: (entity?.productIds || []).join('\n'), stockTotal: String(entity?.stockTotal ?? ''), kind: entity?.kind || 'image', file: entity?.file || '', src: entity?.src || entity?.image || '', images: editorImages(entity).join('\n')
}; }
function EditableEntityModal({ entity, region = 'RU', onClose }) {
  const isProduct = Boolean(entity && Object.prototype.hasOwnProperty.call(entity, 'price'));
  const isLook = entity?.kind === 'look';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => editorDraft(entity, region));
  const [saved, setSaved] = useState(false);
  const set = (key, value) => { setDraft((current) => ({ ...current, [key]: value })); setSaved(false); };
  const productFields = [['name','Название'],['department','Отдел'],['gender','Гендер'],['category','Категория'],['subcategory','Подкатегория'],['material','Материал'],['price','Цена','number'],['discount','Скидка, %','number'],['color','Цвет'],['collection','Коллекция'],['silhouette','Силуэт / фасон'],['ageGroup','Возрастная группа'],['fit','Посадка'],['length','Длина изделия'],['sleeveLength','Длина рукава'],['details','Детали','textarea'],['stock','Остаток · ' + region,'number'],['l7d','Продажи L7D','number'],['isNew','Новинка','boolean'],['images','Ссылки на фотографии','textarea']];
  const lookFields = [['name','Название RU'],['nameEn','Название EN'],['department','Отдел'],['collection','Коллекция'],['productIds','Артикулы товаров','textarea'],['stockTotal','Суммарный остаток','number'],['images','Ссылки на фотографии','textarea']];
  const mediaFields = [['name','Название'],['kind','Тип','kind'],['file','Имя файла'],['src','URL / источник','textarea']];
  const fields = isProduct ? productFields : isLook ? lookFields : mediaFields;
  const displayValue = (key) => {
    if (key === 'stock') return entity?.stock?.[region] ?? entity?.stockValue ?? 0;
    if (key === 'productIds') return (entity?.productIds || []).join(', ');
    if (key === 'images') return editorImages(entity).join('\n');
    if (key === 'isNew') return entity?.isNew ? 'Да' : 'Нет';
    if (key === 'kind') return CONTENT_LABELS[entity?.kind] || entity?.kind;
    if (key === 'price') return money(entity?.price || 0);
    return entity?.[key];
  };
  const save = () => {
    if (isProduct) {
      ['name','department','gender','category','subcategory','material','color','collection','silhouette','ageGroup','fit','length','sleeveLength','details'].forEach((key) => { entity[key] = String(draft[key] || '').trim(); });
      ['price','discount','l7d'].forEach((key) => { entity[key] = editorNumber(draft[key]); });
      entity.isNew = Boolean(draft.isNew);
      const stock = editorNumber(draft.stock); entity.stock = { ...(entity.stock || {}), [region]: stock }; if (region === 'RU' || entity.stockValue === undefined) entity.stockValue = stock;
      const images = editorList(draft.images); entity.images = images; entity.image = images[0] || '';
    } else if (isLook) {
      ['name','nameEn','department','collection'].forEach((key) => { entity[key] = String(draft[key] || '').trim(); });
      entity.productIds = editorList(draft.productIds); entity.productCount = entity.productIds.length; entity.stockTotal = editorNumber(draft.stockTotal);
      const images = editorList(draft.images); entity.images = images; entity.image = images[0] || '';
    } else {
      entity.name = String(draft.name || '').trim(); entity.kind = draft.kind; entity.file = String(draft.file || '').trim(); entity.src = String(draft.src || '').trim();
      if (entity.kind === 'video') { entity.image = ''; entity.images = []; } else { entity.image = entity.src; entity.images = entity.src ? [entity.src] : []; }
    }
    setEditing(false); setSaved(true);
  };
  const reset = () => { setDraft(editorDraft(entity, region)); setEditing(false); setSaved(false); };
  const previewUrls = editing && (isProduct || isLook) ? editorList(draft.images) : editorImages(entity);
  const previewSrc = isProduct || isLook ? previewUrls[0] : editing ? draft.src : entity?.src || entity?.image;
  const previewKind = isProduct || isLook ? 'image' : editing ? draft.kind : entity?.kind;
  const typeLabel = isProduct ? 'ТОВАР' : isLook ? 'ОБРАЗ' : 'МЕДИАФАЙЛ';
  return createPortal(<div className="entity-editor-backdrop" onClick={(event) => { event.stopPropagation(); onClose(); }}><div className="entity-editor-modal" onClick={(event) => event.stopPropagation()}>
    <div className="entity-editor-head"><div><span>{typeLabel}</span><strong>{entity?.name || entity?.file || entity?.id}</strong><small>{entity?.id}{isProduct ? ' · ' + region : ''}</small></div><div className="entity-editor-actions">{saved && !editing && <em>Сохранено</em>}{editing ? <><button onClick={reset}>Отмена</button><button className="primary" onClick={save}>Сохранить изменения</button></> : <button className="primary" onClick={() => { setDraft(editorDraft(entity, region)); setEditing(true); setSaved(false); }}>Редактировать</button>}<button className="close" onClick={onClose}><X size={18}/></button></div></div>
    <div className="entity-editor-body"><aside className="entity-editor-preview"><div>{previewKind === 'video' && previewSrc ? <video src={previewSrc} controls playsInline/> : previewSrc ? <img src={previewSrc} alt={entity?.name || ''}/> : <span className="empty"><ImageIcon size={34}/>Нет превью</span>}</div>{(isProduct || isLook) && previewUrls.length > 1 && <div className="thumbs">{previewUrls.slice(0, 6).map((src, index) => <img key={src + index} src={src} alt={'Фото ' + (index + 1)}/>)}</div>}<small>{editing ? 'Редактирование объекта' : 'Подробная информация'}</small></aside>
      <section className="entity-editor-fields"><div className="entity-editor-id"><span>{isProduct ? 'Артикул' : isLook ? 'ID образа' : 'ID'}</span><strong>{entity?.id}</strong></div><div className="entity-editor-grid">{fields.map(([key,label,type]) => editing ? <label className={(type === 'textarea' ? 'wide ' : '') + 'editor-field'} key={key}><span>{label}</span>{type === 'textarea' ? <textarea rows={key === 'images' || key === 'productIds' ? 5 : 3} value={draft[key]} onChange={(event) => set(key, event.target.value)}/> : type === 'boolean' ? <div className="toggle-field"><input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => set(key, event.target.checked)}/><b>{draft[key] ? 'Да' : 'Нет'}</b></div> : type === 'kind' ? <select value={draft[key]} onChange={(event) => set(key, event.target.value)}><option value="image">Изображение</option><option value="video">Видео</option><option value="svg">SVG</option></select> : <input type={type === 'number' ? 'number' : 'text'} value={draft[key]} onChange={(event) => set(key, event.target.value)}/>}</label> : <div className={(type === 'textarea' ? 'wide ' : '') + 'entity-view-field'} key={key}><span>{label}</span><strong>{String(displayValue(key) ?? '—')}</strong></div>)}</div></section>
    </div>
  </div></div>, document.body);
}

`;
  app = app.slice(0, at) + editor + app.slice(at);
  app = app.replace(/<EntityDetailsModal\s+/g, '<EditableEntityModal ');
  app = app.replace(/title="Полная информация"/g, 'title="Подробнее и редактировать"');
}

if (app.includes('<EntityDetailsModal ')) throw new Error('Old details modal reference remains');
if (app.includes('<EditableEntityModal ') && !/function\s+EditableEntityModal\s*\(/.test(app)) throw new Error('EditableEntityModal helper missing');

writeFileSync(appPath, app);

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* entity-editor-v6 */')) {
  css += `
/* entity-editor-v6 */
.entity-editor-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(19,22,28,.48);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px}.entity-editor-modal{width:min(1080px,94vw);height:min(760px,90vh);background:#fff;border-radius:12px;box-shadow:0 28px 80px rgba(15,19,28,.25);display:flex;flex-direction:column;overflow:hidden;color:#20242b}.entity-editor-head{min-height:70px;border-bottom:1px solid #e5e7eb;padding:13px 15px 12px 19px;display:flex;align-items:center;justify-content:space-between;gap:18px}.entity-editor-head>div:first-child{display:grid;gap:2px;min-width:0}.entity-editor-head span,.entity-editor-id span,.editor-field>span,.entity-view-field>span{font-size:7px;font-weight:850;letter-spacing:.08em;color:#838893;text-transform:uppercase}.entity-editor-head strong{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.entity-editor-head small{font-size:8px;color:#8a8f98}.entity-editor-actions{display:flex;align-items:center;gap:7px;flex-shrink:0}.entity-editor-actions button{height:34px;border:1px solid #dfe2e7;border-radius:6px;background:#fff;padding:0 11px;font-size:9px;font-weight:800;cursor:pointer}.entity-editor-actions button.primary{background:#17191e;color:#fff;border-color:#17191e}.entity-editor-actions button.close{width:34px;padding:0;display:grid;place-items:center}.entity-editor-actions em{font-style:normal;font-size:8px;color:#278553;background:#edf8f2;border-radius:999px;padding:5px 8px}.entity-editor-body{min-height:0;flex:1;display:grid;grid-template-columns:350px minmax(0,1fr)}.entity-editor-preview{background:#f7f8fa;border-right:1px solid #e7e9ed;padding:17px;overflow:auto}.entity-editor-preview>div:first-child{min-height:430px;background:#eef0f3;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}.entity-editor-preview img,.entity-editor-preview video{width:100%;height:100%;min-height:430px;max-height:535px;object-fit:contain}.entity-editor-preview .empty{display:grid;place-items:center;gap:8px;font-size:9px;color:#9297a0}.entity-editor-preview .thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:7px}.entity-editor-preview .thumbs img{min-height:0;aspect-ratio:1/1;object-fit:cover;border-radius:4px}.entity-editor-preview>small{display:block;margin-top:9px;font-size:8px;color:#8c919a}.entity-editor-fields{overflow:auto;padding:18px 20px 28px}.entity-editor-id{border-bottom:1px solid #eceef1;padding-bottom:13px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}.entity-editor-id strong{font-size:10px}.entity-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.editor-field,.entity-view-field{min-width:0;display:grid;gap:4px}.editor-field.wide,.entity-view-field.wide{grid-column:1/-1}.editor-field input,.editor-field select,.editor-field textarea{width:100%;box-sizing:border-box;border:1px solid #dfe2e7;border-radius:6px;background:#fff;color:#252931;font:inherit;font-size:10px;padding:8px 9px;outline:none}.editor-field input,.editor-field select{height:36px}.editor-field textarea{resize:vertical;min-height:74px;line-height:1.4}.editor-field input:focus,.editor-field select:focus,.editor-field textarea:focus{border-color:#7a9bd8;box-shadow:0 0 0 2px rgba(75,116,190,.08)}.entity-view-field{border:1px solid #e4e6ea;border-radius:7px;background:#fafbfc;padding:9px 10px}.entity-view-field strong{font-size:10px;line-height:1.42;font-weight:650;overflow-wrap:anywhere;white-space:pre-wrap}.toggle-field{height:36px;border:1px solid #dfe2e7;border-radius:6px;display:flex;align-items:center;gap:7px;padding:0 9px}.toggle-field b{font-size:9px}.entity-details-trigger{z-index:6!important;cursor:pointer!important}
@media(max-width:860px){.entity-editor-backdrop{padding:10px}.entity-editor-modal{width:98vw;height:95vh}.entity-editor-body{grid-template-columns:1fr}.entity-editor-preview{border-right:0;border-bottom:1px solid #e7e9ed}.entity-editor-preview>div:first-child{min-height:260px}.entity-editor-preview img,.entity-editor-preview video{min-height:260px;max-height:320px}.entity-editor-grid{grid-template-columns:1fr}.editor-field.wide,.entity-view-field.wide{grid-column:auto}}
`;
  writeFileSync(cssPath, css);
}

console.log('Runtime hotfix v5.1: safe rules, MediaIndex, editable details modal');
