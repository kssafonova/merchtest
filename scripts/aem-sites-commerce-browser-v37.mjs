import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AEM_SITES_COMMERCE_BROWSER_V37';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_DYNAMIC_LAYOUT_MODE_V36 = true;';
  if (!app.includes(anchor)) throw new Error('AEM_SITES_COMMERCE_BROWSER_V37: V36 marker missing');

  const helpers = String.raw`
function aemUniqueValuesV37(key, filter = null) {
  const source = filter ? PRODUCTS.filter(filter) : PRODUCTS;
  return Array.from(new Set(source.map((item) => String(item?.[key] || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ru'));
}

function aemProductFacetCountV37(key, value, region) {
  if (!value || value === 'Все') return PRODUCTS.length;
  if (key === 'availability') return PRODUCTS.filter((item) => value === 'В наличии' ? pageStock(item, region) > 0 : pageStock(item, region) <= 0).length;
  if (key === 'newness') return PRODUCTS.filter((item) => value === 'Новинки' ? Boolean(item.isNew) : !item.isNew).length;
  if (key === 'discount') return PRODUCTS.filter((item) => value === 'Со скидкой' ? Number(item.discount || 0) > 0 : Number(item.discount || 0) <= 0).length;
  return PRODUCTS.filter((item) => String(item?.[key] || '') === String(value)).length;
}

function AemFacetGroupV37({ title, value, options = [], onChange, countFor, open = false }) {
  const activeCount = value && value !== 'Все' ? 1 : 0;
  return <details className="aem-facet-group-v37" open={open}>
    <summary><span>{title}</span>{activeCount > 0 && <b>{activeCount}</b>}<ChevronDown size={13}/></summary>
    <div className="aem-facet-options-v37">
      <button className={!value || value === 'Все' ? 'active' : ''} onClick={(event) => { event.preventDefault(); onChange('Все'); }}><i/><span>Все</span><em>{countFor ? countFor('Все') : ''}</em></button>
      {options.filter((option) => option && option !== 'Все').map((option) => <button key={option} className={value === option ? 'active' : ''} onClick={(event) => { event.preventDefault(); onChange(value === option ? 'Все' : option); }}><i/><span>{option}</span><em>{countFor ? countFor(option) : ''}</em></button>)}
    </div>
  </details>;
}

function AemCommerceCatalogBrowserV37({ department, category, subcategory, onDepartment, onCategory, onSubcategory, region }) {
  const departments = aemUniqueValuesV37('department');
  const categories = aemUniqueValuesV37('category', (item) => department === 'Все' || item.department === department);
  const subcategories = aemUniqueValuesV37('subcategory', (item) => (department === 'Все' || item.department === department) && (category === 'Все' || item.category === category));
  const count = (field, value) => PRODUCTS.filter((item) => {
    if (field === 'department') return item.department === value;
    if (field === 'category') return (department === 'Все' || item.department === department) && item.category === value;
    return (department === 'Все' || item.department === department) && (category === 'Все' || item.category === category) && item.subcategory === value;
  }).filter((item) => pageStock(item, region) >= 0).length;
  return <div className="aem-commerce-catalog-v37">
    <div className="aem-catalog-path-v37"><button onClick={() => { onDepartment('Все'); onCategory('Все'); onSubcategory('Все'); }}>Каталог</button>{department !== 'Все' && <><ChevronRight size={11}/><button onClick={() => { onCategory('Все'); onSubcategory('Все'); }}>{department}</button></>}{category !== 'Все' && <><ChevronRight size={11}/><button onClick={() => onSubcategory('Все')}>{category}</button></>}{subcategory !== 'Все' && <><ChevronRight size={11}/><strong>{subcategory}</strong></>}</div>
    <div className="aem-catalog-columns-v37">
      <section><span>ОТДЕЛ</span>{departments.map((item) => <button key={item} className={department === item ? 'active' : ''} onClick={() => { onDepartment(item); onCategory('Все'); onSubcategory('Все'); }}><span>{item}</span><em>{count('department', item)}</em><ChevronRight size={12}/></button>)}</section>
      {department !== 'Все' && <section><span>КАТЕГОРИЯ</span>{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => { onCategory(item); onSubcategory('Все'); }}><span>{item}</span><em>{count('category', item)}</em><ChevronRight size={12}/></button>)}</section>}
      {category !== 'Все' && subcategories.length > 0 && <section><span>ПОДКАТЕГОРИЯ</span>{subcategories.map((item) => <button key={item} className={subcategory === item ? 'active' : ''} onClick={() => onSubcategory(item)}><span>{item}</span><em>{count('subcategory', item)}</em></button>)}</section>}
    </div>
  </div>;
}
`;
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  // Replace the page tree with an AEM Content Tree-like interaction: hierarchy first, actions on demand.
  const treeStart = app.indexOf('function SiteTree(');
  const treeEnd = treeStart >= 0 ? app.indexOf('function CreateTreeItem(', treeStart) : -1;
  if (treeStart < 0 || treeEnd < 0) throw new Error('AEM_SITES_COMMERCE_BROWSER_V37: SiteTree boundaries missing');
  const treeSource = String.raw`function SiteTree({ nodes, locale, selectedId, onSelect, onCreateInFolder, onRename, onDelete, onMove, getStats, query = '', depth = 0 }) {
  const [expanded, setExpanded] = useState(() => new Set(['home','catalog','women','men','kids','editorial','service']));
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const toggle = (id) => setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const beginEdit = (node) => { setEditingId(node.id); setEditName(nameFor(node, locale)); setMenuId(null); };
  const commitEdit = (node) => { const next = editName.trim(); if (next && next !== nameFor(node, locale)) onRename?.(node.id, next); setEditingId(null); setEditName(''); };
  return <div className="site-tree-level aem-sites-tree-v37">{(nodes || []).map((node) => {
    const hasChildren = Boolean(node.children?.length);
    const isOpen = hasChildren && (query ? true : expanded.has(node.id) || treeContainsId(node, selectedId));
    const isPage = Boolean(node.page);
    const stats = getStats?.(node) || { total: 0, oos: 0 };
    const status = isPage ? (stats.total > 0 || node.id === 'home' ? 'published' : 'draft') : 'folder';
    const isEditing = editingId === node.id;
    return <div className="site-tree-node aem-tree-node-v37" key={node.id}>
      <div className={'aem-tree-row-v37 ' + (selectedId === node.id ? 'selected ' : '') + (dragOver?.id === node.id ? 'drop-' + dragOver.position : '')} style={{ '--aem-depth': depth }} draggable={!isEditing} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-site-tree-id', node.id); }} onDragEnd={() => setDragOver(null)} onDragOver={(event) => { const sourceId = event.dataTransfer.getData('application/x-site-tree-id'); if (!sourceId || sourceId === node.id) return; event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const ratio = (event.clientY - rect.top) / Math.max(rect.height, 1); setDragOver({ id: node.id, position: ratio < .25 ? 'before' : ratio > .75 ? 'after' : 'inside' }); }} onDrop={(event) => { event.preventDefault(); const sourceId = event.dataTransfer.getData('application/x-site-tree-id'); if (sourceId && sourceId !== node.id) onMove?.(sourceId, node.id, dragOver?.position || 'inside'); setDragOver(null); }}>
        <span className="aem-tree-indent-v37" aria-hidden="true"/>
        <button className="aem-tree-chevron-v37" disabled={!hasChildren} onClick={(event) => { event.stopPropagation(); if (hasChildren) toggle(node.id); }}>{hasChildren ? (isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span/>}</button>
        <span className={'aem-tree-kind-v37 ' + (isPage ? 'page' : 'folder')}>{isPage ? <Monitor size={13}/> : <LayoutGrid size={13}/>}</span>
        {isEditing ? <div className="aem-tree-edit-v37"><input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} onBlur={() => commitEdit(node)} onKeyDown={(event) => { if (event.key === 'Enter') commitEdit(node); if (event.key === 'Escape') { setEditingId(null); setEditName(''); } }}/></div> : <button className="aem-tree-title-v37" onClick={() => isPage ? onSelect(node.id) : toggle(node.id)}><strong>{nameFor(node, locale)}</strong><small>{isPage ? 'Страница' : (node.children?.length || 0) + ' элементов'}</small></button>}
        {isPage && <span className={'aem-tree-status-v37 ' + status} title={status === 'published' ? 'Опубликовано' : 'Черновик'}><i/>{status === 'published' ? 'PUBLIC' : 'DRAFT'}</span>}
        {(stats.total > 0 || stats.oos > 0) && <span className="aem-tree-commerce-v37" title="Commerce-контент"><ShoppingBag size={11}/>{stats.total}{stats.oos > 0 && <b>{stats.oos}</b>}</span>}
        <div className="aem-tree-more-wrap-v37"><button className="aem-tree-more-v37" onClick={(event) => { event.stopPropagation(); setMenuId(menuId === node.id ? null : node.id); }}><MoreHorizontal size={15}/></button>{menuId === node.id && <div className="aem-tree-menu-v37" onClick={(event) => event.stopPropagation()}><button onClick={() => { onCreateInFolder(node.id); setMenuId(null); }}><Plus size={13}/>Создать дочернюю страницу</button><button onClick={() => beginEdit(node)}><Pencil size={13}/>Переименовать</button><button className="danger" onClick={() => { setMenuId(null); if (window.confirm('Удалить «' + nameFor(node, locale) + '» и вложенные страницы?')) onDelete?.(node.id); }}><Trash2 size={13}/>Удалить</button></div>}</div>
      </div>
      {node.children && isOpen && <SiteTree nodes={node.children} locale={locale} selectedId={selectedId} onSelect={onSelect} onCreateInFolder={onCreateInFolder} onRename={onRename} onDelete={onDelete} onMove={onMove} getStats={getStats} query={query} depth={depth + 1}/>} 
    </div>;
  })}</div>;
}

`;
  app = app.slice(0, treeStart) + treeSource + app.slice(treeEnd);

  // AEM-like Sites panel chrome.
  app = app.replace('<div className="edit-popover-head"><div><span>ДЕРЕВО СТРАНИЦ</span><strong>{currentPageName}</strong></div>', '<div className="edit-popover-head aem-sites-panel-head-v37"><div><span>AEM SITES · CONTENT TREE</span><strong>Страницы</strong><small>/content/storefront/{region}</small></div>');
  app = app.replace('<div className="edit-tree-search">', '<div className="aem-sites-path-v37"><span>Sites</span><ChevronRight size={11}/><span>Storefront</span><ChevronRight size={11}/><strong>{region}</strong></div><div className="edit-tree-search aem-tree-search-v37">');
  app = app.replace('placeholder="Поиск страницы / категории"', 'placeholder="Поиск страниц"');
  app = app.replace('Синий — товаров в разделе · красный — из них нет в наличии', 'CONTENT TREE · Статус публикации и Commerce-контент');
  app = app.replace('<div className="tree-create-toolbar"><button onClick={() => openCreate(\'page\')}', '<div className="tree-create-toolbar aem-tree-create-v37"><button onClick={() => openCreate(\'page\')}' );
  app = app.replace('Пустая страница</button><button onClick={() => openCreate(\'folder\')}', 'Создать страницу</button><button onClick={() => openCreate(\'folder\')}' );
  app = app.replace('Папка</button></div>', 'Раздел</button></div>');

  // Extra browser state for AEM/CIF search, catalog browsing and Asset facets.
  const stateAnchor = "const [productFiltersOpen, setProductFiltersOpen] = useState(false);";
  if (!app.includes(stateAnchor)) throw new Error('AEM_SITES_COMMERCE_BROWSER_V37: filter state anchor missing');
  app = app.replace(stateAnchor, stateAnchor + "\n  const [commerceBrowseMode, setCommerceBrowseMode] = useState('search');\n  const [mediaOrientation, setMediaOrientation] = useState('Все');\n  const [assetSource, setAssetSource] = useState('Все');");

  const mediaFilterAnchor = "const kindMatch = mediaKind === 'Все' || item.kind === mediaKind;\n      return searchMatch && kindMatch;";
  if (app.includes(mediaFilterAnchor)) {
    app = app.replace(mediaFilterAnchor, "const kindMatch = mediaKind === 'Все' || item.kind === mediaKind;\n      const orientation = entityRatioOrientationV30(item);\n      const orientationMatch = mediaOrientation === 'Все' || orientation === mediaOrientation;\n      const sourceMatch = assetSource === 'Все' || (assetSource === 'Загруженные' ? Boolean(item.uploaded) : !item.uploaded);\n      return searchMatch && kindMatch && orientationMatch && sourceMatch;");
    app = app.replace('mediaKind, uploadedMedia, region]);', 'mediaKind, mediaOrientation, assetSource, uploadedMedia, region]);');
  }

  // Replace only content-browser controls; keep the established card grid and slot interactions.
  const browserStart = app.indexOf('<div className="simple-content-type-tabs">');
  const browserEnd = browserStart >= 0 ? app.indexOf('<div className="settings-scroll content-library-scroll simple-library-scroll">', browserStart) : -1;
  if (browserStart < 0 || browserEnd < 0) throw new Error('AEM_SITES_COMMERCE_BROWSER_V37: simple content browser boundaries missing');
  const browserSource = String.raw`<div className="aem-content-source-tabs-v37">
        <button className={contentTab === 'product' ? 'active' : ''} onClick={() => { setContentTab('product'); setQuery(''); }}><ShoppingBag size={14}/><span><strong>Commerce</strong><small>Товары и категории</small></span></button>
        <button className={contentTab === 'look' ? 'active' : ''} onClick={() => { setContentTab('look'); setQuery(''); }}><Sparkles size={14}/><span><strong>Образы</strong><small>Editorial sets</small></span></button>
        <button className={contentTab === 'media' ? 'active' : ''} onClick={() => { setContentTab('media'); setQuery(''); }}><ImageIcon size={14}/><span><strong>Assets</strong><small>Фото, видео, SVG</small></span></button>
      </div>

      {selectedSlot && <div className="aem-selected-slot-v37"><Pin size={12}/><span><strong>Слот {selectedSlot.slotIndex + 1}</strong><small>Выберите ресурс или перетащите его в слот.</small></span><button onClick={() => setSelectedSlot(null)}><X size={12}/></button></div>}

      <div className="aem-browser-shell-v37">
        <div className="aem-browser-source-v37"><span>{contentTab === 'product' ? 'ADOBE COMMERCE · CATALOG' : contentTab === 'media' ? 'AEM ASSETS · DAM' : 'AEM CONTENT · EDITORIAL'}</span><strong>{contentTab === 'product' ? 'Product Picker' : contentTab === 'media' ? 'Asset Browser' : 'Content Browser'}</strong><small>{visibleLibrary.length} результатов · {region}</small></div>

        {contentTab === 'product' && <>
          <div className="aem-commerce-mode-v37"><button className={commerceBrowseMode === 'search' ? 'active' : ''} onClick={() => setCommerceBrowseMode('search')}><Search size={13}/>Поиск</button><button className={commerceBrowseMode === 'catalog' ? 'active' : ''} onClick={() => setCommerceBrowseMode('catalog')}><LayoutGrid size={13}/>Каталог</button></div>
          {commerceBrowseMode === 'search' ? <>
            <div className="aem-search-field-v37"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setAppliedProductQuery(query.trim()); setAppliedProductFilters({ department: productDepartment, category: productCategory, subcategory: productSubcategory, collection: productCollection, color: productColor, availability: productAvailability, newness: productNewness, discount: productDiscount }); } }} placeholder="Название, SKU, материал, цвет…"/>{query && <button onClick={() => { setQuery(''); setAppliedProductQuery(''); }}><X size={12}/></button>}</div>
            <div className="aem-active-filters-v37">
              {productDepartment !== 'Все' && <button onClick={() => { setProductDepartment('Все'); setProductCategory('Все'); setProductSubcategory('Все'); }}>{productDepartment}<X size={10}/></button>}
              {productCategory !== 'Все' && <button onClick={() => { setProductCategory('Все'); setProductSubcategory('Все'); }}>{productCategory}<X size={10}/></button>}
              {productSubcategory !== 'Все' && <button onClick={() => setProductSubcategory('Все')}>{productSubcategory}<X size={10}/></button>}
              {productCollection !== 'Все' && <button onClick={() => setProductCollection('Все')}>{productCollection}<X size={10}/></button>}
              {productColor !== 'Все' && <button onClick={() => setProductColor('Все')}>{productColor}<X size={10}/></button>}
            </div>
            <div className="aem-facets-v37">
              <div className="aem-facets-title-v37"><span>ФИЛЬТРЫ</span><button onClick={() => { setQuery(''); setAppliedProductQuery(''); setProductDepartment('Все'); setProductCategory('Все'); setProductSubcategory('Все'); setProductCollection('Все'); setProductColor('Все'); setProductAvailability('Все'); setProductNewness('Все'); setProductDiscount('Все'); setAppliedProductFilters({ department: 'Все', category: 'Все', subcategory: 'Все', collection: 'Все', color: 'Все', availability: 'Все', newness: 'Все', discount: 'Все' }); }}>Очистить всё</button></div>
              <AemFacetGroupV37 title="Отдел" value={productDepartment} options={aemUniqueValuesV37('department')} onChange={(value) => { setProductDepartment(value); setProductCategory('Все'); setProductSubcategory('Все'); }} countFor={(value) => aemProductFacetCountV37('department', value, region)} open/>
              <AemFacetGroupV37 title="Категория" value={productCategory} options={aemUniqueValuesV37('category', (item) => productDepartment === 'Все' || item.department === productDepartment)} onChange={(value) => { setProductCategory(value); setProductSubcategory('Все'); }} countFor={(value) => aemProductFacetCountV37('category', value, region)}/>
              <AemFacetGroupV37 title="Подкатегория" value={productSubcategory} options={aemUniqueValuesV37('subcategory', (item) => (productDepartment === 'Все' || item.department === productDepartment) && (productCategory === 'Все' || item.category === productCategory))} onChange={setProductSubcategory} countFor={(value) => aemProductFacetCountV37('subcategory', value, region)}/>
              <AemFacetGroupV37 title="Коллекция" value={productCollection} options={aemUniqueValuesV37('collection')} onChange={setProductCollection} countFor={(value) => aemProductFacetCountV37('collection', value, region)}/>
              <AemFacetGroupV37 title="Цвет" value={productColor} options={aemUniqueValuesV37('color')} onChange={setProductColor} countFor={(value) => aemProductFacetCountV37('color', value, region)}/>
              <div className="aem-commerce-status-v37"><span>СТАТУС ТОВАРА</span><div><button className={productAvailability === 'В наличии' ? 'active' : ''} onClick={() => setProductAvailability(productAvailability === 'В наличии' ? 'Все' : 'В наличии')}><i className="ok"/>В наличии <em>{aemProductFacetCountV37('availability','В наличии',region)}</em></button><button className={productAvailability === 'Нет в наличии' ? 'active' : ''} onClick={() => setProductAvailability(productAvailability === 'Нет в наличии' ? 'Все' : 'Нет в наличии')}><i className="critical"/>Нет в наличии <em>{aemProductFacetCountV37('availability','Нет в наличии',region)}</em></button><button className={productNewness === 'Новинки' ? 'active' : ''} onClick={() => setProductNewness(productNewness === 'Новинки' ? 'Все' : 'Новинки')}>Новинки <em>{aemProductFacetCountV37('newness','Новинки',region)}</em></button><button className={productDiscount === 'Со скидкой' ? 'active' : ''} onClick={() => setProductDiscount(productDiscount === 'Со скидкой' ? 'Все' : 'Со скидкой')}>Со скидкой <em>{aemProductFacetCountV37('discount','Со скидкой',region)}</em></button></div></div>
            </div>
          </> : <AemCommerceCatalogBrowserV37 department={productDepartment} category={productCategory} subcategory={productSubcategory} onDepartment={setProductDepartment} onCategory={setProductCategory} onSubcategory={setProductSubcategory} region={region}/>} 
          <div className="aem-browser-resultbar-v37"><span>{commerceBrowseMode === 'search' ? 'FULL-TEXT + FACETS' : 'CATALOG BROWSE'}</span><strong>{visibleLibrary.length} товаров</strong></div>
        </>}

        {contentTab === 'look' && <>
          <div className="aem-search-field-v37"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название образа, артикул товара…"/>{query && <button onClick={() => setQuery('')}><X size={12}/></button>}</div>
          <div className="aem-facets-v37 compact"><AemFacetGroupV37 title="Отдел" value={lookDepartment} options={lookDepartmentOptions} onChange={setLookDepartment} open/><AemFacetGroupV37 title="Коллекция" value={lookCollection} options={lookCollectionOptions} onChange={setLookCollection}/></div>
          <div className="aem-browser-resultbar-v37"><span>EDITORIAL CONTENT</span><strong>{visibleLibrary.length} образов</strong></div>
        </>}

        {contentTab === 'media' && <>
          <div className="aem-search-field-v37"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, файл, metadata…"/>{query && <button onClick={() => setQuery('')}><X size={12}/></button>}</div>
          <div className="aem-facets-v37 compact">
            <AemFacetGroupV37 title="Тип ресурса" value={mediaKind} options={['image','video','svg']} onChange={setMediaKind} open/>
            <AemFacetGroupV37 title="Ориентация" value={mediaOrientation} options={['portrait','landscape']} onChange={setMediaOrientation}/>
            <AemFacetGroupV37 title="Источник" value={assetSource} options={['Каталог','Загруженные']} onChange={setAssetSource}/>
          </div>
          <label className="aem-asset-upload-v37"><Plus size={13}/><span><strong>Добавить assets</strong><small>Фото, видео или SVG</small></span><input type="file" multiple accept="image/*,video/*,.svg" onChange={(event) => { addMediaFiles(event.target.files); event.target.value = ''; }}/></label>
          <div className="aem-browser-resultbar-v37"><span>ASSET SEARCH + METADATA</span><strong>{visibleLibrary.length} файлов</strong></div>
        </>}
      </div>

      `;
  app = app.slice(0, browserStart) + browserSource + app.slice(browserEnd);

  // Rename the panel chrome to match its new browser role.
  app = app.replace("{rightTab === 'settings' && selected ? 'Настройки секции' : 'Контент'}", "{rightTab === 'settings' && selected ? 'Настройки секции' : 'Браузер контента'}");
  app = app.replace("{rightTab === 'settings' && selected ? (selected.titles[locale] || selected.titles.ru) : visibleLibrary.length + ' результатов' + (selectedSlot ? ' · слот ' + (selectedSlot.slotIndex + 1) : '')}", "{rightTab === 'settings' && selected ? (selected.titles[locale] || selected.titles.ru) : (contentTab === 'product' ? 'Commerce' : contentTab === 'media' ? 'Assets' : 'Editorial') + ' · ' + visibleLibrary.length + ' результатов'}");

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* aem-sites-commerce-browser-v37 */')) {
  css += String.raw`
/* aem-sites-commerce-browser-v37 */
/* AEM Sites-like Content Tree */
.edit-navigation-popover{width:min(410px,calc(100vw - 24px))!important;background:#fff!important;border:1px solid #d9d9d9!important;border-radius:0!important;box-shadow:0 14px 34px rgba(0,0,0,.12)!important}
.aem-sites-panel-head-v37{padding:16px 16px 12px!important;border-bottom:1px solid #e5e5e5!important}.aem-sites-panel-head-v37>div{display:grid;gap:2px}.aem-sites-panel-head-v37 span{font-size:9px!important;letter-spacing:.08em!important;color:#666!important}.aem-sites-panel-head-v37 strong{font-size:18px!important;font-weight:500!important}.aem-sites-panel-head-v37 small{font-size:9px;color:#8a8a8a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.aem-sites-path-v37{min-height:34px;padding:0 14px;display:flex;align-items:center;gap:5px;border-bottom:1px solid #eee;color:#777;font-size:9px}.aem-sites-path-v37 strong{color:#111;font-weight:600}.aem-tree-search-v37{margin:10px 12px 8px!important;height:36px!important;border:0!important;border-bottom:1px solid #bbb!important;border-radius:0!important;background:#fff!important}.aem-tree-search-v37 input{font-size:10px!important}.region-tree-hint{padding:6px 14px 8px!important;font-size:8px!important;letter-spacing:.06em!important;color:#888!important;background:#fff!important;border:0!important}.aem-tree-create-v37{padding:10px 12px 4px!important;gap:6px!important}.aem-tree-create-v37 button{height:32px!important;border:1px solid #d8d8d8!important;border-radius:0!important;background:#fff!important;color:#222!important;font-size:9px!important;font-weight:500!important}.aem-tree-create-v37 button:hover{border-color:#111!important}
.edit-tree-scroll{padding:4px 8px 12px!important;background:#fff!important}.aem-sites-tree-v37{display:grid;gap:0}.aem-tree-node-v37{min-width:0}.aem-tree-row-v37{position:relative;min-height:40px;padding:3px 6px 3px calc(6px + var(--aem-depth,0)*18px);display:grid;grid-template-columns:20px 22px minmax(0,1fr) auto auto;align-items:center;gap:3px;border-left:2px solid transparent;color:#222}.aem-tree-row-v37:hover{background:#f7f7f7}.aem-tree-row-v37.selected{background:#f1f1f1;border-left-color:#111}.aem-tree-row-v37.drop-before:before,.aem-tree-row-v37.drop-after:after{content:"";position:absolute;left:4px;right:4px;height:1px;background:#111}.aem-tree-row-v37.drop-before:before{top:0}.aem-tree-row-v37.drop-after:after{bottom:0}.aem-tree-indent-v37{position:absolute;left:calc(15px + var(--aem-depth,0)*18px);top:0;bottom:0;border-left:1px solid #eee;pointer-events:none}.aem-tree-chevron-v37,.aem-tree-more-v37{width:20px;height:26px;border:0!important;background:transparent!important;display:grid;place-items:center;color:#777;cursor:pointer}.aem-tree-chevron-v37:disabled{opacity:.25}.aem-tree-kind-v37{width:22px;height:22px;display:grid;place-items:center;color:#666}.aem-tree-kind-v37.folder{color:#333}.aem-tree-title-v37{min-width:0;border:0!important;background:transparent!important;text-align:left!important;padding:3px 4px!important;display:grid;gap:0;cursor:pointer}.aem-tree-title-v37 strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px!important;font-weight:500!important;color:#1d1d1d!important}.aem-tree-title-v37 small{font-size:7px!important;color:#999!important;font-weight:400!important}.aem-tree-status-v37{display:flex;align-items:center;gap:4px;font-size:7px;letter-spacing:.05em;color:#777}.aem-tree-status-v37 i{width:5px;height:5px;border-radius:50%;background:#a0a0a0}.aem-tree-status-v37.published i{background:#2e7d32}.aem-tree-commerce-v37{height:22px;display:flex;align-items:center;gap:3px;padding:0 4px;color:#666;font-size:8px}.aem-tree-commerce-v37 b{min-width:14px;height:14px;padding:0 3px;display:grid;place-items:center;border:1px solid #c0392b;color:#c0392b;font-size:7px;font-weight:500}.aem-tree-more-wrap-v37{position:relative}.aem-tree-more-v37{opacity:0}.aem-tree-row-v37:hover .aem-tree-more-v37,.aem-tree-row-v37.selected .aem-tree-more-v37{opacity:1}.aem-tree-menu-v37{position:absolute;z-index:40;right:0;top:28px;width:190px;padding:5px;background:#fff;border:1px solid #d8d8d8;box-shadow:0 8px 22px rgba(0,0,0,.12);display:grid}.aem-tree-menu-v37 button{height:34px;border:0;background:#fff;padding:0 8px;display:flex;align-items:center;gap:8px;text-align:left;font-size:9px;color:#222;cursor:pointer}.aem-tree-menu-v37 button:hover{background:#f5f5f5}.aem-tree-menu-v37 button.danger{color:#9d2f26}.aem-tree-edit-v37{min-width:0}.aem-tree-edit-v37 input{width:100%;height:28px;border:0!important;border-bottom:1px solid #111!important;border-radius:0!important;padding:0 4px!important;font-size:10px!important;outline:0!important}

/* AEM/CIF-like content browser */
.aem-content-source-tabs-v37{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid #e5e5e5;background:#fff}.aem-content-source-tabs-v37 button{min-width:0;height:52px;padding:7px 9px;border:0;border-bottom:2px solid transparent;background:#fff;color:#777;display:flex;align-items:center;gap:7px;text-align:left;cursor:pointer}.aem-content-source-tabs-v37 button.active{color:#111;border-bottom-color:#111}.aem-content-source-tabs-v37 button>span{min-width:0;display:grid;gap:1px}.aem-content-source-tabs-v37 strong{font-size:9px;font-weight:600}.aem-content-source-tabs-v37 small{font-size:7px;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aem-selected-slot-v37{margin:9px 12px 0;padding:8px 9px;border-left:2px solid #111;background:#fafafa;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;align-items:center}.aem-selected-slot-v37>span{display:grid}.aem-selected-slot-v37 strong{font-size:9px;font-weight:600}.aem-selected-slot-v37 small{font-size:7px;color:#777}.aem-selected-slot-v37 button{border:0;background:transparent;cursor:pointer}.aem-browser-shell-v37{padding:0 12px 10px;border-bottom:1px solid #e5e5e5;background:#fff}.aem-browser-source-v37{padding:13px 0 10px;display:grid;gap:2px}.aem-browser-source-v37>span{font-size:7px;letter-spacing:.08em;color:#888;font-weight:600}.aem-browser-source-v37 strong{font-size:15px;font-weight:500;color:#111}.aem-browser-source-v37 small{font-size:8px;color:#8a8a8a}.aem-commerce-mode-v37{height:36px;display:flex;border-bottom:1px solid #ddd;margin-bottom:8px}.aem-commerce-mode-v37 button{height:36px;padding:0 13px;border:0;border-bottom:2px solid transparent;background:#fff;display:flex;align-items:center;gap:5px;color:#777;font-size:9px;cursor:pointer}.aem-commerce-mode-v37 button.active{border-bottom-color:#111;color:#111;font-weight:600}.aem-search-field-v37{height:38px;display:flex;align-items:center;gap:7px;border-bottom:1px solid #9b9b9b;color:#777;margin-bottom:8px}.aem-search-field-v37:focus-within{border-bottom-color:#111}.aem-search-field-v37 input{min-width:0;flex:1;border:0!important;outline:0!important;background:transparent!important;padding:0!important;font-size:10px!important;color:#111}.aem-search-field-v37>button{width:24px;height:24px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer}.aem-active-filters-v37{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 7px}.aem-active-filters-v37:empty{display:none}.aem-active-filters-v37 button{height:24px;padding:0 7px;border:1px solid #cfcfcf;background:#fff;display:flex;align-items:center;gap:5px;font-size:8px;color:#333;cursor:pointer}.aem-facets-v37{border-top:1px solid #eee}.aem-facets-title-v37{height:32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee}.aem-facets-title-v37 span{font-size:8px;letter-spacing:.08em;color:#777;font-weight:600}.aem-facets-title-v37 button{border:0;background:transparent;color:#666;font-size:8px;text-decoration:underline;cursor:pointer}.aem-facet-group-v37{border-bottom:1px solid #eee}.aem-facet-group-v37>summary{list-style:none;height:34px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:6px;cursor:pointer}.aem-facet-group-v37>summary::-webkit-details-marker{display:none}.aem-facet-group-v37>summary span{font-size:9px;font-weight:500;color:#222}.aem-facet-group-v37>summary b{min-width:16px;height:16px;border:1px solid #111;display:grid;place-items:center;font-size:7px;font-weight:500}.aem-facet-group-v37[open]>summary svg{transform:rotate(180deg)}.aem-facet-options-v37{padding:0 0 7px;max-height:170px;overflow:auto;display:grid}.aem-facet-options-v37 button{min-height:28px;padding:2px 4px;border:0;background:#fff;display:grid;grid-template-columns:14px minmax(0,1fr) auto;align-items:center;gap:6px;text-align:left;color:#555;font-size:8px;cursor:pointer}.aem-facet-options-v37 button:hover{background:#fafafa}.aem-facet-options-v37 button i{width:11px;height:11px;border:1px solid #bdbdbd;background:#fff}.aem-facet-options-v37 button.active{color:#111;font-weight:600}.aem-facet-options-v37 button.active i{background:#111;border-color:#111;box-shadow:inset 0 0 0 2px #fff}.aem-facet-options-v37 button em{font-style:normal;color:#999;font-size:7px}.aem-commerce-status-v37{padding:9px 0 2px}.aem-commerce-status-v37>span{display:block;margin-bottom:6px;font-size:7px;letter-spacing:.08em;color:#888}.aem-commerce-status-v37>div{display:flex;flex-wrap:wrap;gap:5px}.aem-commerce-status-v37 button{height:26px;padding:0 7px;border:1px solid #d2d2d2;background:#fff;display:flex;align-items:center;gap:5px;font-size:8px;color:#555;cursor:pointer}.aem-commerce-status-v37 button.active{border-color:#111;color:#111}.aem-commerce-status-v37 button i{width:5px;height:5px;border-radius:50%;background:#888}.aem-commerce-status-v37 button i.ok{background:#2e7d32}.aem-commerce-status-v37 button i.critical{background:#c0392b}.aem-commerce-status-v37 button em{font-style:normal;color:#999;font-size:7px}.aem-browser-resultbar-v37{min-height:32px;padding-top:8px;display:flex;align-items:center;justify-content:space-between;color:#888}.aem-browser-resultbar-v37 span{font-size:7px;letter-spacing:.07em}.aem-browser-resultbar-v37 strong{font-size:8px;font-weight:500;color:#333}
.aem-commerce-catalog-v37{border-top:1px solid #eee}.aem-catalog-path-v37{min-height:34px;display:flex;align-items:center;gap:4px;border-bottom:1px solid #eee;overflow-x:auto;white-space:nowrap}.aem-catalog-path-v37 button,.aem-catalog-path-v37 strong{border:0;background:transparent;padding:0;color:#666;font-size:8px;cursor:pointer}.aem-catalog-path-v37 strong{color:#111}.aem-catalog-columns-v37{display:grid;grid-template-columns:1fr;max-height:330px;overflow:auto}.aem-catalog-columns-v37 section{padding:8px 0;border-bottom:1px solid #eee}.aem-catalog-columns-v37 section>span{display:block;padding:0 7px 5px;font-size:7px;letter-spacing:.08em;color:#999}.aem-catalog-columns-v37 section>button{width:100%;min-height:31px;padding:3px 7px;border:0;background:#fff;display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:7px;text-align:left;font-size:8px;color:#444;cursor:pointer}.aem-catalog-columns-v37 section>button:hover{background:#f7f7f7}.aem-catalog-columns-v37 section>button.active{background:#f1f1f1;color:#111;font-weight:600}.aem-catalog-columns-v37 section>button em{font-style:normal;color:#999;font-size:7px}.aem-asset-upload-v37{margin-top:9px;min-height:40px;padding:7px 9px;border:1px dashed #bdbdbd;display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:center;cursor:pointer}.aem-asset-upload-v37>span{display:grid}.aem-asset-upload-v37 strong{font-size:9px;font-weight:500}.aem-asset-upload-v37 small{font-size:7px;color:#888}.aem-asset-upload-v37 input{display:none}

/* Keep cards visually subordinate to browser controls, as in AEM asset/product pickers. */
.simple-library-scroll{background:#fff!important}.simple-library-scroll .reference-library-grid{padding-top:14px!important}
@media(max-width:1024px){.edit-navigation-popover{width:min(390px,calc(100vw - 20px))!important}.aem-tree-row-v37{min-height:42px}.aem-facet-options-v37{max-height:140px}}
@media(max-width:520px){.edit-navigation-popover{left:8px!important;right:8px!important;width:auto!important}.aem-content-source-tabs-v37 button{padding:6px}.aem-content-source-tabs-v37 small{display:none}.aem-browser-shell-v37{padding-left:10px;padding-right:10px}.aem-tree-row-v37{grid-template-columns:18px 20px minmax(0,1fr) auto}.aem-tree-commerce-v37{display:none}.aem-tree-status-v37{font-size:0}.aem-tree-status-v37 i{width:6px;height:6px}}
`;
  writeFileSync(cssPath, css);
}

console.log('AEM Sites + Commerce browser v37 applied: Content Tree, CIF-like Product Picker and Assets facets');
