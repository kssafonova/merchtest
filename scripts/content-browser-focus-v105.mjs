import {readFileSync,writeFileSync} from 'node:fs';
const appFile='src/AppV3.jsx',cssFile='src/appv3.css',MARK='CONTENT_BROWSER_FOCUS_V105';
let app=readFileSync(appFile,'utf8');
if(!app.includes(MARK)){
  const anchor='const AUTOFILL_USER_FLOW_V96 = true;';
  if(!app.includes(anchor))throw Error(MARK+': V96 unavailable');
  app=app.replace(anchor,anchor+'\nconst '+MARK+' = true;');
  function divEnd(start){
    const tag=/<\/?div\b[^>]*>/g;tag.lastIndex=start;let depth=0,m;
    while((m=tag.exec(app))){
      depth+=m[0].startsWith('</')?-1:1;
      if(depth===0)return tag.lastIndex;
    }
    throw Error(MARK+': unmatched div');
  }
  function compact(tab,openText,label){
    const region=app.indexOf("{contentTab === '"+tab+"' && <>");
    if(region<0)throw Error(MARK+': browser tab '+tab+' missing');
    const start=app.indexOf(openText,region);
    if(start<0)throw Error(MARK+': filters '+tab+' missing');
    let end=divEnd(start);
    const remainder=app.slice(end);
    const extra=remainder.match(/^(\s*)<div className="content-filter-reset-row-v48">/);
    if(extra)end=divEnd(end+extra[1].length);
    const summary='<summary className="content-filter-summary-v105"><span><LayoutGrid size={14}/>Фильтры</span><b>'+label+'</b><ChevronDown size={15}/></summary>';
    app=app.slice(0,start)+'<details className="content-filter-drawer-v105 '+tab+'">'+summary+app.slice(start,end)+'</details>'+app.slice(end);
  }
  const count="[(productDepartment!=='Все'),(productCategory!=='Все'),(productSubcategory!=='Все'),(productCollection!=='Все'),(productColor!=='Все'),(productAvailability!=='Все'),(productNewness!=='Все'),(productDiscount!=='Все')].filter(Boolean).length";
  compact('product','<div className="aem-facets-v37">',"{"+count+" ? "+count+"+' активных' : 'Все товары'}");
  compact('look','<div className="aem-facets-v37 compact">',"{[lookDepartment!=='Все',lookCollection!=='Все'].filter(Boolean).length ? 'Активны' : 'Все образы'}");
  compact('media','<div className="aem-facets-v37 compact">',"{[mediaKind!=='Все',mediaOrientation!=='Все',assetSource!=='Все'].filter(Boolean).length ? 'Активны' : 'Все медиа'}");
  writeFileSync(appFile,app);
}
let css=readFileSync(cssFile,'utf8');
if(!css.includes('/* content-browser-focus-v105 */')){css+="\n/* content-browser-focus-v105 */\n.lego-app .content-browser-mode-v44 .aem-browser-source-v37{display:none!important}\n.lego-app .content-browser-mode-v44 .aem-browser-resultbar-v37{padding:9px 0 5px!important;margin:0!important;min-height:24px!important;border:0!important}\n.lego-app .content-browser-mode-v44 .aem-browser-resultbar-v37>span{display:none!important}\n.lego-app .content-browser-mode-v44 .aem-browser-resultbar-v37>strong{font-size:11px!important}\n.lego-app .content-browser-mode-v44 .aem-search-field-v37{min-height:40px!important;margin-bottom:8px!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105{border:1px solid #dbe2eb!important;border-radius:9px!important;margin:7px 0!important;padding:0!important;background:#fff!important;display:block!important;overflow:visible!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>summary{display:flex!important;align-items:center!important;gap:10px!important;min-height:39px!important;padding:8px 12px!important;cursor:pointer!important;list-style:none!important;user-select:none!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>summary::-webkit-details-marker{display:none}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>summary>span{display:flex!important;align-items:center!important;gap:7px!important;font-size:11px!important;font-weight:650!important;color:#344358!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>summary>b{margin-left:auto!important;font-size:10px!important;font-weight:550!important;color:#687990!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>summary>svg:last-child{color:#7b8a9c!important;transition:transform .16s}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105[open]>summary{border-bottom:1px solid #e7ecf3!important;background:#f7f9fd!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105[open]>summary>svg:last-child{transform:rotate(180deg)}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>.aem-facets-v37{padding:10px 12px 12px!important;margin:0!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;width:auto!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105>.content-filter-reset-row-v48{padding:0 12px 12px!important;margin:0!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105 .aem-commerce-status-v37{grid-column:1/-1!important;margin-top:6px!important;padding:6px 0 0!important}\n.lego-app .content-browser-mode-v44 .content-filter-drawer-v105 .facet-menu-v46>summary{height:35px!important}\n.lego-app .content-browser-mode-v44 .aem-active-filters-v37{margin:0 0 5px!important}\n.lego-app .content-browser-mode-v44 .aem-selected-slot-v37,.lego-app .simple-slot-hint{font-size:10px!important}\n.lego-app .content-browser-mode-v44 .simple-library-scroll,.lego-app .content-browser-mode-v44 .content-library-scroll{padding-top:10px!important}\n.lego-app .content-browser-mode-v44 .aem-asset-upload-v37{margin:8px 0!important}\n@media(min-width:1025px){\n  body .lego-app .right-side-shell-v45 .aem-properties-panel-v40{overflow-y:auto!important}\n  body .lego-app .content-browser-mode-v44 .aem-browser-shell-v37{overflow:visible!important;height:auto!important}\n}\n@media(max-width:540px){\n  .lego-app .content-browser-mode-v44 .content-filter-drawer-v105>.aem-facets-v37{grid-template-columns:1fr!important}\n}\n";writeFileSync(cssFile,css);}
console.log('V105 applied: one-click filters and content-first right panel');
