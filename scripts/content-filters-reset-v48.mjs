import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'CONTENT_FILTERS_RESET_V48';

if (!app.includes(MARKER)) {
  const anchor = 'const CONTENT_CARD_OVERLAYS_V47 = true;';
  if (!app.includes(anchor)) throw new Error('CONTENT_FILTERS_RESET_V48: V47 marker missing');
  app = app.replace(anchor, `${anchor}\nconst ${MARKER} = true;`);

  // Product browser: remove Search / Catalog mode switch completely.
  app = app.replace(
    /\s*<div className="aem-commerce-mode-v37">[\s\S]*?<\/div>\s*\{commerceBrowseMode === 'search' \? <>/,
    '\n          <>'
  );
  app = app.replace(
    /<\/>\s*:\s*<AemCommerceCatalogBrowserV37[\s\S]*?\/>\}\s*<div className="aem-browser-resultbar-v37"><span>\{commerceBrowseMode === 'search' \? 'FULL-TEXT \+ FACETS' : 'CATALOG BROWSE'\}<\/span>/,
    '</>\n          <div className="aem-browser-resultbar-v37"><span>ФИЛЬТРЫ</span>'
  );

  // Product reset: keep one clear, explicit action and use the same wording as the other tabs.
  app = app.replace('>Очистить всё</button>', '>Сбросить</button>');

  // Looks: reset only look-related controls.
  const lookFacets = '<div className="aem-facets-v37 compact"><AemFacetGroupV37 title="Отдел" value={lookDepartment} options={lookDepartmentOptions} onChange={setLookDepartment} open/><AemFacetGroupV37 title="Коллекция" value={lookCollection} options={lookCollectionOptions} onChange={setLookCollection}/></div>';
  if (app.includes(lookFacets)) {
    app = app.replace(
      lookFacets,
      `${lookFacets}<div className="content-filter-reset-row-v48"><button className="content-reset-v48" onClick={() => { setQuery(''); setLookDepartment('Все'); setLookCollection('Все'); }}>Сбросить</button></div>`
    );
  } else {
    throw new Error('CONTENT_FILTERS_RESET_V48: look facets anchor missing');
  }

  // Media: reset only DAM/media filters. Uploaded files remain in the session.
  const mediaFacets = '<div className="aem-facets-v37 compact">\n            <AemFacetGroupV37 title="Тип ресурса" value={mediaKind} options={[\'image\',\'video\',\'svg\']} onChange={setMediaKind} open/>\n            <AemFacetGroupV37 title="Ориентация" value={mediaOrientation} options={[\'portrait\',\'landscape\']} onChange={setMediaOrientation}/>\n            <AemFacetGroupV37 title="Источник" value={assetSource} options={[\'Каталог\',\'Загруженные\']} onChange={setAssetSource}/>\n          </div>';
  if (app.includes(mediaFacets)) {
    app = app.replace(
      mediaFacets,
      `${mediaFacets}<div className="content-filter-reset-row-v48"><button className="content-reset-v48" onClick={() => { setQuery(''); setMediaKind('Все'); setMediaOrientation('Все'); setAssetSource('Все'); }}>Сбросить</button></div>`
    );
  } else {
    throw new Error('CONTENT_FILTERS_RESET_V48: media facets anchor missing');
  }

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* content-filters-reset-v48 */')) {
  css += String.raw`
/* content-filters-reset-v48 */
/* One filter flow only: no Search/Catalog mode switch. */
.content-browser-mode-v44 .aem-commerce-mode-v37{display:none!important}

/* Reset is a quiet, consistent secondary action in every content tab. */
.content-filter-reset-row-v48{display:flex;justify-content:flex-end;align-items:center;padding:6px 0 1px;border-top:1px solid #eeeeee;margin-top:5px}
.content-reset-v48,
.content-browser-mode-v44 .aem-facets-title-v37 button{height:25px!important;padding:0 8px!important;border:1px solid #d8d8d8!important;background:#fff!important;color:#333!important;font-size:7px!important;font-weight:500!important;line-height:1!important;text-decoration:none!important;cursor:pointer!important}
.content-reset-v48:hover,
.content-browser-mode-v44 .aem-facets-title-v37 button:hover{border-color:#111!important;color:#111!important;background:#fafafa!important}

/* Product filters start immediately after search; reclaimed vertical space goes to cards. */
.content-browser-mode-v44 .aem-search-field-v37 + .aem-active-filters-v37{margin-top:0!important}
.content-browser-mode-v44 .aem-browser-shell-v37{padding-top:0!important}

@media(max-width:520px){
  .content-filter-reset-row-v48{padding-top:5px}
  .content-reset-v48,.content-browser-mode-v44 .aem-facets-title-v37 button{height:28px!important;font-size:7.5px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('Content filters reset v48 applied: Search/Catalog switch removed and reset actions added to Products, Looks and Media');
