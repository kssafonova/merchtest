import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AEM_PANELS_DND_V41';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_AUTHORING_SHELL_V40 = true;';
  if (!app.includes(anchor)) throw new Error('AEM_PANELS_DND_V41: V40 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // Left panel is opt-in: open it from the Layers button placed before Sites/Menu.
  app = app.replace("const [aemPanelOpenV40, setAemPanelOpenV40] = useState(true);", "const [aemPanelOpenV40, setAemPanelOpenV40] = useState(false);");

  const toolbarAnchor = '<div className="toolbar-group menu-toolbar-anchor">';
  if (!app.includes(toolbarAnchor)) throw new Error('AEM_PANELS_DND_V41: toolbar anchor missing');
  app = app.replace(toolbarAnchor, toolbarAnchor + `\n        <button className={'aem-left-panel-toggle-v41 ' + (aemPanelOpenV40 ? 'active' : '')} onClick={() => setAemPanelOpenV40((value) => !value)} title={aemPanelOpenV40 ? 'Скрыть панель компонентов и структуры' : 'Открыть панель компонентов и структуры'}><Layers3 size={16}/><span>Панель</span></button>`);

  // The old Layers toggle inside the author-mode group is removed: one clear entry point only.
  app = app.replace(/\s*<button className="aem-side-toggle-v40"[\s\S]*?<\/button>\s*<span className="aem-toolbar-divider-v40"\/>/, '<span className="aem-toolbar-divider-v40"/>');

  // Left rail: Components + Structure only.
  const railStart = app.indexOf('<div className="aem-side-rail-v40">');
  const railEnd = railStart >= 0 ? app.indexOf('<div className="aem-side-content-v40">', railStart) : -1;
  if (railStart < 0 || railEnd < 0) throw new Error('AEM_PANELS_DND_V41: left rail boundaries missing');
  const railSource = `<div className="aem-side-rail-v40 aem-side-rail-v41">
          <button className={aemPanelTabV40 === 'components' ? 'active' : ''} onClick={() => { setAemPanelTabV40('components'); setAemPanelOpenV40(true); }} title="Компоненты"><LayoutGrid size={17}/><span>Компоненты</span></button>
          <button className={aemPanelTabV40 === 'tree' ? 'active' : ''} onClick={() => { setAemPanelTabV40('tree'); setAemPanelOpenV40(true); }} title="Дерево / Структура"><Layers3 size={17}/><span>Структура</span></button>
        </div>
        `;
  app = app.slice(0, railStart) + railSource + app.slice(railEnd);

  // Simplify left-panel title/search logic to the two remaining tabs.
  app = app.replace("{aemPanelTabV40 === 'components' ? 'COMPONENTS' : aemPanelTabV40 === 'assets' ? 'ASSETS' : aemPanelTabV40 === 'commerce' ? 'COMMERCE' : 'CONTENT TREE'}", "{aemPanelTabV40 === 'components' ? 'COMPONENTS' : 'CONTENT TREE'}");
  app = app.replace("{aemPanelTabV40 === 'tree' ? currentPageName : aemPanelTabV40 === 'components' ? 'Компоненты' : aemPanelTabV40 === 'assets' ? 'Ресурсы' : 'Каталог'}", "{aemPanelTabV40 === 'tree' ? currentPageName : 'Компоненты'}");
  app = app.replace("placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : aemPanelTabV40 === 'components' ? 'Поиск компонента' : aemPanelTabV40 === 'assets' ? 'Поиск ресурса' : 'Поиск товара'}", "placeholder={aemPanelTabV40 === 'tree' ? 'Поиск в структуре' : 'Поиск компонента или секции'}");

  // Replace the Components body and drop the duplicated Assets/Commerce bodies from the left panel.
  const compStart = app.indexOf("{aemPanelTabV40 === 'components' && <div className=\"aem-components-browser-v40\">");
  const sideScrollEnd = compStart >= 0 ? app.indexOf('\n          </div>\n        </div>\n      </aside>', compStart) : -1;
  if (compStart < 0 || sideScrollEnd < 0) throw new Error('AEM_PANELS_DND_V41: components block boundaries missing');
  const componentsSource = `{aemPanelTabV40 === 'components' && <div className="aem-components-browser-v41">
              {(!aemPanelSearchV40 || 'образ look editorial'.includes(aemPanelSearchV40.toLowerCase())) && <div className="aem-component-group-v41">
                <div className="aem-component-group-head-v41"><span>КОМПОНЕНТЫ</span><small>Перетащите компонент в слот</small></div>
                <button className="aem-generic-component-v41" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-lego-component', 'look'); event.dataTransfer.setData('text/plain', ''); }} onClick={() => { setRightTab('content'); setContentTab('look'); }}>
                  <span className="aem-component-icon-v40"><Sparkles size={16}/></span><span><strong>Образ</strong><small>Editorial / Look component</small></span><GripVertical size={14}/>
                </button>
              </div>}
              <details className="aem-section-components-v41" open>
                <summary><span><strong>Секции</strong><small>Responsive Layout Container · {TYPE_LIBRARY.length}</small></span><ChevronDown size={14}/></summary>
                <div className="aem-section-component-list-v41">{TYPE_LIBRARY.filter((type) => !aemPanelSearchV40 || [type.id, type.category, type.description, layoutDisplayName(type)].join(' ').toLowerCase().includes(aemPanelSearchV40.toLowerCase())).map((type) => <button key={type.id} className="aem-section-component-v41" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-lego-section-type', type.id); event.dataTransfer.setData('text/plain', ''); }} onClick={() => addType(type)}><span className="aem-component-icon-v40"><LayoutGrid size={16}/></span><span><strong>{layoutDisplayName(type)}</strong><small>{type.category} · {slotCount(type)} слотов</small></span><GripVertical size={14}/></button>)}</div>
              </details>
            </div>}`;
  app = app.slice(0, compStart) + componentsSource + app.slice(sideScrollEnd);

  // Right panel: exact product/editorial/media tabs. Filters and cards stay in their existing browser blocks.
  const tabsStart = app.indexOf('<div className="aem-content-source-tabs-v37">');
  const tabsEnd = tabsStart >= 0 ? app.indexOf('</div>', tabsStart) : -1;
  if (tabsStart < 0 || tabsEnd < 0) throw new Error('AEM_PANELS_DND_V41: right content tabs missing');
  const rightTabs = `<div className="aem-content-source-tabs-v37 aem-right-content-tabs-v41">
        <button className={contentTab === 'product' ? 'active' : ''} onClick={() => { setContentTab('product'); setRightTab('content'); setQuery(''); }}><ShoppingBag size={14}/><span><strong>Товары</strong><small>Каталог · SKU</small></span></button>
        <button className={contentTab === 'look' ? 'active' : ''} onClick={() => { setContentTab('look'); setRightTab('content'); setQuery(''); }}><Sparkles size={14}/><span><strong>Образы</strong><small>Editorial · Looks</small></span></button>
        <button className={contentTab === 'media' ? 'active' : ''} onClick={() => { setContentTab('media'); setRightTab('content'); setQuery(''); }}><ImageIcon size={14}/><span><strong>Медиа</strong><small>Фото · Видео · SVG</small></span></button>
      </div>`;
  app = app.slice(0, tabsStart) + rightTabs + app.slice(tabsEnd + 6);

  // Generic section drop zones live between every section, not only around the selected section.
  const insertStart = app.indexOf('function SectionInsertPoint(');
  const insertEnd = insertStart >= 0 ? app.indexOf('\nfunction SectionCanvas(', insertStart) : -1;
  if (insertStart < 0 || insertEnd < 0) throw new Error('AEM_PANELS_DND_V41: SectionInsertPoint boundaries missing');
  const insertSource = String.raw`function SectionInsertPoint({ sectionId, position, open, selected = false, device, onToggle, onAdd }) {
  const [dragActiveV41, setDragActiveV41] = useState(false);
  const layouts = TYPE_LIBRARY.filter((type) => type.layoutV2);
  const label = position === 'before' ? 'Добавить секцию выше' : 'Добавить секцию ниже';
  const acceptsSection = (event) => Array.from(event.dataTransfer?.types || []).includes('application/x-lego-section-type');
  return <div className={'section-insert-point aem-section-drop-v41 ' + position + (open ? ' open' : '') + (selected ? ' selected' : '') + (dragActiveV41 ? ' drag-active' : '')}
    onClick={(event) => event.stopPropagation()}
    onDragEnter={(event) => { if (!acceptsSection(event)) return; event.preventDefault(); setDragActiveV41(true); }}
    onDragOver={(event) => { if (!acceptsSection(event)) return; event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDragActiveV41(true); }}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActiveV41(false); }}
    onDrop={(event) => { const typeId = event.dataTransfer.getData('application/x-lego-section-type'); if (!typeId) return; event.preventDefault(); event.stopPropagation(); setDragActiveV41(false); const type = TYPE_LIBRARY.find((item) => item.id === typeId); if (type) onAdd(type, position); }}>
    {selected && <button type="button" className="section-insert-trigger" onClick={() => onToggle(position)} aria-expanded={open}><Plus size={14}/><span>{open ? 'Скрыть макеты' : 'Добавить секцию'}</span><small>{position === 'before' ? 'выше' : 'ниже'}</small></button>}
    {dragActiveV41 && <div className="aem-section-drop-label-v41"><Plus size={14}/><span>{position === 'before' ? 'Вставить секцию выше' : 'Вставить секцию ниже'}</span></div>}
    {open && selected && <div className="section-inline-layout-library">
      <div className="section-inline-layout-head"><div><span>МАКЕТЫ СЕКЦИЙ</span><strong>{label}</strong><small>Можно выбрать или перетащить секцию из панели «Компоненты».</small></div><button type="button" onClick={() => onToggle(position)}><X size={15}/></button></div>
      <div className="section-inline-layout-grid">{layouts.map((type) => <button type="button" className="section-inline-layout-card" key={type.id} onClick={() => onAdd(type, position)}><div className="section-inline-layout-preview"><DualDeviceLayoutPreviewV34 type={type} compact/></div><span><strong>{layoutDisplayName(type)}</strong><small>{slotCount(type)} слот(а)</small></span></button>)}</div>
    </div>}
  </div>;
}

`;
  app = app.slice(0, insertStart) + insertSource + app.slice(insertEnd);

  // Render before/after drop zones for every section while keeping the add buttons visible only for selected section.
  app = app.replaceAll('{selected && <SectionInsertPoint sectionId={section.id} position="before"', '<SectionInsertPoint sectionId={section.id} position="before" selected={selected}');
  app = app.replaceAll('onAdd={onInsertSection}/>}<section className={`builder-section', 'onAdd={onInsertSection}/><section className={`builder-section');
  app = app.replaceAll('</section>{selected && <SectionInsertPoint sectionId={section.id} position="after"', '</section><SectionInsertPoint sectionId={section.id} position="after" selected={selected}');
  app = app.replaceAll('onAdd={onInsertSection}/>}</>;', 'onAdd={onInsertSection}/></>;');

  // Dropping the generic Look component into a slot selects that slot and opens the right-side Looks browser.
  const slotStart = app.indexOf('function Slot(');
  const sectionCanvasStart = slotStart >= 0 ? app.indexOf('function SectionCanvas(', slotStart) : -1;
  if (slotStart < 0 || sectionCanvasStart < 0) throw new Error('AEM_PANELS_DND_V41: Slot boundaries missing');
  let slotChunk = app.slice(slotStart, sectionCanvasStart);
  slotChunk = slotChunk.replace(/function Slot\(\{([^}]*)\}\) \{/, (match, props) => props.includes('onRequestContent') ? match : `function Slot({${props.trim().replace(/\s+$/, '')}, onRequestContent}) {`);
  if (!slotChunk.includes('onDrop={onDrop}')) throw new Error('AEM_PANELS_DND_V41: Slot onDrop anchor missing');
  slotChunk = slotChunk.replace('onDrop={onDrop}', `onDrop={(event) => { const componentKind = event.dataTransfer.getData('application/x-lego-component'); if (componentKind === 'look') { event.preventDefault(); event.stopPropagation(); onRequestContent?.({ sectionId, slotIndex: slot.index, contentTab: 'look' }); return; } onDrop?.(event); }}`);
  app = app.slice(0, slotStart) + slotChunk + app.slice(sectionCanvasStart);

  const canvasFnStart = app.indexOf('function SectionCanvas(');
  const canvasFnEnd = canvasFnStart >= 0 ? app.indexOf('\nfunction ', canvasFnStart + 20) : -1;
  if (canvasFnStart < 0 || canvasFnEnd < 0) throw new Error('AEM_PANELS_DND_V41: SectionCanvas function boundaries missing');
  let canvasChunk = app.slice(canvasFnStart, canvasFnEnd);
  canvasChunk = canvasChunk.replace(/function SectionCanvas\(\{([^}]*)\}\) \{/, (match, props) => props.includes('onRequestContent') ? match : `function SectionCanvas({${props.trim().replace(/\s+$/, '')}, onRequestContent}) {`);
  canvasChunk = canvasChunk.replaceAll('onDrop={(e) => onDrop(e, slot.index)}', 'onRequestContent={onRequestContent} onDrop={(e) => onDrop(e, slot.index)}');
  app = app.slice(0, canvasFnStart) + canvasChunk + app.slice(canvasFnEnd);

  // Pass the request handler from AppV3 to all rendered section canvases.
  const canvasCallToken = '<SectionCanvas key={section.id}';
  if (!app.includes(canvasCallToken)) throw new Error('AEM_PANELS_DND_V41: SectionCanvas call missing');
  app = app.replaceAll(canvasCallToken, `<SectionCanvas key={section.id} onRequestContent={({ sectionId, slotIndex, contentTab: requestedTab }) => { setSelectedId(sectionId); setSelectedSlot({ sectionId, slotIndex }); setRightTab('content'); setContentTab(requestedTab); setAemPanelOpenV40(false); }}`);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* aem-panels-dnd-v41 */')) {
  css += String.raw`
/* aem-panels-dnd-v41 */
.aem-left-panel-toggle-v41{display:flex!important;align-items:center!important;gap:6px!important;border-right:1px solid #e2e2e2!important;padding-right:12px!important;margin-right:2px!important}.aem-left-panel-toggle-v41.active{background:#f0f0f0!important;color:#111!important}.aem-left-panel-toggle-v41 span{font-size:9px!important}
.aem-author-modebar-v40>.aem-toolbar-divider-v40:first-child{display:none!important}

/* Left panel = author structure only. */
.aem-side-rail-v41{grid-template-columns:repeat(2,minmax(0,1fr))!important}.aem-side-rail-v41 button{justify-content:center!important;min-width:0!important}.aem-side-rail-v41 button span{white-space:nowrap!important}
.aem-components-browser-v41{padding:10px 8px 20px!important;display:grid!important;gap:10px!important}.aem-component-group-v41,.aem-section-components-v41{border-bottom:1px solid #e5e5e5!important;padding-bottom:10px!important}.aem-component-group-head-v41{padding:5px 8px 8px!important;display:flex!important;justify-content:space-between!important;gap:8px!important}.aem-component-group-head-v41 span{font-size:7px!important;letter-spacing:.08em!important;color:#777!important}.aem-component-group-head-v41 small{font-size:7px!important;color:#999!important}.aem-generic-component-v41,.aem-section-component-v41{width:100%!important;min-height:48px!important;padding:7px 8px!important;border:0!important;border-bottom:1px solid #eee!important;background:#fff!important;display:grid!important;grid-template-columns:34px minmax(0,1fr) 22px!important;align-items:center!important;gap:8px!important;text-align:left!important;cursor:grab!important}.aem-generic-component-v41:hover,.aem-section-component-v41:hover{background:#f7f7f7!important}.aem-generic-component-v41:active,.aem-section-component-v41:active{cursor:grabbing!important}.aem-generic-component-v41>span:nth-child(2),.aem-section-component-v41>span:nth-child(2){display:grid!important;gap:2px!important}.aem-generic-component-v41 strong,.aem-section-component-v41 strong{font-size:10px!important;font-weight:500!important;color:#222!important}.aem-generic-component-v41 small,.aem-section-component-v41 small{font-size:7px!important;color:#888!important}.aem-section-components-v41>summary{list-style:none;min-height:42px;padding:7px 8px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;cursor:pointer}.aem-section-components-v41>summary::-webkit-details-marker{display:none}.aem-section-components-v41>summary>span{display:grid;gap:2px}.aem-section-components-v41>summary strong{font-size:11px;font-weight:600}.aem-section-components-v41>summary small{font-size:7px;color:#888}.aem-section-components-v41[open]>summary svg{transform:rotate(180deg)}.aem-section-component-list-v41{display:grid}

/* Right panel = content browser. Filters stay with the current tab and cards occupy the remaining height. */
.aem-right-content-tabs-v41{position:sticky!important;top:0!important;z-index:9!important;background:#fff!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}.aem-right-content-tabs-v41 button{height:58px!important;padding:8px 10px!important}.aem-right-content-tabs-v41 strong{font-size:10px!important}.aem-right-content-tabs-v41 small{font-size:7px!important}.aem-properties-panel-v40 .aem-browser-shell-v37{padding:0 14px 12px!important}.aem-properties-panel-v40 .aem-browser-source-v37{padding-top:11px!important}.aem-properties-panel-v40 .aem-facets-v37{max-height:280px!important;overflow:auto!important}.aem-properties-panel-v40 .content-library-scroll.simple-library-scroll{padding-top:16px!important}.aem-properties-panel-v40 .reference-library-grid{gap:26px 18px!important}

/* Section DnD: invisible insertion rails become clear only while dragging. */
.aem-section-drop-v41{min-height:14px!important;margin:0 18px!important;padding:0!important;transition:min-height .14s ease,background .14s ease!important}.aem-section-drop-v41:not(.selected):not(.drag-active):before{border-color:transparent!important}.aem-section-drop-v41:not(.selected):not(.drag-active){pointer-events:auto!important}.aem-section-drop-v41.drag-active{min-height:54px!important;margin:8px 18px!important;background:#e8f2ff!important;border:1px dashed #2680eb!important;display:grid!important;place-items:center!important}.aem-section-drop-v41.drag-active:before{display:none!important}.aem-section-drop-label-v41{display:flex!important;align-items:center!important;gap:7px!important;color:#1769c2!important;font-size:9px!important;font-weight:600!important;pointer-events:none!important}.aem-section-drop-v41.selected:not(.drag-active){margin:8px 18px!important}

/* Generic component drag over a slot. */
.lego-slot{transition:outline-color .12s ease,background .12s ease!important}.lego-slot:has(.empty-slot-state){cursor:pointer!important}

@media(max-width:1024px){.aem-left-panel-toggle-v41 span{display:none!important}.aem-left-panel-toggle-v41{padding-right:8px!important}.aem-author-side-panel-v40.open{z-index:260!important}.aem-right-content-tabs-v41{position:relative!important}.aem-properties-panel-v40 .aem-facets-v37{max-height:none!important}}
@media(max-width:520px){.aem-side-rail-v41 button span{font-size:7px!important}.aem-right-content-tabs-v41 button{height:50px!important;padding:6px!important}.aem-right-content-tabs-v41 small{display:none!important}.aem-section-drop-v41{margin-left:8px!important;margin-right:8px!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('AEM panels + DnD v41 applied: left structure/components, right content tabs, section/look drag-and-drop');
