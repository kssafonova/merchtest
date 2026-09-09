import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SITE_TREE_CHROME_V7';

if (!app.includes(MARKER)) {
  // Icons used by the fixed storefront header.
  if (!app.includes('  UserRound,')) {
    app = app.replace('  ShoppingBag,\n', '  ShoppingBag,\n  UserRound,\n');
  }

  // Do not expose the former root homepage in the editable page tree.
  app = app.replace(
    "Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, cloneTree(BASE_TREE)]))",
    "Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, cloneTree(BASE_TREE.filter((node) => node.id !== 'home'))]))"
  );
  app = app.replace(
    "const [pageIdByRegion, setPageIdByRegion] = useState({ RU: 'home', KZ: 'home', GCC: 'home', WW: 'home' });",
    "const [pageIdByRegion, setPageIdByRegion] = useState({ RU: 'new', KZ: 'new', GCC: 'new', WW: 'new' });"
  );
  app = app.replace(
    "Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { home: makeInitialSections() }]))",
    "Object.fromEntries(Object.keys(REGION_CONFIG).map((r) => [r, { new: makeInitialSections() }]))"
  );

  // A page may now have children. Every tree row gets its own + action.
  const treeStart = app.indexOf('function SiteTree(');
  const createStart = app.indexOf('function CreateTreeItem(', treeStart);
  if (treeStart < 0 || createStart < 0) throw new Error('SiteTree/CreateTreeItem anchors not found');

  const treeSource = `function treeContainsId(node, id) {\n  if (!id) return false;\n  if (node.id === id) return true;\n  return Boolean(node.children?.some((child) => treeContainsId(child, id)));\n}\n\nfunction SiteTree({ nodes, locale, selectedId, onSelect, onCreateInFolder, query = '', depth = 0 }) {\n  const [expanded, setExpanded] = useState(() => new Set(['catalog', 'women', 'men', 'kids', 'editorial', 'service']));\n  const toggle = (id) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });\n  const visibleNodes = nodes.filter((node) => node.id !== 'home');\n  return <div className=\"site-tree-level modern-site-tree\">{visibleNodes.map((node) => {\n    const hasChildren = Boolean(node.children?.length);\n    const isOpen = hasChildren && (query ? true : expanded.has(node.id) || treeContainsId(node, selectedId));\n    const isPage = Boolean(node.page);\n    return <div className=\"site-tree-node\" key={node.id}>\n      <div className={\`site-tree-row modern-tree-row ${'${selectedId === node.id ? \'selected\' : \'\'}'}\`} style={{ '--tree-depth': depth }}>\n        <button className=\"tree-chevron\" disabled={!hasChildren} onClick={(event) => { event.stopPropagation(); if (hasChildren) toggle(node.id); }} title={hasChildren ? (isOpen ? 'Свернуть' : 'Развернуть') : ''}>{hasChildren ? (isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span className=\"tree-dot\"/>}</button>\n        <button className=\"tree-page-label\" onClick={() => isPage ? onSelect(node.id) : toggle(node.id)}>\n          <span className={\`tree-kind-icon ${'${isPage ? \'page\' : \'group\'}'}\`}>{isPage ? <Monitor size={13}/> : <LayoutGrid size={13}/>}</span>\n          <span className=\"tree-label-copy\"><strong>{nameFor(node, locale)}</strong><small>{isPage ? 'Страница' : 'Раздел'}</small></span>\n        </button>\n        <button className=\"tree-add-child\" title={isPage ? 'Создать страницу внутри этой страницы' : 'Создать страницу внутри раздела'} onClick={(event) => { event.stopPropagation(); onCreateInFolder(node.id); }}><Plus size={14}/></button>\n      </div>\n      {node.children && isOpen && <SiteTree nodes={node.children} locale={locale} selectedId={selectedId} onSelect={onSelect} onCreateInFolder={onCreateInFolder} query={query} depth={depth + 1}/>}\n    </div>;\n  })}</div>;\n}\n\n`;
  app = app.slice(0, treeStart) + treeSource + app.slice(createStart);

  // Creating from + is intentionally contextual: the new page is fixed to the clicked parent.
  const createEnd = app.indexOf('\nexport default function AppV3()', app.indexOf('function CreateTreeItem('));
  if (createEnd < 0) throw new Error('CreateTreeItem end anchor not found');
  const createSource = `function CreateTreeItem({ open, kind, parentId, onClose, onCreate }) {\n  const [name, setName] = useState('');\n  if (!open) return null;\n  return <div className=\"tree-create-card nested-page-create\">\n    <div className=\"tree-create-head\"><div><span>ДОЧЕРНЯЯ СТРАНИЦА</span><strong>Новая страница</strong></div><button onClick={onClose}><X size={14}/></button></div>\n    <label>Название<input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && name.trim()) { const value = name.trim(); setName(''); onCreate({ kind: 'page', name: value, parentId }); } }} placeholder=\"Например, Льняная коллекция\"/></label>\n    <p>Страница будет создана внутри выбранного пункта дерева.</p>\n    <div className=\"tree-create-actions\"><button onClick={onClose}>Отмена</button><button className=\"primary\" disabled={!name.trim()} onClick={() => { const value = name.trim(); setName(''); onCreate({ kind: 'page', name: value, parentId }); }}>Создать страницу</button></div>\n  </div>;\n}\n\nfunction StorefrontHeader({ nav }) {\n  return <header className=\"fixed-storefront-header\">\n    <div className=\"storefront-header-row\">\n      <div className=\"storefront-logo\">LOGO</div>\n      <nav className=\"storefront-nav\">{nav.slice(0, 5).map((item) => <span key={item}>{item}</span>)}</nav>\n      <div className=\"storefront-actions\">\n        <button type=\"button\" title=\"Поиск\"><Search size={17}/></button>\n        <button type=\"button\" title=\"Личный кабинет\"><UserRound size={17}/></button>\n        <button type=\"button\" title=\"Корзина\"><ShoppingBag size={17}/></button>\n      </div>\n    </div>\n  </header>;\n}\n\nfunction StorefrontFooter() {\n  return <footer className=\"fixed-storefront-footer\">\n    <div className=\"storefront-footer-top\">\n      <div className=\"footer-brand\"><div className=\"storefront-logo footer-logo\">LOGO</div><p>Современная одежда и аксессуары. Онлайн-магазин.</p></div>\n      <div className=\"footer-column\"><strong>Покупателям</strong><span>Доставка и оплата</span><span>Возврат</span><span>Размерная сетка</span><span>Магазины</span></div>\n      <div className=\"footer-column\"><strong>О компании</strong><span>О бренде</span><span>Карьера</span><span>Контакты</span><span>Новости</span></div>\n      <div className=\"footer-column footer-contacts\"><strong>Связаться с нами</strong><span>+7 800 000-00-00</span><span>hello@brand.ru</span><small>Ежедневно, 09:00–21:00</small></div>\n    </div>\n    <div className=\"storefront-footer-bottom\"><span>© 2026 LOGO</span><span>Политика конфиденциальности</span><span>Публичная оферта</span></div>\n  </footer>;\n}\n`;
  app = app.slice(0, app.indexOf('function CreateTreeItem(')) + createSource + app.slice(createEnd);

  // Keep the creation form mounted per selected parent so its local state is always fresh.
  app = app.replace(
    '<CreateTreeItem open={Boolean(createKind)} kind={createKind || \'page\'} parentId={createParent} folders={folders} locale={locale}',
    '<CreateTreeItem key={createParent || createKind || \'create-page\'} open={Boolean(createKind)} kind={createKind || \'page\'} parentId={createParent}'
  );

  // Region selection in the menu: prominent visual cards, no language selector.
  const oldContext = '<div className="edit-context-row"><div><span>Регион</span><div className="mini-segment">{Object.keys(REGION_CONFIG).map((r) => <button key={r} className={region === r ? \'active\' : \'\'} onClick={() => switchRegion(r)}>{r}</button>)}</div></div><div><span>Язык</span><div className="mini-segment">{languages.map((lang) => <button key={lang} className={locale === lang ? \'active\' : \'\'} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div></div></div>';
  const newContext = '<div className="menu-region-picker"><div className="menu-region-label"><span>РЕГИОН ВИТРИНЫ</span><small>Структура страниц и контент могут отличаться по рынкам</small></div><div className="menu-region-options">{Object.keys(REGION_CONFIG).map((r) => <button key={r} className={region === r ? \'active\' : \'\'} onClick={() => switchRegion(r)}><strong>{r}</strong><span>{r === \'RU\' ? \'Россия\' : r === \'KZ\' ? \'Казахстан\' : r === \'GCC\' ? \'GCC\' : \'Global\'}</span></button>)}</div></div>';
  if (app.includes(oldContext)) app = app.replace(oldContext, newContext);
  else throw new Error('Menu language/region block not found');

  // Remove the redundant root-level create controls: every row now owns its + action.
  app = app.replace('<div className="tree-create-toolbar"><button onClick={() => openCreate(\'page\')}><Plus size={13}/> Пустая страница</button><button onClick={() => openCreate(\'folder\')}><Plus size={13}/> Папка</button></div>', '');
  app = app.replace('Дерево страниц хранится отдельно для региона {region}', 'Страницы региона {region} · + создаёт вложенную страницу');

  // Compact top-bar region selector instead of a native select.
  const topSelect = '<select value={region} onChange={(e) => switchRegion(e.target.value)}>{Object.keys(REGION_CONFIG).map((r) => <option key={r}>{r}</option>)}</select>';
  const topPicker = '<div className="top-region-picker"><span>Регион</span><div>{Object.keys(REGION_CONFIG).map((r) => <button key={r} className={region === r ? \'active\' : \'\'} onClick={() => switchRegion(r)}>{r}</button>)}</div></div>';
  if (app.includes(topSelect)) app = app.replace(topSelect, topPicker);

  // Replace the old storefront chrome. Header/footer do not participate in section selection or editing.
  const oldHeader = '<div className="site-store-header"><nav>{nav.map((item) => <span key={item}>{item}</span>)}</nav><div><Search size={17}/><Heart size={17}/><ShoppingBag size={17}/></div></div>';
  if (app.includes(oldHeader)) app = app.replace(oldHeader, '<StorefrontHeader nav={nav}/>');
  else throw new Error('Storefront header anchor not found');

  const canvasStart = app.indexOf('<section className="canvas-shell">');
  const inspectorStart = app.indexOf('<aside className="settings-panel', canvasStart);
  if (canvasStart < 0 || inspectorStart < 0) throw new Error('Canvas/inspector anchors not found');
  const canvasChunk = app.slice(canvasStart, inspectorStart);
  const canvasClose = canvasChunk.lastIndexOf('</div></section>');
  if (canvasClose < 0) throw new Error('Storefront frame closing anchor not found');
  if (!canvasChunk.includes('<StorefrontFooter/>')) {
    const insertAt = canvasStart + canvasClose;
    app = app.slice(0, insertAt) + '<StorefrontFooter/>' + app.slice(insertAt);
  }

  app = app.replace('const VISUAL_MERCH_PANEL_V6 = true;', 'const VISUAL_MERCH_PANEL_V6 = true;\nconst SITE_TREE_CHROME_V7 = true;');
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('site-tree-chrome-v7')) {
  css += `
/* site-tree-chrome-v7 */
.edit-navigation-popover{width:430px!important;max-height:min(760px,calc(100vh - 78px));overflow:hidden!important;display:flex!important;flex-direction:column!important;background:#fff!important;border:1px solid #dfe3e8!important;border-radius:12px!important;box-shadow:0 20px 55px rgba(20,27,40,.18)!important}
.edit-popover-head{padding:15px 16px 12px!important;border-bottom:1px solid #eceef2!important;background:#fbfbfc!important}.edit-popover-head span{font-size:8px!important;letter-spacing:.1em!important;color:#8a8f98!important}.edit-popover-head strong{font-size:15px!important;margin-top:3px!important}
.menu-region-picker{padding:12px 14px;border-bottom:1px solid #eceef2;background:#fff}.menu-region-label{display:grid;gap:2px;margin-bottom:8px}.menu-region-label span{font-size:8px;font-weight:800;letter-spacing:.08em;color:#6f747d}.menu-region-label small{font-size:8px;color:#9a9ea6}.menu-region-options{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.menu-region-options button{min-width:0;height:50px;border:1px solid #e0e3e8;border-radius:8px;background:#fff;display:grid;place-content:center;gap:1px;text-align:center;cursor:pointer}.menu-region-options button strong{font-size:11px;color:#2d3138}.menu-region-options button span{font-size:7px;color:#9a9ea6}.menu-region-options button:hover{border-color:#b8c5d8;background:#fafcff}.menu-region-options button.active{border-color:#1f232a;background:#1f232a}.menu-region-options button.active strong,.menu-region-options button.active span{color:#fff}
.edit-tree-search{margin:11px 14px 7px!important}.region-tree-hint{margin:0 14px 6px!important;padding:0!important;background:transparent!important;color:#92969e!important;font-size:8px!important}.edit-tree-scroll{padding:2px 8px 12px!important;overflow:auto!important;min-height:220px;max-height:430px}
.modern-site-tree{display:grid;gap:1px}.modern-tree-row{min-height:43px!important;padding-left:calc(5px + var(--tree-depth) * 17px)!important;padding-right:5px!important;border-radius:7px!important;border:1px solid transparent;display:grid!important;grid-template-columns:24px minmax(0,1fr) 30px!important;align-items:center!important;gap:3px!important}.modern-tree-row:hover{background:#f7f8fa;border-color:#eff0f3}.modern-tree-row.selected{background:#f1f5fb!important;border-color:#d8e2f1!important}.tree-chevron{width:24px!important;height:28px!important;border:0!important;background:transparent!important;display:grid!important;place-items:center!important;color:#858a93!important}.tree-chevron:disabled{opacity:.45}.tree-dot{width:4px;height:4px;border-radius:50%;background:#c8ccd3}.tree-page-label{min-width:0!important;display:flex!important;align-items:center!important;gap:8px!important;text-align:left!important;border:0!important;background:transparent!important;padding:3px 0!important}.tree-kind-icon{width:26px;height:26px;border-radius:6px;background:#f0f1f4;display:grid;place-items:center;color:#6d737d;flex:0 0 auto}.tree-kind-icon.page{background:#f0f4fa;color:#45617f}.tree-label-copy{min-width:0;display:grid;gap:1px}.tree-label-copy strong{font-size:10px!important;font-weight:700!important;color:#30343b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tree-label-copy small{font-size:7px!important;color:#9b9fa7!important;font-weight:500!important}.tree-add-child{width:28px!important;height:28px!important;border:1px solid transparent!important;border-radius:6px!important;background:transparent!important;color:#787d86!important;display:grid!important;place-items:center!important;opacity:.45;transition:.15s}.modern-tree-row:hover .tree-add-child,.modern-tree-row.selected .tree-add-child{opacity:1}.tree-add-child:hover{border-color:#cbd4df!important;background:#fff!important;color:#222831!important}
.nested-page-create{margin:5px 14px 10px!important;border:1px solid #dfe3e8!important;border-radius:9px!important;padding:11px!important;background:#fafbfc!important;box-shadow:none!important}.nested-page-create .tree-create-head>div{display:grid;gap:2px}.nested-page-create .tree-create-head span{font-size:7px;color:#92969f;letter-spacing:.08em;font-weight:800}.nested-page-create label{display:grid;gap:4px;margin-top:9px;font-size:8px;font-weight:700;color:#656a73}.nested-page-create input{height:34px;border:1px solid #d8dce3;border-radius:6px;background:#fff;padding:0 9px;font-size:10px;outline:0}.nested-page-create input:focus{border-color:#7f9bc8;box-shadow:0 0 0 2px rgba(80,111,161,.08)}.nested-page-create p{margin:7px 0 0;font-size:8px;color:#93979f}.nested-page-create .tree-create-actions{margin-top:10px}
.top-region-picker{height:34px;border:1px solid #dfe2e8;border-radius:7px;background:#fff;padding:3px 4px 3px 8px;display:flex;align-items:center;gap:7px}.top-region-picker>span{font-size:7px;text-transform:uppercase;letter-spacing:.07em;color:#8a8f98;font-weight:800}.top-region-picker>div{display:flex;align-items:center;gap:2px}.top-region-picker button{height:25px;min-width:30px;border:0;border-radius:5px;background:transparent;font-size:8px;font-weight:800;color:#6e737c}.top-region-picker button:hover{background:#f0f2f5}.top-region-picker button.active{background:#20242a;color:#fff}
.fixed-storefront-header{background:#fff;border-bottom:1px solid #e6e6e6;position:relative;z-index:3;user-select:none}.storefront-header-row{height:66px;display:grid;grid-template-columns:150px minmax(0,1fr) 150px;align-items:center;padding:0 30px;gap:20px}.storefront-logo{font-size:25px;line-height:1;letter-spacing:-.05em;font-weight:900;color:#111}.storefront-nav{display:flex;justify-content:center;align-items:center;gap:24px;min-width:0}.storefront-nav span{font-size:10px;font-weight:600;white-space:nowrap;color:#252525}.storefront-actions{display:flex;justify-content:flex-end;align-items:center;gap:4px}.storefront-actions button{width:32px;height:32px;border:0;background:transparent;display:grid;place-items:center;color:#161616;border-radius:50%;pointer-events:none}
.fixed-storefront-footer{margin-top:28px;background:#111;color:#fff;padding:38px 34px 18px;user-select:none}.storefront-footer-top{display:grid;grid-template-columns:1.35fr repeat(3,1fr);gap:28px}.footer-brand p{max-width:220px;margin:12px 0 0;font-size:9px;line-height:1.55;color:#aeb0b5}.footer-logo{color:#fff}.footer-column{display:grid;align-content:start;gap:8px}.footer-column strong{margin-bottom:4px;font-size:9px;text-transform:uppercase;letter-spacing:.05em}.footer-column span{font-size:8px;color:#c7c8cb}.footer-column small{font-size:7px;color:#81848a}.storefront-footer-bottom{margin-top:30px;padding-top:14px;border-top:1px solid #2d2d2d;display:flex;gap:20px;flex-wrap:wrap}.storefront-footer-bottom span{font-size:7px;color:#777a80}
.storefront-frame.mobile .storefront-header-row{height:56px;grid-template-columns:1fr auto;padding:0 14px}.storefront-frame.mobile .storefront-logo{font-size:20px}.storefront-frame.mobile .storefront-nav{display:none}.storefront-frame.mobile .storefront-actions{gap:0}.storefront-frame.mobile .storefront-actions button{width:30px;height:30px}.storefront-frame.mobile .fixed-storefront-footer{padding:28px 16px 16px}.storefront-frame.mobile .storefront-footer-top{grid-template-columns:1fr 1fr;gap:22px 14px}.storefront-frame.mobile .footer-brand{grid-column:1/-1}.storefront-frame.mobile .footer-contacts{grid-column:1/-1}.storefront-frame.mobile .storefront-footer-bottom{display:grid;gap:6px;margin-top:22px}
@media(max-width:1100px){.edit-navigation-popover{width:min(430px,calc(100vw - 28px))!important}.storefront-header-row{grid-template-columns:110px minmax(0,1fr) 110px;padding:0 18px}.storefront-nav{gap:13px}.storefront-nav span{font-size:8px}}
`;
  writeFileSync(cssPath, css);
}

console.log('Site tree + fixed storefront chrome v7 applied');
