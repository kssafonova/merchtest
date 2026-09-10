import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'ADJACENT_SECTION_INSERT_V20';

if (!app.includes(MARKER)) {
  const markerAnchor = 'const UX_UNIFICATION_V18 = true;';
  if (!app.includes(markerAnchor)) throw new Error('ADJACENT_SECTION_INSERT_V20: V18 marker missing');
  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;');

  const sectionCanvasStart = app.indexOf('function SectionCanvas(');
  if (sectionCanvasStart < 0) throw new Error('ADJACENT_SECTION_INSERT_V20: SectionCanvas not found');

  const helper = String.raw`function SectionInsertPoint({ sectionId, position, open, device, onToggle, onAdd }) {
  const layouts = TYPE_LIBRARY.filter((type) => type.layoutV2);
  const label = position === 'before' ? 'Добавить секцию выше' : 'Добавить секцию ниже';
  return <div className={'section-insert-point ' + position + (open ? ' open' : '')} onClick={(event) => event.stopPropagation()}>
    <button type="button" className="section-insert-trigger" onClick={() => onToggle(position)} aria-expanded={open}>
      <Plus size={14}/><span>{open ? 'Скрыть макеты' : 'Добавить секцию'}</span><small>{position === 'before' ? 'выше' : 'ниже'}</small>
    </button>
    {open && <div className="section-inline-layout-library">
      <div className="section-inline-layout-head"><div><span>МАКЕТЫ СЕКЦИЙ</span><strong>{label}</strong><small>Новая секция будет вставлена в эту точку страницы.</small></div><button type="button" onClick={() => onToggle(position)}><X size={15}/></button></div>
      <div className="section-inline-layout-grid">{layouts.map((type) => <button type="button" className="section-inline-layout-card" key={type.id} onClick={() => onAdd(type, position)}><div className="section-inline-layout-preview"><LayoutPhotoPreview type={type} viewport={device}/></div><span><strong>{layoutDisplayName(type)}</strong><small>{slotCount(type)} слот(а)</small></span></button>)}</div>
    </div>}
  </div>;
}

`;
  app = app.slice(0, sectionCanvasStart) + helper + app.slice(sectionCanvasStart);

  // Extend SectionCanvas with contextual insertion controls without changing its existing responsibilities.
  const fnStart = app.indexOf('function SectionCanvas(');
  const fnEnd = app.indexOf('\nfunction ', fnStart + 20);
  if (fnStart < 0 || fnEnd < 0) throw new Error('ADJACENT_SECTION_INSERT_V20: SectionCanvas boundaries not found');
  let canvasChunk = app.slice(fnStart, fnEnd);

  canvasChunk = canvasChunk.replace(
    /function SectionCanvas\(\{([^}]*)\}\) \{/,
    (match, props) => {
      const additions = ['insertTarget', 'onToggleInsert', 'onInsertSection'];
      const existing = props.split(',').map((item) => item.trim()).filter(Boolean);
      additions.forEach((item) => { if (!existing.includes(item)) existing.push(item); });
      return `function SectionCanvas({ ${existing.join(', ')} }) {`;
    }
  );

  const returnToken = 'return <section className={`builder-section';
  const returnIndex = canvasChunk.indexOf(returnToken);
  if (returnIndex < 0) throw new Error('ADJACENT_SECTION_INSERT_V20: SectionCanvas return anchor missing');
  canvasChunk = canvasChunk.replace(
    returnToken,
    `return <>{selected && <SectionInsertPoint sectionId={section.id} position="before" open={insertTarget?.sectionId === section.id && insertTarget?.position === 'before'} device={device} onToggle={onToggleInsert} onAdd={onInsertSection}/>}<section className={\`builder-section`
  );

  const closeToken = '</section>;';
  const closeIndex = canvasChunk.lastIndexOf(closeToken);
  if (closeIndex < 0) throw new Error('ADJACENT_SECTION_INSERT_V20: SectionCanvas closing anchor missing');
  canvasChunk = canvasChunk.slice(0, closeIndex) + `</section>{selected && <SectionInsertPoint sectionId={section.id} position="after" open={insertTarget?.sectionId === section.id && insertTarget?.position === 'after'} device={device} onToggle={onToggleInsert} onAdd={onInsertSection}/>}</>;` + canvasChunk.slice(closeIndex + closeToken.length);
  app = app.slice(0, fnStart) + canvasChunk + app.slice(fnEnd);

  // Contextual picker state is independent from the page-bottom layout picker.
  const showAddAnchor = "  const [showAdd, setShowAdd] = useState(false);";
  if (!app.includes(showAddAnchor)) throw new Error('ADJACENT_SECTION_INSERT_V20: showAdd state anchor missing');
  app = app.replace(showAddAnchor, showAddAnchor + "\n  const [sectionInsertTarget, setSectionInsertTarget] = useState(null);");

  // Insert a newly selected layout exactly before/after the selected section; global add still appends.
  const addStart = app.indexOf('  const addType = (type) => {');
  const addEnd = app.indexOf('  const pinEntity =', addStart);
  if (addStart < 0 || addEnd < 0) throw new Error('ADJACENT_SECTION_INSERT_V20: addType anchors missing');
  const addTypeSource = String.raw`  const addType = (type, insertTarget = null) => {
    const titles = { ru: `Новая секция · ${type.id}`, en: `New section · ${type.id}`, kk: `Жаңа секция · ${type.id}`, ar: `قسم جديد · ${type.id}` };
    const next = initialSection(type.id, titles, {}, 'manual');
    mutateSections((prev) => {
      if (!insertTarget?.sectionId) return [...prev, next];
      const targetIndex = prev.findIndex((section) => section.id === insertTarget.sectionId);
      if (targetIndex < 0) return [...prev, next];
      const insertIndex = insertTarget.position === 'before' ? targetIndex : targetIndex + 1;
      return [...prev.slice(0, insertIndex), next, ...prev.slice(insertIndex)];
    });
    setSelectedId(next.id);
    setSelectedSlot(null);
    setRightTab('content');
    setShowAdd(false);
    setSectionInsertTarget(null);
    setToast(`${type.id}: секция добавлена${insertTarget?.sectionId ? (insertTarget.position === 'before' ? ' выше выбранной' : ' ниже выбранной') : ''}`);
    setTimeout(() => setToast(''), 1600);
  };
`;
  app = app.slice(0, addStart) + addTypeSource + app.slice(addEnd);

  // Add insertion props to the single canvas SectionCanvas instance.
  const sectionCallRe = /<SectionCanvas key=\{section\.id\}/g;
  if (!sectionCallRe.test(app)) throw new Error('ADJACENT_SECTION_INSERT_V20: SectionCanvas call not found');
  app = app.replace(sectionCallRe, `<SectionCanvas key={section.id} insertTarget={sectionInsertTarget} onToggleInsert={(position) => setSectionInsertTarget((current) => current?.sectionId === section.id && current?.position === position ? null : { sectionId: section.id, position })} onInsertSection={(type, position) => addType(type, { sectionId: section.id, position })}`);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* adjacent-section-insert-v20 */')) {
  css += String.raw`
/* adjacent-section-insert-v20 */
.section-insert-point{position:relative;margin:8px 18px;display:flex;flex-direction:column;align-items:center;z-index:14}.section-insert-point:before{content:"";position:absolute;top:16px;left:0;right:0;border-top:1px dashed #cbd0d8;z-index:0}.section-insert-trigger{position:relative;z-index:1;height:32px;border:1px solid #ccd2da;border-radius:999px;background:#fff;color:#555c66;padding:0 12px;display:flex;align-items:center;gap:6px;font-size:8px;font-weight:800;box-shadow:0 2px 8px rgba(27,33,42,.06);cursor:pointer}.section-insert-trigger:hover,.section-insert-point.open .section-insert-trigger{border-color:#7898d0;color:#315fae;background:#f8faff}.section-insert-trigger small{font-size:7px;font-weight:700;color:#959aa2;text-transform:lowercase}.section-inline-layout-library{position:relative;z-index:2;width:100%;margin-top:8px;border:1px solid #dfe3e8;border-radius:10px;background:#fff;box-shadow:0 12px 32px rgba(23,31,44,.12);overflow:hidden}.section-inline-layout-head{min-height:56px;padding:10px 12px;border-bottom:1px solid #ebedf0;background:#fbfbfc;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.section-inline-layout-head>div{display:grid;gap:2px}.section-inline-layout-head span{font-size:7px;font-weight:900;letter-spacing:.09em;color:#8a9099}.section-inline-layout-head strong{font-size:11px;color:#252a31}.section-inline-layout-head small{font-size:8px;color:#858b94}.section-inline-layout-head>button{width:28px;height:28px;border:0;border-radius:6px;background:#f0f2f4;display:grid;place-items:center;cursor:pointer}.section-inline-layout-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:9px;max-height:330px;overflow:auto}.section-inline-layout-card{min-width:0;border:1px solid #e0e3e8;border-radius:7px;background:#fff;padding:6px;text-align:left;cursor:pointer}.section-inline-layout-card:hover{border-color:#86a2d2;background:#fafcff}.section-inline-layout-preview{height:70px;background:#f6f7f9;border-radius:5px;overflow:hidden;display:flex;align-items:center;justify-content:center}.section-inline-layout-preview .layout-photo-preview{width:100%;height:100%;margin:0}.section-inline-layout-card>span{display:flex;justify-content:space-between;gap:5px;margin-top:6px;align-items:flex-start}.section-inline-layout-card strong{font-size:7.5px;line-height:1.25;color:#343942}.section-inline-layout-card small{font-size:7px;color:#8c929b;white-space:nowrap}.builder-section.selected+.section-insert-point.after{margin-top:10px}.section-insert-point.before+.builder-section.selected{margin-top:0}@media(max-width:1100px){.section-inline-layout-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){.section-inline-layout-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  writeFileSync(cssPath, css);
}

console.log('Adjacent section insertion v20 applied');