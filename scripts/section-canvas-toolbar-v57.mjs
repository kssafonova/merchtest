import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SECTION_CANVAS_TOOLBAR_V57';

function functionChunk(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(MARKER + ': function ' + name + ' missing');
  const end = source.indexOf('\nfunction ', start + name.length + 10);
  if (end < 0) throw new Error(MARKER + ': end of ' + name + ' missing');
  return { start, end, chunk: source.slice(start, end) };
}

if (!app.includes(MARKER)) {
  const anchor = 'const MASTER_TABS_MEDIA_DND_V56 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V56 marker missing');

  const helpers = String.raw`
function SectionStyleDrawerV57({ section, locale, onStyleChange, onTitleChange, onClose }) {
  const initialStyle = section?.styleV57 || {};
  const [titleV57, setTitleV57] = useState(section?.titles?.[locale] || section?.titles?.ru || '');
  const [backgroundV57, setBackgroundV57] = useState(initialStyle.background || '#FFFFFF');
  const [textColorV57, setTextColorV57] = useState(initialStyle.textColor || '#111111');
  const [paddingV57, setPaddingV57] = useState(Number(initialStyle.padding ?? 0));
  const [hideElementsV57, setHideElementsV57] = useState(Boolean(initialStyle.hideElements));

  const saveV57 = () => {
    onTitleChange?.(titleV57.trim());
    onStyleChange?.({ background: backgroundV57, textColor: textColorV57, padding: paddingV57, hideElements: hideElementsV57 });
    onClose();
  };

  return createPortal(<div className="section-style-layer-v57" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="section-style-drawer-v57" onClick={(event) => event.stopPropagation()}>
      <header className="section-style-head-v57"><div><span>СЕКЦИЯ · СТИЛЬ</span><strong>{section?.titles?.[locale] || section?.titles?.ru || 'Секция'}</strong><small>{layoutDisplayName(section?.template) + ' · ' + (section?.resolvedSlots?.length || 0) + ' слотов'}</small></div><button onClick={onClose}><X size={18}/></button></header>
      <div className="section-style-scroll-v57">
        <section className="section-style-group-v57">
          <div className="section-style-label-v57"><span>НАЗВАНИЕ</span><small>Локализованное название секции</small></div>
          <input className="section-style-title-v57" value={titleV57} onChange={(event) => setTitleV57(event.target.value)}/>
        </section>

        <section className="section-style-group-v57">
          <div className="section-style-label-v57"><span>ОФОРМЛЕНИЕ</span><small>Применяется только к текущей секции</small></div>
          <div className="section-style-colors-v57">
            <label><span>Фон</span><div><input type="color" value={backgroundV57} onChange={(event) => setBackgroundV57(event.target.value.toUpperCase())}/><input value={backgroundV57} onChange={(event) => setBackgroundV57(event.target.value)}/></div></label>
            <label><span>Цвет текста</span><div><input type="color" value={textColorV57} onChange={(event) => setTextColorV57(event.target.value.toUpperCase())}/><input value={textColorV57} onChange={(event) => setTextColorV57(event.target.value)}/></div></label>
          </div>
        </section>

        <section className="section-style-group-v57">
          <div className="section-style-label-v57"><span>ОТСТУП СЕКЦИИ</span><small>Внутренний воздух вокруг композиции</small></div>
          <div className="section-style-segment-v57">{[0,16,24,32].map((value) => <button key={value} className={paddingV57 === value ? 'active' : ''} onClick={() => setPaddingV57(value)}>{value === 0 ? 'Нет' : value + ' px'}</button>)}</div>
        </section>

        <section className="section-style-toggle-row-v57"><div><strong>Скрыть служебные элементы</strong><span>Метрики и контролы внутри слотов не показываются на секции</span></div><button className={hideElementsV57 ? 'active' : ''} onClick={() => setHideElementsV57((value) => !value)}><i/></button></section>

        <div className="section-style-preview-v57" style={{ background: backgroundV57, color: textColorV57, padding: paddingV57 }}><span>ПРЕДПРОСМОТР СТИЛЯ</span><strong>{titleV57 || 'Название секции'}</strong><small>{section?.resolvedSlots?.length || 0} слотов · {layoutDisplayName(section?.template)}</small></div>
      </div>
      <footer className="section-style-footer-v57"><button onClick={onClose}>Отмена</button><button className="primary" onClick={saveV57}>Сохранить</button></footer>
    </aside>
  </div>, document.body);
}

function openSectionRulesFromCanvasV57() {
  const settingsButton = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim().includes('Настройки секции'));
  settingsButton?.click();
  window.setTimeout(() => {
    if (typeof scrollToSectionAutomationV38 === 'function') scrollToSectionAutomationV38();
  }, 40);
}
`;
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  const part = functionChunk(app, 'SectionCanvas');
  let chunk = part.chunk;

  // Add the local style editor state and callbacks without breaking the existing SectionCanvas API.
  chunk = chunk.replace(/function SectionCanvas\(\{([^}]*)\}\) \{/, (match, args) => {
    let nextArgs = args;
    if (!nextArgs.includes('editable')) nextArgs += ', editable';
    if (!nextArgs.includes('onStyleChange')) nextArgs += ', onStyleChange';
    if (!nextArgs.includes('onTitleChange')) nextArgs += ', onTitleChange';
    return 'function SectionCanvas({' + nextArgs + '}) {\n  const [styleDrawerOpenV57, setStyleDrawerOpenV57] = useState(false);';
  });

  // Make authoring styling explicit on the section root.
  chunk = chunk.replace("className={`builder-section ${selected ? 'selected' : ''}`}", "className={`builder-section ${selected ? 'selected' : ''} ${section.styleV57?.hideElements ? 'hide-elements-v57' : ''}`}");

  // Old ERP-like header is retained in DOM for compatibility but visually removed. Insert the new compact author toolbar before content.
  const contentAnchor = '<div className="section-containers">';
  if (!chunk.includes(contentAnchor)) throw new Error(MARKER + ': section-containers anchor missing');
  const toolbar = String.raw`{editable !== false && <div className={'section-author-toolbar-v57 ' + (selected ? 'visible' : '')} onClick={(event) => event.stopPropagation()}>
      <span className="section-author-drag-v57" title="Переместить секцию"><GripVertical size={14}/></span>
      <div className="section-author-identity-v57"><strong>{section.titles?.[locale] || section.titles?.ru || 'Секция'}</strong><small>{layoutDisplayName(section.template)} · {section.resolvedSlots?.filter((slot) => slot.entity).length || 0}/{section.resolvedSlots?.length || 0}</small></div>
      <button className="section-author-action-v57" onClick={() => { onSelect(section.id); setStyleDrawerOpenV57(true); }}><LayoutGrid size={13}/><span>Редактировать стиль</span></button>
      <button className="section-author-action-v57" onClick={() => { onSelect(section.id); window.setTimeout(openSectionRulesFromCanvasV57, 0); }}><Sparkles size={13}/><span>Правила</span></button>
    </div>}
    {styleDrawerOpenV57 && <SectionStyleDrawerV57 section={section} locale={locale} onStyleChange={onStyleChange} onTitleChange={onTitleChange} onClose={() => setStyleDrawerOpenV57(false)}/>}
    <div className="section-containers" style={{ background: section.styleV57?.background || undefined, color: section.styleV57?.textColor || undefined, padding: section.styleV57?.padding ? section.styleV57.padding + 'px' : undefined }}>`;
  chunk = chunk.replace(contentAnchor, toolbar);
  app = app.slice(0, part.start) + chunk + app.slice(part.end);

  // Wire style/title persistence from the page state into every rendered section.
  const canvasCallPattern = /<SectionCanvas key=\{section\.id\} section=\{section\}/g;
  if (!canvasCallPattern.test(app)) throw new Error(MARKER + ': SectionCanvas render call missing');
  app = app.replace(canvasCallPattern, `<SectionCanvas key={section.id} section={section} onStyleChange={(patch) => updateSection(section.id, (source) => ({ ...source, styleV57: { ...(source.styleV57 || {}), ...patch } }))} onTitleChange={(value) => value && updateSection(section.id, (source) => ({ ...source, titles: { ...source.titles, [locale]: value } }))}`);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* section-canvas-toolbar-v57 */')) {
  css += String.raw`
/* section-canvas-toolbar-v57 */
/* Section is a visual authoring object: clean media canvas + compact author toolbar. */
.builder-section{position:relative!important;border:1px solid transparent!important;outline:0!important;background:transparent!important;padding-top:0!important;transition:border-color .12s ease!important}
.builder-section:hover{border-color:#a8c7ee!important}.builder-section.selected{border-color:#2680eb!important;box-shadow:0 0 0 1px #2680eb inset!important}
.builder-section .section-header-line{display:none!important}.builder-section .container-label{display:none!important}
.builder-section>.section-containers{transition:background .12s ease,padding .12s ease!important}

.section-author-toolbar-v57{position:absolute;left:-1px;top:-38px;z-index:90;height:36px;max-width:calc(100% + 2px);display:flex;align-items:stretch;background:#fff;border:1px solid #b7b7b7;box-shadow:0 3px 10px rgba(0,0,0,.08);opacity:0;pointer-events:none;transform:translateY(3px);transition:opacity .12s ease,transform .12s ease;white-space:nowrap;color:#111}
.builder-section:hover>.section-author-toolbar-v57,.builder-section.selected>.section-author-toolbar-v57,.section-author-toolbar-v57.visible{opacity:1;pointer-events:auto;transform:none}
.section-author-drag-v57{width:34px;display:grid;place-items:center;border-right:1px solid #dedede;color:#6b6b6b;cursor:grab}.section-author-drag-v57:active{cursor:grabbing}
.section-author-identity-v57{min-width:150px;max-width:260px;padding:5px 12px 4px;display:grid;align-content:center;gap:1px;border-right:1px solid #dedede}.section-author-identity-v57 strong{font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis}.section-author-identity-v57 small{font-size:7px;color:#858585;overflow:hidden;text-overflow:ellipsis}
.section-author-action-v57{height:34px;padding:0 11px;border:0;border-right:1px solid #dedede;background:#fff;color:#333;display:flex;align-items:center;gap:6px;font-size:8px;font-weight:600;cursor:pointer}.section-author-action-v57:last-child{border-right:0}.section-author-action-v57:hover{background:#f3f6fa;color:#111}

/* Make room only while authoring toolbar can be visible; page content itself stays visually clean. */
.builder-section+.builder-section{margin-top:44px!important}.builder-section:first-of-type{margin-top:44px!important}
.preview-mode .builder-section{border-color:transparent!important;box-shadow:none!important;margin-top:0!important}.preview-mode .section-author-toolbar-v57{display:none!important}

.builder-section.hide-elements-v57 .content-metric-overlay-v47,.builder-section.hide-elements-v57 .entity-details-trigger,.builder-section.hide-elements-v57 .slot-remove{display:none!important}

/* Dedicated style drawer, same clean language as section layout drawer. */
.section-style-layer-v57{position:fixed;inset:0;z-index:15400;background:rgba(15,15,15,.16);pointer-events:auto}.section-style-drawer-v57{position:absolute;top:0;right:0;bottom:0;width:min(480px,calc(100vw - 64px));background:#fff;border-left:1px solid #d9d9d9;box-shadow:-16px 0 42px rgba(0,0,0,.1);display:grid;grid-template-rows:auto minmax(0,1fr) auto;color:#111}.section-style-head-v57{min-height:78px;padding:16px 18px 14px 20px;border-bottom:1px solid #e5e5e5;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.section-style-head-v57>div{display:grid;gap:3px;min-width:0}.section-style-head-v57 span,.section-style-head-v57 small{font-size:8px;letter-spacing:.07em;text-transform:uppercase;color:#777}.section-style-head-v57 strong{font-size:18px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.section-style-head-v57>button{width:30px;height:30px;border:0;background:#fff;display:grid;place-items:center}.section-style-scroll-v57{min-height:0;overflow-y:auto;padding:20px}.section-style-group-v57{padding:0 0 24px;margin-bottom:24px;border-bottom:1px solid #e8e8e8}.section-style-label-v57{display:grid;gap:3px;margin-bottom:14px}.section-style-label-v57 span{font-size:8px;font-weight:600;letter-spacing:.07em;color:#555}.section-style-label-v57 small{font-size:9px;color:#8a8a8a}.section-style-title-v57{width:100%;height:42px;border:0;border-bottom:1px solid #999;background:#fff;padding:0 2px;font-size:15px;outline:0}.section-style-title-v57:focus{border-bottom-color:#111}.section-style-colors-v57{display:grid;grid-template-columns:1fr 1fr;gap:14px}.section-style-colors-v57 label{display:grid;gap:7px}.section-style-colors-v57 label>span{font-size:8px;font-weight:600;color:#666}.section-style-colors-v57 label>div{height:40px;border:1px solid #d2d2d2;display:grid;grid-template-columns:40px 1fr;align-items:center}.section-style-colors-v57 input[type=color]{width:40px;height:38px;border:0;padding:4px;background:#fff}.section-style-colors-v57 input:not([type=color]){width:100%;height:38px;border:0;padding:0 8px;font-size:10px;outline:0}.section-style-segment-v57{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #d5d5d5}.section-style-segment-v57 button{height:38px;border:0;border-right:1px solid #d5d5d5;background:#fff;font-size:9px}.section-style-segment-v57 button:last-child{border-right:0}.section-style-segment-v57 button.active{background:#111;color:#fff}.section-style-toggle-row-v57{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:24px;border-bottom:1px solid #e8e8e8}.section-style-toggle-row-v57>div{display:grid;gap:4px}.section-style-toggle-row-v57 strong{font-size:11px;font-weight:500}.section-style-toggle-row-v57 span{font-size:8px;color:#777}.section-style-toggle-row-v57>button{width:38px;height:22px;border:0;border-radius:99px;background:#c8c8c8;padding:2px}.section-style-toggle-row-v57>button i{display:block;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .12s}.section-style-toggle-row-v57>button.active{background:#111}.section-style-toggle-row-v57>button.active i{transform:translateX(16px)}.section-style-preview-v57{margin-top:24px;min-height:120px;border:1px solid #e2e2e2;display:grid;align-content:center;gap:6px}.section-style-preview-v57 span{font-size:7px;letter-spacing:.07em;opacity:.6}.section-style-preview-v57 strong{font-size:18px;font-weight:500}.section-style-preview-v57 small{font-size:8px;opacity:.6}.section-style-footer-v57{min-height:58px;border-top:1px solid #e5e5e5;padding:10px 18px;display:flex;justify-content:flex-end;gap:8px}.section-style-footer-v57 button{height:36px;padding:0 15px;border:1px solid #ccc;background:#fff;font-size:9px;font-weight:600}.section-style-footer-v57 button.primary{background:#111;color:#fff;border-color:#111}

@media(max-width:900px){.section-author-identity-v57{min-width:110px;max-width:160px}.section-author-action-v57 span{display:none}.section-author-action-v57{width:34px;padding:0;justify-content:center}.section-style-drawer-v57{width:min(440px,100vw)}}
@media(max-width:600px){.section-style-layer-v57{background:#fff}.section-style-drawer-v57{width:100vw;border-left:0;box-shadow:none}.section-style-colors-v57{grid-template-columns:1fr}.section-author-toolbar-v57{top:-34px;height:32px}.section-author-identity-v57{max-width:130px}.builder-section+.builder-section,.builder-section:first-of-type{margin-top:38px!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Section canvas toolbar V57 applied: clean authoring frame + Style + Rules actions');
