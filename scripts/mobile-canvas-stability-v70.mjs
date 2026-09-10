import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='MOBILE_CANVAS_STABILITY_V70';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const SECTION_AUTHORING_UNIFIED_V69 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V69 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // First-load state: one empty three-slot section and the left component panel already open.
  const initialStart=app.indexOf('const makeInitialSections = () => [');
  const initialEnd=initialStart>=0?app.indexOf('];',initialStart):-1;
  if(initialStart<0||initialEnd<0) throw new Error(MARKER+': makeInitialSections missing');
  const initial=`const makeInitialSections = () => [\n  initialSection('TYPE-3', { ru: 'Секция', en: 'Section', kk: 'Секция', ar: 'قسم' }, {}, 'manual'),\n];`;
  app=app.slice(0,initialStart)+initial+app.slice(initialEnd+2);
  app=app.replace("const [aemPanelOpenV40, setAemPanelOpenV40] = useState(false);","const [aemPanelOpenV40, setAemPanelOpenV40] = useState(true);");
  app=app.replace("const [aemPanelOpenV40, setAemPanelOpenV40] = useState(true);","const [aemPanelOpenV40, setAemPanelOpenV40] = useState(true);");
  app=app.replace("const [aemPanelTabV40, setAemPanelTabV40] = useState('tree');","const [aemPanelTabV40, setAemPanelTabV40] = useState('components');");

  // Mobile resolver: always produce a deterministic 4-column layout with two equal cards per row.
  // This deliberately normalizes legacy and imported AEM-like layouts instead of trusting malformed mobile presets.
  const layoutPart=functionChunk(app,'layoutContainersForDeviceV34');
  const layoutFn=String.raw`function layoutContainersForDeviceV34(type, viewport = 'desktop') {
  const desktop = Array.isArray(type?.containers) ? type.containers : [];
  if (viewport !== 'mobile') return desktop;
  let globalIndex = 0;
  return desktop.map((container) => {
    const source = Array.isArray(container?.slots) ? container.slots : [];
    const count = source.length;
    const slots = source.map((slot,index) => {
      const slotIndex = slot?.slotIndex != null ? Number(slot.slotIndex) : globalIndex++;
      if (count <= 1) return { ...slot, slotIndex, start: 1, span: 4, rowStart: 1, rows: 1, minHeight: undefined };
      if (count === 2) return { ...slot, slotIndex, start: index === 0 ? 1 : 3, span: 2, rowStart: 1, rows: 1, minHeight: undefined };
      if (count === 3) {
        if (index < 2) return { ...slot, slotIndex, start: index === 0 ? 1 : 3, span: 2, rowStart: 1, rows: 1, minHeight: undefined };
        return { ...slot, slotIndex, start: 1, span: 4, rowStart: 2, rows: 1, minHeight: undefined };
      }
      const rowStart = Math.floor(index / 2) + 1;
      return { ...slot, slotIndex, start: index % 2 === 0 ? 1 : 3, span: 2, rowStart, rows: 1, minHeight: undefined };
    });
    return {
      ...container,
      cols: 4,
      rows: Math.max(1, count === 3 ? 2 : Math.ceil(count / 2)),
      columnGap: 8,
      rowGap: 8,
      container: { ...(container?.container || {}), mode: 'full', width: '100%', maxWidth: null, align: 'center', marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 },
      slots,
    };
  });
}`;
  app=app.slice(0,layoutPart.start)+layoutFn+app.slice(layoutPart.end);

  // Page switching is transactional and clears stale section/group/editor state.
  const switchStart=app.indexOf('  const switchPage = (id) => {');
  const switchEnd=switchStart>=0?app.indexOf('\n  const ',switchStart+10):-1;
  if(switchStart<0||switchEnd<0) throw new Error(MARKER+': switchPage missing');
  const switchFn=String.raw`  const switchPage = (id) => {
    if (!id) return;
    const target=findNode(siteTrees[region] || [],id);
    if (!target || !target.page) {
      setToast('Страница недоступна');
      window.setTimeout(()=>setToast(''),1200);
      return;
    }
    setPageSections((prev) => {
      const regionPages={...(prev[region] || {})};
      const nextSections=Array.isArray(regionPages[id]) ? regionPages[id] : [];
      return {...prev,[region]:{...regionPages,[id]:nextSections}};
    });
    setPageIdByRegion((prev) => ({ ...prev, [region]: id }));
    setSelectedId(null);
    setSelectedSectionIdsV60([]);
    setSelectionAnchorV60(null);
    setGroupRulesOpenV60(false);
    setAutomationTargetIdV69(null);
    setHistory([]);
    setFuture([]);
    setShowMenu(false);
    if (rightTab === 'settings') setRightTab('content');
  };`;
  app=app.slice(0,switchStart)+switchFn+app.slice(switchEnd);

  // Clearing selection after deleting the final section must never leave an orphaned editor/modal behind.
  const clearOld='  const clearSectionSelectionV60 = () => { setSelectedSectionIdsV60([]); setSelectedId(null); setSelectionAnchorV60(null); setGroupRulesOpenV60(false); };';
  if(app.includes(clearOld)){
    app=app.replace(clearOld,'  const clearSectionSelectionV60 = () => { setSelectedSectionIdsV60([]); setSelectedId(null); setSelectionAnchorV60(null); setGroupRulesOpenV60(false); setAutomationTargetIdV69(null); if (rightTab === \'settings\') setRightTab(\'content\'); };');
  }
  const removeOld='  const removeSection = (id) => { mutateSections((prev) => prev.filter((s) => s.id !== id)); setSelectedId(null); };';
  if(app.includes(removeOld)){
    app=app.replace(removeOld,"  const removeSection = (id) => { mutateSections((prev) => prev.filter((s) => s.id !== id)); setSelectedId(null); setSelectedSectionIdsV60([]); setSelectionAnchorV60(null); setGroupRulesOpenV60(false); setAutomationTargetIdV69(null); if (rightTab === 'settings') setRightTab('content'); };");
  }

  // Avoid accidental stale selection fallback on an empty page.
  app=app.replace('const selected = resolved.find((s) => s.id === selectedId) || resolved[0] || null;','const selected = selectedId ? (resolved.find((s) => s.id === selectedId) || null) : null;');

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* mobile-canvas-stability-v70 */')){
  css+=String.raw`
/* mobile-canvas-stability-v70 */
/* Device emulator: Mobile is a real 375px authoring viewport, independent from editor window width. */
.canvas-shell{min-width:0!important;overflow:auto!important;overscroll-behavior:contain!important}
.storefront-frame.mobile{width:375px!important;min-width:375px!important;max-width:375px!important;margin-left:auto!important;margin-right:auto!important;box-sizing:border-box!important;overflow:visible!important}
.storefront-frame.mobile .site-store-header,.storefront-frame.mobile .page-context-strip,.storefront-frame.mobile .canvas-note,.storefront-frame.mobile .builder-section,.storefront-frame.mobile .empty-page-state,.storefront-frame.mobile .canvas-add-section{box-sizing:border-box!important;max-width:100%!important}
.storefront-frame.mobile .builder-section{width:100%!important;margin-left:0!important;margin-right:0!important;padding-left:0!important;padding-right:0!important}
.storefront-frame.mobile .section-containers,.storefront-frame.mobile .section-container,.storefront-frame.mobile .slot-grid{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
.storefront-frame.mobile .section-container{padding-left:0!important;padding-right:0!important;margin-left:0!important;margin-right:0!important}
.storefront-frame.mobile .slot-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-flow:row!important;align-items:stretch!important;justify-items:stretch!important;column-gap:8px!important;row-gap:8px!important}
.storefront-frame.mobile .v2-slot-wrap{min-width:0!important;width:auto!important;max-width:100%!important;height:100%!important;align-self:stretch!important;overflow:hidden!important;aspect-ratio:auto!important}
.storefront-frame.mobile .v2-slot-wrap>.lego-slot{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;overflow:hidden!important}
.storefront-frame.mobile .lego-slot .merch-card-media,.storefront-frame.mobile .lego-slot .entity-product,.storefront-frame.mobile .lego-slot .entity-media{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important}
.storefront-frame.mobile .lego-slot img,.storefront-frame.mobile .lego-slot video{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important}
.storefront-frame.mobile .page-context-strip{padding-left:10px!important;padding-right:10px!important;gap:5px!important;flex-wrap:wrap!important}
.storefront-frame.mobile .canvas-note{margin-left:10px!important;margin-right:10px!important;padding:9px 10px!important}
.storefront-frame.mobile .empty-page-state{min-height:360px!important;margin:12px!important}
.storefront-frame.mobile .canvas-add-section{margin-left:12px!important;margin-right:12px!important;width:calc(100% - 24px)!important}

/* Author controls stay usable inside the narrow emulator instead of overlapping the next section. */
.storefront-frame.mobile .section-author-toolbar-v57{left:0!important;right:auto!important;max-width:100%!important;width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;white-space:nowrap!important}
.storefront-frame.mobile .section-author-toolbar-v57::-webkit-scrollbar{display:none!important}
.storefront-frame.mobile .section-author-identity-v57{min-width:118px!important;max-width:138px!important;padding-left:8px!important;padding-right:8px!important}
.storefront-frame.mobile .section-author-action-v57{flex:0 0 auto!important;padding-left:9px!important;padding-right:9px!important}
.storefront-frame.mobile .content-metric-overlay-v47{right:5px!important;bottom:5px!important;gap:2px!important}
.storefront-frame.mobile .content-metric-overlay-v47>span{min-width:58px!important;height:18px!important;padding:0 4px!important;gap:4px!important}
.storefront-frame.mobile .content-metric-overlay-v47 em{font-size:5.5px!important}.storefront-frame.mobile .content-metric-overlay-v47 b{font-size:7px!important}

/* Prevent editor chrome and side panels from colliding at common desktop widths. */
.editor-header-v43,.builder-workspace,.aem-author-side-panel-v40,.aem-properties-panel-v40{min-width:0!important}
@media(max-width:1399px){
  .editor-header-v43{grid-template-columns:minmax(150px,1fr) auto minmax(250px,1fr)!important;padding-left:10px!important;padding-right:10px!important}
  .editor-header-actions-v43{min-width:0!important;gap:2px!important}.editor-preview-v43,.editor-analytics-v43{padding-left:7px!important;padding-right:7px!important}
}
@media(max-width:1199px){
  .editor-preview-v43 span,.editor-analytics-v43 span{display:none!important}.editor-header-actions-v43{overflow-x:auto!important;scrollbar-width:none!important}.editor-header-actions-v43::-webkit-scrollbar{display:none!important}
}
@media(max-width:767.98px){
  .storefront-frame.mobile{width:375px!important;min-width:375px!important;max-width:375px!important}
  .canvas-shell{overflow-x:auto!important;padding-left:8px!important;padding-right:8px!important}
}
`;
  writeFileSync(cssPath,css);
}

console.log('V70 applied: 375px mobile canvas, normalized mobile layouts, empty first-load section, safe page/empty-state transitions');
