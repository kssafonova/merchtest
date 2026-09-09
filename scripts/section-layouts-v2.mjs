import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
const dataPath = 'public/data/lego_section_layouts_v2.json';
let app = readFileSync(appPath, 'utf8');

if (!app.includes('SECTION_LAYOUTS_V2_INTEGRATED')) {
  const catalog = JSON.parse(readFileSync(dataPath, 'utf8'));

  const expandBreakpoint = (bp) => {
    const [cols, rows, columnGap, rowGap] = bp.g;
    const [mode, width, maxWidth, align, marginLeft, marginRight, paddingLeft, paddingRight] = bp.c;
    return {
      cols,
      rows,
      columnGap,
      rowGap,
      container: { mode, width, maxWidth, align, marginLeft, marginRight, paddingLeft, paddingRight },
      slots: bp.s.map(([slotId, start, span, rowStart, rowSpan, ratio, minHeight]) => ({
        slotIndex: Number(slotId) - 1,
        start,
        span,
        rowStart,
        rows: rowSpan,
        ...(ratio ? { ratio } : {}),
        ...(minHeight ? { minHeight } : {}),
      })),
    };
  };

  const v2Types = catalog.sections.map((section) => ({
    id: `LAYOUT-${section.id}`,
    label: `${section.id}. ${section.name}`,
    system: true,
    layoutV2: true,
    category: 'Макеты',
    description: `${section.slots} слот(а) · ${section.tags.join(' · ')}`,
    tags: section.tags,
    containers: [expandBreakpoint(section.desktop)],
    mobileContainers: [expandBreakpoint(section.mobile)],
  }));

  const libraryStart = app.indexOf('const TYPE_LIBRARY = [');
  const libraryEnd = app.indexOf('];\n\nconst CONTENT_LABELS', libraryStart);
  if (libraryStart < 0 || libraryEnd < 0) throw new Error('TYPE_LIBRARY block not found');
  const libraryBlock = app.slice(libraryStart, libraryEnd + 2).replace('const TYPE_LIBRARY = [', 'const BASE_TYPE_LIBRARY = [');
  const v2Source = `\nconst SECTION_LAYOUTS_V2_INTEGRATED = true;\nconst SECTION_LAYOUT_LIBRARY_V2 = ${JSON.stringify(v2Types)};\nconst TYPE_LIBRARY = [...BASE_TYPE_LIBRARY, ...SECTION_LAYOUT_LIBRARY_V2];`;
  app = app.slice(0, libraryStart) + libraryBlock + v2Source + app.slice(libraryEnd + 2);

  const previewStart = app.indexOf('function TypePreview(');
  const productCardStart = app.indexOf('\nfunction ProductCard(', previewStart);
  if (previewStart < 0 || productCardStart < 0) throw new Error('TypePreview block not found');
  const previewSource = `function previewContainerStyle(container) {\n  if (!container) return {};\n  const style = {};\n  if (container.mode === 'boxed') { style.width = '88%'; style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.mode === 'inset' || container.mode === 'custom') { style.width = container.width || '75%'; }\n  if (container.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.align === 'right') { style.marginLeft = 'auto'; style.marginRight = 0; }\n  if (container.align === 'left') { style.marginLeft = 0; style.marginRight = 'auto'; }\n  return style;\n}\n\nfunction canvasContainerStyle(container) {\n  if (!container) return {};\n  const px = (value) => typeof value === 'number' && value !== 0 ? value + 'px' : value;\n  const style = {\n    width: container.width || '100%',\n    maxWidth: container.maxWidth ? container.maxWidth + 'px' : undefined,\n    paddingLeft: px(container.paddingLeft),\n    paddingRight: px(container.paddingRight),\n  };\n  if (container.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  else if (container.align === 'right') { style.marginLeft = container.marginLeft === 'auto' ? 'auto' : px(container.marginLeft); style.marginRight = px(container.marginRight); }\n  else { style.marginLeft = px(container.marginLeft); style.marginRight = container.marginRight === 'auto' ? 'auto' : px(container.marginRight); }\n  return style;\n}\n\nfunction TypePreview({ type, compact = false, viewport = 'desktop' }) {\n  const containers = viewport === 'mobile' && type.mobileContainers?.length ? type.mobileContainers : type.containers;\n  let index = 0;\n  return <div className={\`type-preview \${compact ? 'compact' : ''} \${type.layoutV2 ? 'v2' : ''}\`}>\n    {containers.map((container, ci) => <div className=\"type-preview-container\" key={ci} style={previewContainerStyle(container.container)}>\n      <div className=\"type-preview-grid\" style={{ gridTemplateColumns: \`repeat(\${container.cols}, 1fr)\`, columnGap: compact ? 3 : 4, rowGap: compact ? 3 : 4 }}>\n        {container.slots.map((slot, si) => { index += 1; const number = slot.slotIndex != null ? slot.slotIndex + 1 : index; return <span key={si} style={{ gridColumn: slot.start ? \`\${slot.start} / span \${slot.span}\` : \`span \${slot.span}\`, gridRow: slot.rowStart ? \`\${slot.rowStart} / span \${slot.rows || 1}\` : slot.rows ? \`span \${slot.rows}\` : undefined }}>{compact ? '' : number}</span>; })}\n      </div>\n    </div>)}\n  </div>;\n}\n`;
  app = app.slice(0, previewStart) + previewSource + app.slice(productCardStart + 1);

  const sectionStart = app.indexOf('function SectionCanvas(');
  const modalStart = app.indexOf('\nfunction AddTypeModal(', sectionStart);
  if (sectionStart < 0 || modalStart < 0) throw new Error('SectionCanvas block not found');
  const sectionSource = `function SectionCanvas({ section, locale, region, device, selected, editable, onSelect, onPin, onUnpin, onDuplicate, onDelete, onSectionDragStart, onSectionDrop }) {\n  const containers = device === 'mobile' && section.template.mobileContainers?.length ? section.template.mobileContainers : section.template.containers;\n  let cursor = 0;\n  const onDrop = (event, slotIndex) => { event.preventDefault(); event.stopPropagation(); const id = event.dataTransfer.getData('text/plain'); if (id) onPin(section.id, slotIndex, id); };\n  return <section className={\`builder-section \${selected ? 'selected' : ''} \${section.template.layoutV2 ? 'layout-v2' : ''}\`} draggable={Boolean(editable && selected)} onDragStart={(e) => editable && selected ? onSectionDragStart(e, section.id) : e.preventDefault()} onDragOver={(e) => { if (editable) e.preventDefault(); }} onDrop={(e) => { if (editable) { e.preventDefault(); e.stopPropagation(); onSectionDrop(e, section.id); } }} onClick={() => onSelect(section.id)}>\n    <div className=\"section-header-line\"><div><h3>{section.titles[locale] || section.titles.ru}</h3></div><div className=\"section-head-meta\"><span>{section.resolvedSlots.filter((s) => s.entity).length}/{section.resolvedSlots.length} слотов</span><span className={\`mode-badge \${section.rules.mode}\`}>{section.rules.mode.toUpperCase()}</span>{section.template.layoutV2 && <span className=\"layout-v2-badge\">LAYOUT {section.template.id.replace('LAYOUT-', '')}</span>}{editable && selected && <div className=\"section-inline-actions\" onClick={(e) => e.stopPropagation()}><span className=\"section-drag-handle\" title=\"Перетащить секцию\"><GripVertical size={15}/></span><button title=\"Дублировать\" onClick={() => onDuplicate(section.id)}><Copy size={14}/></button><button title=\"Удалить\" onClick={() => onDelete(section.id)}><Trash2 size={14}/></button></div>}</div></div>\n    <div className=\"section-containers\">{containers.map((container, ci) => <div className=\"section-container\" key={ci} style={canvasContainerStyle(container.container)}><div className=\"slot-grid\" style={{ gridTemplateColumns: \`repeat(\${container.cols}, minmax(0,1fr))\`, columnGap: container.columnGap ?? 8, rowGap: container.rowGap ?? 8 }}>{container.slots.map((shape, si) => { const slotIndex = shape.slotIndex != null ? shape.slotIndex : cursor++; const slot = section.resolvedSlots[slotIndex]; if (!slot) return null; return <div className=\"v2-slot-wrap\" key={si} style={{ gridColumn: shape.start ? \`\${shape.start} / span \${shape.span}\` : \`span \${shape.span}\`, gridRow: shape.rowStart ? \`\${shape.rowStart} / span \${shape.rows || 1}\` : shape.rows ? \`span \${shape.rows}\` : undefined, minHeight: shape.minHeight ? shape.minHeight + 'px' : undefined }}><Slot slot={slot} region={region} onDrop={(e) => onDrop(e, slot.index)} onUnpin={() => onUnpin(section.id, slot.index)}/></div>; })}</div></div>)}</div>\n  </section>;\n}\n`;
  app = app.slice(0, sectionStart) + sectionSource + app.slice(modalStart + 1);

  app = app.replace("const [category, setCategory] = useState('Товары');", "const [category, setCategory] = useState('Макеты');");
  app = app.replace("const [selectedTypeId, setSelectedTypeId] = useState('TYPE-1');", "const [selectedTypeId, setSelectedTypeId] = useState('LAYOUT-1');");
  app = app.replace("const categories = ['Товары', 'Креативные', 'Эдиториал', 'Главная'];", "const categories = ['Макеты', 'Товары', 'Креативные', 'Эдиториал', 'Главная'];");
  app = app.replace(
    '<TypePreview type={selectedType}/><div className="type-policy-note">',
    "{selectedType.layoutV2 ? <div className=\"responsive-type-previews\"><div><span>DESKTOP</span><TypePreview type={selectedType}/></div><div><span>MOBILE</span><TypePreview type={selectedType} viewport=\"mobile\"/></div></div> : <TypePreview type={selectedType}/>}<div className=\"type-policy-note\">",
  );

  app = app.replace('section={section} locale={locale} region={region} selected=', 'section={section} locale={locale} region={region} device={device} selected=');
  app = app.replace('Выберите геометрию секции. Новая секция создаётся с пустыми слотами, весь контент доступен по умолчанию.', 'Выберите responsive-геометрию секции. Макеты V2 поддерживают full-width, boxed, inset, внешние поля и разные desktop/mobile-композиции.');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* section-layouts-v2 */')) {
  css += `\n/* section-layouts-v2 */\n.layout-v2-badge{font-size:7px!important;font-weight:800;letter-spacing:.06em;color:#3d5fb8!important;background:#eef3ff;border:1px solid #d7e2ff;padding:3px 5px;border-radius:4px}.builder-section.layout-v2 .section-container{box-sizing:border-box}.v2-slot-wrap{min-width:0;height:100%}.v2-slot-wrap>.lego-slot{height:100%}.responsive-type-previews{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:9px;align-items:start}.responsive-type-previews>div{display:grid;gap:4px}.responsive-type-previews>div>span{font-size:7px;font-weight:800;letter-spacing:.08em;color:#898d96}.responsive-type-previews>div:last-child .type-preview{min-height:110px}.type-preview.v2 .type-preview-container{transition:.15s}.type-categories button:first-child{font-weight:800}.type-categories button:first-child.active{background:#edf3ff;color:#2e60cc}@media(max-width:1100px){.responsive-type-previews{grid-template-columns:1fr}.responsive-type-previews>div:last-child{display:none}}\n`;
  writeFileSync(cssPath, css);
}
