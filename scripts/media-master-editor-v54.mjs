import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'MEDIA_MASTER_EDITOR_V54';

if (!app.includes(MARKER)) {
  const anchor = 'const LOOK_MASTER_EDITOR_V53 = true;';
  if (!app.includes(anchor)) throw new Error('MEDIA_MASTER_EDITOR_V54: V53 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const editableStart = app.indexOf('function EditableEntityModal(props) {');
  const legacyStart = editableStart >= 0 ? app.indexOf('function LegacyEditableEntityModal(', editableStart) : -1;
  if (editableStart < 0 || legacyStart < 0) throw new Error('MEDIA_MASTER_EDITOR_V54: modal dispatch boundaries missing');

  const mediaModal = String.raw`
function mediaFileFormatV54(entity, replacementFile = null) {
  const source = replacementFile?.name || entity?.file || entity?.src || entity?.image || '';
  const clean = String(source).split('?')[0];
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  return ext ? ext.toUpperCase() : String(entity?.kind || 'MEDIA').toUpperCase();
}

function mediaKindFromFileV54(file, fallback = 'image') {
  if (!file) return fallback;
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  if (type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video';
  if (type.includes('svg') || /\.svg$/i.test(name)) return 'svg';
  return 'image';
}

function mediaHumanSizeV54(bytes) {
  const value = Number(bytes || 0);
  if (!value) return '—';
  if (value < 1024) return value + ' Б';
  if (value < 1024 * 1024) return Math.round(value / 102.4) / 10 + ' КБ';
  return Math.round(value / 1024 / 102.4) / 10 + ' МБ';
}

function mediaPublicationLocationsV54(entity, context) {
  const direct = lookPublicationLocationsV53(entity, context).map((row) => ({ ...row, usageContext: 'Прямое размещение' }));
  const keys = new Set(direct.map((row) => row.key + ':direct'));
  const rows = direct.map((row) => ({ ...row, key: row.key + ':direct' }));
  const entityFile = String(entity?.file || '');
  const entitySrc = String(entity?.src || entity?.image || '');
  const looks = CONTENT.filter((item) => item?.kind === 'look');
  looks.forEach((look) => {
    const mediaIds = Array.isArray(look.mediaIds) ? look.mediaIds.map(String) : [];
    const sources = [look.image, ...(look.images || []), look.imageFile, ...(look.imageFiles || [])].filter(Boolean).map(String);
    const linked = mediaIds.includes(String(entity.id)) || (entityFile && sources.some((value) => value.endsWith(entityFile))) || (entitySrc && sources.includes(entitySrc));
    if (!linked) return;
    lookPublicationLocationsV53(look, context).forEach((placement) => {
      const key = placement.key + ':look:' + look.id;
      if (keys.has(key)) return;
      keys.add(key);
      rows.push({ ...placement, key, usageContext: 'Через образ ' + look.id, viaLook: look.id });
    });
  });
  return rows;
}

function mediaLinkOptionsV54(type, query, region) {
  const q = String(query || '').trim().toLowerCase();
  if (type === 'product') {
    return PRODUCTS.filter((product) => !q || [product.id, product.name, product.color, product.category].some((value) => String(value || '').toLowerCase().includes(q))).slice(0, 40).map((product) => ({ value: product.id, label: product.name || product.id, meta: [product.id, product.color].filter(Boolean).join(' · ') }));
  }
  if (type === 'category') {
    const categories = Array.from(new Set(PRODUCTS.flatMap((product) => [product.category, product.subcategory]).filter(Boolean)));
    return categories.filter((value) => !q || String(value).toLowerCase().includes(q)).slice(0, 40).map((value) => ({ value, label: value, meta: 'Категория каталога' }));
  }
  if (type === 'page') {
    const tree = PRODUCT_MASTER_RUNTIME_V50?.siteTrees?.[region] || [];
    const pages = lookPageDescriptorsV53(tree, PRODUCT_MASTER_RUNTIME_V50?.locale || 'ru');
    return pages.filter((page) => !q || [page.name, page.path].some((value) => String(value || '').toLowerCase().includes(q))).slice(0, 60).map((page) => ({ value: page.id, label: page.name, meta: page.path }));
  }
  return [];
}

function MediaMasterDataModalV54({ entity, region = 'RU', onClose }) {
  const [activeTabV54, setActiveTabV54] = useState('media');
  const [draftName, setDraftName] = useState(entity?.name || '');
  const [draftCaption, setDraftCaption] = useState(entity?.caption || entity?.imageCaption || '');
  const [replacementFile, setReplacementFile] = useState(null);
  const [replacementUrl, setReplacementUrl] = useState('');
  const [dimensions, setDimensions] = useState({ width: Number(entity?.width || 0), height: Number(entity?.height || 0) });
  const [seoTitle, setSeoTitle] = useState(entity?.seoTitle || entity?.seo?.title || entity?.name || '');
  const [seoAlt, setSeoAlt] = useState(entity?.altText || entity?.alt || entity?.seo?.alt || entity?.name || '');
  const [seoDescription, setSeoDescription] = useState(entity?.seoDescription || entity?.seo?.description || '');
  const [seoIndex, setSeoIndex] = useState(entity?.seoIndex !== false && entity?.seo?.index !== false);
  const [linkType, setLinkType] = useState(entity?.link?.type || 'url');
  const [linkValue, setLinkValue] = useState(entity?.link?.value || entity?.href || '');
  const [linkNewTab, setLinkNewTab] = useState(Boolean(entity?.link?.newTab || entity?.target === '_blank'));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [savedV54, setSavedV54] = useState(false);

  const currentSrc = replacementUrl || entity?.src || entity?.image || entity?.images?.[0] || '';
  const draftKind = replacementFile ? mediaKindFromFileV54(replacementFile, entity?.kind || 'image') : entity?.kind || 'image';
  const format = mediaFileFormatV54(entity, replacementFile);
  const fallbackOrientation = entityRatioOrientationV30(entity);
  const orientation = dimensions.width && dimensions.height ? (dimensions.width > dimensions.height ? 'landscape' : 'portrait') : fallbackOrientation;
  const publications = mediaPublicationLocationsV54(entity, PRODUCT_MASTER_RUNTIME_V50);
  const fileSize = replacementFile?.size || entity?.fileSize || entity?.size || 0;
  const linkOptions = mediaLinkOptionsV54(linkType, pickerQuery, region);
  const selectedLinkOption = mediaLinkOptionsV54(linkType, '', region).find((option) => String(option.value) === String(linkValue));
  const linkTypeLabel = { url: 'URL', product: 'Товар', category: 'Категория', page: 'Страница' }[linkType] || 'URL';

  const onReplacement = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReplacementFile(file);
    setReplacementUrl(url);
    setDimensions({ width: 0, height: 0 });
    setSavedV54(false);
  };

  const saveMedia = () => {
    entity.name = draftName.trim() || entity.name;
    entity.caption = draftCaption.trim();
    entity.seoTitle = seoTitle.trim();
    entity.altText = seoAlt.trim();
    entity.seoDescription = seoDescription.trim();
    entity.seoIndex = seoIndex;
    entity.seo = { title: entity.seoTitle, alt: entity.altText, description: entity.seoDescription, index: entity.seoIndex };
    entity.link = linkValue ? { type: linkType, value: linkValue, newTab: linkNewTab } : null;
    entity.href = linkType === 'url' ? linkValue : '';
    entity.target = linkNewTab && linkValue ? '_blank' : '_self';
    if (replacementFile && replacementUrl) {
      entity.kind = draftKind;
      entity.file = replacementFile.name;
      entity.src = replacementUrl;
      entity.image = draftKind === 'video' ? '' : replacementUrl;
      entity.images = draftKind === 'video' ? [] : [replacementUrl];
      entity.fileSize = replacementFile.size;
      entity.mimeType = replacementFile.type;
      entity.source = 'Загружено';
      if (dimensions.width) entity.width = dimensions.width;
      if (dimensions.height) entity.height = dimensions.height;
      entity.orientation = orientation;
    }
    setSavedV54(true);
  };

  const navigateToPublication = (placement) => {
    PRODUCT_MASTER_RUNTIME_V50?.navigate?.(placement.market, placement.pageId, placement.sectionId);
    onClose();
  };

  return createPortal(<div className="media-master-layer-v54" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="media-master-modal-v54" onClick={(event) => event.stopPropagation()}>
      <header className="media-master-head-v54">
        <div><span>МЕДИА · ASSET MASTER</span><strong>{draftName || entity.id}</strong><small>{entity.id + ' · ' + format}</small></div>
        <button onClick={onClose} aria-label="Закрыть"><X size={19}/></button>
      </header>

      <nav className="media-master-tabs-v54" aria-label="Разделы карточки медиа">
        <button className={activeTabV54 === 'media' ? 'active' : ''} onClick={() => setActiveTabV54('media')}>Медиа</button>
        <button className={activeTabV54 === 'relations' ? 'active' : ''} onClick={() => setActiveTabV54('relations')}>Связи медиа <em>{publications.length}</em></button>
      </nav>

      <div className="media-master-scroll-v54">
        {activeTabV54 === 'media' ? <>
          <section className="media-master-summary-v54">
            <div className={'media-master-preview-v54 ' + (orientation === 'landscape' ? 'landscape' : 'portrait')}>
              {currentSrc ? draftKind === 'video' ? <video src={currentSrc} controls onLoadedMetadata={(event) => setDimensions({ width: event.currentTarget.videoWidth || 0, height: event.currentTarget.videoHeight || 0 })}/> : <img src={currentSrc} alt={seoAlt || draftName} onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth || 0, height: event.currentTarget.naturalHeight || 0 })}/> : <div className="media-master-empty-v54"><ImageIcon size={34}/><span>Медиа не загружено</span></div>}
              <div className="media-master-preview-meta-v54"><span>{format}</span><span>{orientation === 'landscape' ? '3:2' : '2:3'}</span></div>
            </div>

            <div className="media-master-summary-info-v54">
              <div className="media-replace-v54">
                <div><span>ФАЙЛ</span><strong>Текущее медиа</strong><small>{replacementFile ? replacementFile.name : entity.file || 'Файл без имени'}</small></div>
                <label className="media-upload-button-v54"><Plus size={14}/>Заменить медиа<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm" onChange={onReplacement}/></label>
              </div>
              <div className="media-kpis-v54">
                <div><span>Тип</span><strong>{draftKind === 'video' ? 'Видео' : draftKind === 'svg' ? 'SVG' : 'Изображение'}</strong></div>
                <div><span>Формат</span><strong>{format}</strong></div>
                <div><span>Ориентация</span><strong>{orientation === 'landscape' ? '3:2' : '2:3'}</strong></div>
                <div><span>Размер</span><strong>{dimensions.width && dimensions.height ? dimensions.width + '×' + dimensions.height : '—'}</strong></div>
                <div><span>Вес файла</span><strong>{mediaHumanSizeV54(fileSize)}</strong></div>
                <div><span>Размещений</span><strong>{publications.length}</strong><small>страницы / секции</small></div>
              </div>
              <div className="media-basic-fields-v54">
                <label><span>Название</span><input value={draftName} onChange={(event) => { setDraftName(event.target.value); setSavedV54(false); }}/></label>
                <label><span>Подпись медиа</span><input value={draftCaption} onChange={(event) => { setDraftCaption(event.target.value); setSavedV54(false); }}/></label>
              </div>
            </div>
          </section>

          <section className="media-link-card-v54">
            <div className="media-section-head-v54"><div><span>ССЫЛКА</span><strong>Переход по клику на медиа</strong></div><small>URL или внутренняя сущность витрины</small></div>
            <div className="media-link-builder-v54">
              <label className="media-link-type-v54"><span>Тип ссылки</span><select value={linkType} onChange={(event) => { setLinkType(event.target.value); setLinkValue(''); setPickerQuery(''); setPickerOpen(false); setSavedV54(false); }}><option value="url">URL</option><option value="product">Товар</option><option value="category">Категория</option><option value="page">Страница</option></select></label>
              {linkType === 'url' ? <label className="media-link-target-v54"><span>Адрес</span><input value={linkValue} placeholder="https://example.com/..." onChange={(event) => { setLinkValue(event.target.value); setSavedV54(false); }}/></label> : <div className="media-link-picker-v54">
                <span>Цель ссылки</span>
                <button className={'media-link-picker-trigger-v54 ' + (pickerOpen ? 'open' : '')} onClick={() => setPickerOpen((value) => !value)}><span>{selectedLinkOption ? selectedLinkOption.label : 'Выбрать...'}</span><ChevronDown size={15}/></button>
                {pickerOpen && <div className="media-link-picker-popover-v54">
                  <div className="media-link-picker-search-v54"><Search size={17}/><input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder={linkType === 'product' ? 'Название товара или SKU' : linkType === 'category' ? 'Название категории' : 'Название страницы'}/></div>
                  <div className="media-link-picker-results-v54">{linkOptions.length ? linkOptions.map((option) => <button key={option.value} className={String(option.value) === String(linkValue) ? 'active' : ''} onClick={() => { setLinkValue(option.value); setPickerOpen(false); setPickerQuery(''); setSavedV54(false); }}><strong>{option.label}</strong><small>{option.meta}</small></button>) : <div className="media-link-picker-empty-v54">Начните вводить, чтобы найти {linkType === 'product' ? 'товар' : linkType === 'category' ? 'категорию' : 'страницу'}</div>}</div>
                </div>}
              </div>}
              <label className="media-new-tab-v54"><input type="checkbox" checked={linkNewTab} onChange={(event) => { setLinkNewTab(event.target.checked); setSavedV54(false); }}/><i/>
                <span>Открывать в новой вкладке</span></label>
              {linkValue && <div className="media-link-summary-v54"><span>{linkTypeLabel}</span><strong>{selectedLinkOption?.label || linkValue}</strong><button onClick={() => { setLinkValue(''); setSavedV54(false); }}><X size={12}/></button></div>}
            </div>
          </section>

          <section className="media-seo-v54">
            <div className="media-section-head-v54"><div><span>SEO</span><strong>Метаданные медиа</strong></div><small>Для доступности, поиска и публикации</small></div>
            <div className="media-seo-grid-v54">
              <label><span>SEO Title</span><input value={seoTitle} maxLength={70} onChange={(event) => { setSeoTitle(event.target.value); setSavedV54(false); }}/><small>{seoTitle.length}/70</small></label>
              <label><span>Alt-текст</span><input value={seoAlt} maxLength={125} onChange={(event) => { setSeoAlt(event.target.value); setSavedV54(false); }}/><small>{seoAlt.length}/125</small></label>
              <label className="wide"><span>Description</span><textarea value={seoDescription} maxLength={180} onChange={(event) => { setSeoDescription(event.target.value); setSavedV54(false); }}/><small>{seoDescription.length}/180</small></label>
              <label className="media-seo-index-v54"><span>Индексация</span><button className={seoIndex ? 'active' : ''} onClick={() => { setSeoIndex((value) => !value); setSavedV54(false); }}><i/>{seoIndex ? 'INDEX' : 'NOINDEX'}</button></label>
            </div>
          </section>
        </> : <section className="media-relations-v54">
          <div className="media-relations-head-v54"><div><span>STOREFRONT USAGE</span><strong>Где используется это медиа</strong><small>{entity.id + ' · ' + format}</small></div><em>{publications.length} размещений</em></div>
          {publications.length ? <div className="media-relations-table-wrap-v54"><table className="media-relations-table-v54"><thead><tr><th>Регион</th><th>Страница / раздел</th><th>Секция</th><th>Слот</th><th>Размещение</th><th>Контекст</th><th></th></tr></thead><tbody>{publications.map((placement) => <tr key={placement.key} onClick={() => navigateToPublication(placement)}><td><strong>{placement.market}</strong></td><td><small>{placement.pagePath}</small><strong>{placement.pageName}</strong></td><td><small>{'Секция ' + (placement.sectionIndex + 1)}</small><strong>{placement.sectionName}</strong></td><td>{placement.slotIndex + 1}</td><td><span>{placement.placementType}</span></td><td>{placement.usageContext}</td><td><button title="Открыть размещение"><ChevronRight size={15}/></button></td></tr>)}</tbody></table></div> : <div className="media-relations-empty-v54"><strong>Медиа ещё не размещено на страницах</strong><span>Список формируется по всем регионам, страницам, секциям и слотам прототипа.</span></div>}
        </section>}
      </div>

      <footer className="media-master-footer-v54"><span>{savedV54 ? 'Сохранено' : replacementFile ? 'Выбрано новое медиа · сохраните изменения' : 'Изменения сохраняются локально в прототипе'}</span><div><button onClick={onClose}>Закрыть</button><button className="primary" onClick={saveMedia}>Сохранить</button></div></footer>
    </div>
  </div>, document.body);
}

`;

  app = app.slice(0, editableStart) + mediaModal + app.slice(editableStart);

  const dispatchStart = app.indexOf('function EditableEntityModal(props) {');
  const dispatchEnd = app.indexOf('function LegacyEditableEntityModal(', dispatchStart);
  const dispatch = String.raw`function EditableEntityModal(props) {
  const entity = props.entity;
  const isProduct = Boolean(entity && Object.prototype.hasOwnProperty.call(entity, 'price'));
  const isLook = entity?.kind === 'look';
  if (isProduct) return <ProductMasterDataModal {...props}/>;
  if (isLook) return <LookMasterDataModalV53 {...props}/>;
  return <MediaMasterDataModalV54 {...props}/>;
}

`;
  app = app.slice(0, dispatchStart) + dispatch + app.slice(dispatchEnd);
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* media-master-editor-v54 */')) {
  css += String.raw`
/* media-master-editor-v54 */
.media-master-layer-v54{position:fixed;inset:0;z-index:15100;background:rgba(18,18,18,.34);display:flex;align-items:center;justify-content:center;padding:18px}.media-master-modal-v54{width:min(1320px,94vw);height:min(900px,94vh);background:#fff;display:flex;flex-direction:column;overflow:hidden;border:1px solid #d9d9d9;box-shadow:0 26px 72px rgba(0,0,0,.18);color:#111}.media-master-head-v54{min-height:78px;padding:16px 20px 13px 24px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;justify-content:space-between;gap:18px}.media-master-head-v54>div{display:grid;gap:3px;min-width:0}.media-master-head-v54 span,.media-section-head-v54 span,.media-relations-head-v54 span{font-size:9px;letter-spacing:.08em;font-weight:600;color:#777}.media-master-head-v54 strong{font-size:22px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.media-master-head-v54 small{font-size:10px;color:#777}.media-master-head-v54>button{width:32px;height:32px;border:0;background:#fff;display:grid;place-items:center}.media-master-tabs-v54{height:48px;border-bottom:1px solid #e5e5e5;display:flex;padding:0 24px;gap:28px;flex:0 0 auto}.media-master-tabs-v54 button{height:48px;border:0;border-bottom:2px solid transparent;background:#fff;padding:0;font-size:12px;font-weight:500;color:#777}.media-master-tabs-v54 button.active{color:#111;border-bottom-color:#111}.media-master-tabs-v54 em{margin-left:6px;font-style:normal;font-size:9px;padding:2px 5px;background:#f1f1f1}.media-master-scroll-v54{flex:1;min-height:0;overflow-y:auto;padding:24px 26px 40px;scrollbar-width:thin}.media-master-summary-v54{display:grid;grid-template-columns:minmax(330px,.85fr) minmax(0,1.15fr);gap:28px;align-items:start}.media-master-preview-v54{position:relative;background:#f6f6f4;overflow:hidden;max-height:540px}.media-master-preview-v54.portrait{aspect-ratio:2/3;max-width:440px}.media-master-preview-v54.landscape{aspect-ratio:3/2;width:100%}.media-master-preview-v54 img,.media-master-preview-v54 video{width:100%;height:100%;object-fit:contain;display:block}.media-master-empty-v54{height:100%;display:grid;place-items:center;align-content:center;gap:8px;color:#999}.media-master-preview-meta-v54{position:absolute;right:9px;bottom:9px;display:grid;gap:3px}.media-master-preview-meta-v54 span{background:rgba(255,255,255,.94);padding:5px 8px;font-size:8px;font-weight:600;letter-spacing:.04em}.media-master-summary-info-v54{display:grid;gap:20px}.media-replace-v54{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:1px solid #e5e5e5}.media-replace-v54>div{display:grid;gap:3px}.media-replace-v54>div span{font-size:8px;letter-spacing:.08em;color:#777}.media-replace-v54>div strong{font-size:16px;font-weight:500}.media-replace-v54>div small{font-size:10px;color:#777}.media-upload-button-v54{height:36px;border:1px solid #111;background:#111;color:#fff;padding:0 12px;display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600;cursor:pointer}.media-upload-button-v54 input{display:none}.media-kpis-v54{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5}.media-kpis-v54>div{min-height:86px;padding:13px 14px;border-right:1px solid #e5e5e5;display:grid;align-content:start;gap:5px}.media-kpis-v54>div:nth-child(3n){border-right:0}.media-kpis-v54>div:nth-child(n+4){border-top:1px solid #e5e5e5}.media-kpis-v54 span{font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:#777}.media-kpis-v54 strong{font-size:21px;font-weight:500}.media-kpis-v54 small{font-size:9px;color:#777}.media-basic-fields-v54,.media-seo-grid-v54{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 22px}.media-basic-fields-v54 label,.media-seo-grid-v54 label{display:grid;gap:6px;position:relative}.media-basic-fields-v54 label>span,.media-seo-grid-v54 label>span,.media-link-builder-v54 label>span,.media-link-picker-v54>span{font-size:8px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#666}.media-basic-fields-v54 input,.media-seo-grid-v54 input,.media-link-builder-v54 input,.media-link-builder-v54 select{height:38px;border:0;border-bottom:1px solid #bfbfbf;background:#fff;padding:0 2px;font-size:12px;outline:none;border-radius:0}.media-basic-fields-v54 input:focus,.media-seo-grid-v54 input:focus,.media-link-builder-v54 input:focus,.media-link-builder-v54 select:focus{border-bottom-color:#111}.media-section-head-v54,.media-relations-head-v54{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}.media-section-head-v54>div,.media-relations-head-v54>div{display:grid;gap:4px}.media-section-head-v54 strong,.media-relations-head-v54 strong{font-size:17px;font-weight:500}.media-section-head-v54 small,.media-relations-head-v54 small{font-size:9px;color:#888}.media-link-card-v54,.media-seo-v54{margin-top:32px;padding-top:23px;border-top:1px solid #e5e5e5}.media-link-builder-v54{display:grid;grid-template-columns:180px minmax(0,1fr);gap:17px 24px;align-items:end;position:relative}.media-link-type-v54,.media-link-target-v54{display:grid;gap:6px}.media-link-picker-v54{position:relative;display:grid;gap:6px}.media-link-picker-trigger-v54{height:40px;border:1px solid #bdbdbd;background:#fff;padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-size:12px;text-align:left}.media-link-picker-trigger-v54.open{border-color:#111}.media-link-picker-popover-v54{position:absolute;top:49px;left:0;right:0;z-index:25;background:#fff;border:1px solid #aaa;box-shadow:0 10px 26px rgba(0,0,0,.14);padding:12px}.media-link-picker-search-v54{height:42px;border:1px solid #bbb;display:flex;align-items:center;gap:9px;padding:0 11px}.media-link-picker-search-v54 input{height:38px!important;border:0!important;flex:1;font-size:12px}.media-link-picker-results-v54{max-height:260px;overflow:auto;margin-top:10px;border-top:1px solid #e5e5e5}.media-link-picker-results-v54>button{width:100%;min-height:50px;border:0;border-bottom:1px solid #eee;background:#fff;padding:8px 6px;text-align:left;display:grid;gap:3px}.media-link-picker-results-v54>button:hover,.media-link-picker-results-v54>button.active{background:#f7f7f5}.media-link-picker-results-v54 strong{font-size:11px;font-weight:500}.media-link-picker-results-v54 small{font-size:8px;color:#777}.media-link-picker-empty-v54{min-height:110px;display:grid;place-items:center;color:#999;font-size:11px}.media-new-tab-v54{grid-column:1/-1;display:flex!important;align-items:center;gap:9px;cursor:pointer}.media-new-tab-v54 input{position:absolute;opacity:0;pointer-events:none}.media-new-tab-v54 i{width:17px;height:17px;border:1px solid #999;display:grid;place-items:center}.media-new-tab-v54 input:checked+i:after{content:'✓';font-size:13px;color:#111}.media-new-tab-v54 span{font-size:11px!important;text-transform:none!important;letter-spacing:0!important;color:#222!important}.media-link-summary-v54{grid-column:1/-1;min-height:42px;background:#fafafa;border-left:2px solid #111;padding:7px 10px;display:grid;grid-template-columns:70px minmax(0,1fr) 24px;align-items:center;gap:10px}.media-link-summary-v54 span{font-size:8px;color:#777}.media-link-summary-v54 strong{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.media-link-summary-v54 button{border:0;background:transparent;display:grid;place-items:center}.media-seo-grid-v54 .wide{grid-column:1/-1}.media-seo-grid-v54 textarea{min-height:84px;border:0;border-bottom:1px solid #bfbfbf;resize:vertical;padding:8px 2px;font:inherit;font-size:12px;outline:none}.media-seo-grid-v54 label>small{position:absolute;right:0;bottom:-13px;font-size:7px;color:#999}.media-seo-index-v54{align-content:end}.media-seo-index-v54 button{width:max-content;height:34px;border:1px solid #bbb;background:#fff;padding:0 10px;display:flex;align-items:center;gap:7px;font-size:9px}.media-seo-index-v54 button i{width:7px;height:7px;border-radius:50%;background:#999}.media-seo-index-v54 button.active i{background:#2e7d32}.media-relations-head-v54 em{font-style:normal;font-size:10px;color:#666}.media-relations-table-wrap-v54{overflow:auto;border-top:1px solid #111}.media-relations-table-v54{width:100%;border-collapse:collapse;min-width:900px}.media-relations-table-v54 th{height:40px;padding:0 10px;border-bottom:1px solid #ddd;text-align:left;font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:#777;font-weight:600}.media-relations-table-v54 td{padding:11px 10px;border-bottom:1px solid #eee;font-size:10px;vertical-align:middle}.media-relations-table-v54 tbody tr{cursor:pointer}.media-relations-table-v54 tbody tr:hover{background:#fafafa}.media-relations-table-v54 td>small,.media-relations-table-v54 td>strong{display:block}.media-relations-table-v54 td>small{font-size:8px;color:#888;margin-bottom:3px}.media-relations-table-v54 td>strong{font-size:10px;font-weight:500}.media-relations-table-v54 td:last-child button{border:0;background:transparent}.media-relations-empty-v54{min-height:280px;display:grid;place-items:center;align-content:center;gap:7px;text-align:center;color:#888}.media-relations-empty-v54 strong{color:#111;font-size:15px;font-weight:500}.media-relations-empty-v54 span{font-size:10px}.media-master-footer-v54{min-height:58px;border-top:1px solid #e5e5e5;padding:0 20px 0 24px;display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fff}.media-master-footer-v54>span{font-size:9px;color:#777}.media-master-footer-v54>div{display:flex;gap:8px}.media-master-footer-v54 button{height:34px;padding:0 13px;border:1px solid #ccc;background:#fff;font-size:9px;font-weight:600}.media-master-footer-v54 button.primary{background:#111;color:#fff;border-color:#111}
@media(max-width:1023px){.media-master-modal-v54{width:96vw}.media-master-summary-v54{grid-template-columns:1fr}.media-master-preview-v54{max-width:520px}.media-kpis-v54{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:640px){.media-master-layer-v54{padding:0}.media-master-modal-v54{width:100vw;height:100vh;max-height:none;border:0}.media-master-scroll-v54{padding:16px}.media-kpis-v54{grid-template-columns:repeat(2,minmax(0,1fr))}.media-kpis-v54>div:nth-child(3n){border-right:1px solid #e5e5e5}.media-kpis-v54>div:nth-child(2n){border-right:0}.media-basic-fields-v54,.media-seo-grid-v54{grid-template-columns:1fr}.media-seo-grid-v54 .wide{grid-column:auto}.media-link-builder-v54{grid-template-columns:1fr}.media-new-tab-v54,.media-link-summary-v54{grid-column:auto}.media-master-footer-v54>span{display:none}}
`;
  writeFileSync(cssPath, css);
}

console.log('Media master editor v54 applied: editable media, upload replacement, Russian link picker, SEO, metrics and relations');
