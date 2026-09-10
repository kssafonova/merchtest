import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PAGE_SETTINGS_HEADER_V43';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_PANEL_TABS_V42 = true;';
  if (!app.includes(anchor)) throw new Error('PAGE_SETTINGS_HEADER_V43: V42 marker missing');
  const helpers = `
const ${MARKER} = true;
const PAGE_SETTINGS_DEFAULT_V43 = {
  background: '#ffffff',
  seoTitle: '',
  seoH1: '',
  seoDescription: '',
  canonical: '',
  seoIndex: true,
  seoFollow: true,
  seoSitemap: true,
  ogTitle: '',
  ogDescription: '',
};`;
  app = app.replace(anchor, anchor + helpers);

  const stateAnchor = "  const [aemPanelSearchV40, setAemPanelSearchV40] = useState('');";
  if (!app.includes(stateAnchor)) throw new Error('PAGE_SETTINGS_HEADER_V43: AEM state anchor missing');
  app = app.replace(stateAnchor, stateAnchor + "\n  const [pageSettingsV43, setPageSettingsV43] = useState({});");

  const pageIdAnchor = '  const pageId = pageIdByRegion[region];';
  if (!app.includes(pageIdAnchor)) throw new Error('PAGE_SETTINGS_HEADER_V43: page id anchor missing');
  app = app.replace(pageIdAnchor, pageIdAnchor + `
  const pageSettingsKeyV43 = region + ':' + pageId;
  const currentPageSettingsV43 = { ...PAGE_SETTINGS_DEFAULT_V43, ...(pageSettingsV43[pageSettingsKeyV43] || {}) };
  const pageBackgroundColorV43 = /^#[0-9a-fA-F]{6}$/.test(currentPageSettingsV43.background || '') ? currentPageSettingsV43.background : '#ffffff';
  const updatePageSettingsV43 = (patch) => setPageSettingsV43((previous) => ({ ...previous, [pageSettingsKeyV43]: { ...PAGE_SETTINGS_DEFAULT_V43, ...(previous[pageSettingsKeyV43] || {}), ...patch } }));`);

  // One clean editor header: Layers + languages / centered emulator / history, preview, analytics, publish.
  const headerStart = app.indexOf('<header className="app-topbar aem-global-header-v40">');
  const mainStart = headerStart >= 0 ? app.indexOf('<main className="builder-workspace">', headerStart) : -1;
  if (headerStart < 0 || mainStart < 0) throw new Error('PAGE_SETTINGS_HEADER_V43: header/workspace boundaries missing');
  const header = `<header className="editor-header-v43">
      <div className="editor-header-left-v43">
        <button className={'editor-layers-v43 ' + (aemPanelOpenV40 ? 'active' : '')} onClick={() => setAemPanelOpenV40((value) => !value)} title={aemPanelOpenV40 ? 'Скрыть боковую панель' : 'Открыть боковую панель'} aria-label="Слои"><Layers3 size={18}/></button>
        <div className="editor-language-v43">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div>
      </div>
      <div className="editor-emulator-v43" aria-label="Эмулятор устройств">
        <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={17}/></button>
        <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} title="Tablet"><LayoutGrid size={16}/></button>
        <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={17}/></button>
      </div>
      <div className="editor-header-actions-v43">
        <div className="editor-history-v43"><button disabled={!history.length} onClick={undo} title="Отменить"><Undo2 size={16}/></button><button disabled={!future.length} onClick={redo} title="Повторить"><Redo2 size={16}/></button></div>
        <button className={'editor-preview-v43 ' + (previewMode ? 'active' : '')} onClick={() => { const next = !previewMode; setPreviewMode(next); setAemAuthorModeV40(next ? 'preview' : 'edit'); }}><Eye size={16}/><span>{previewMode ? 'Редактирование' : 'Предпросмотр'}</span></button>
        <button className="editor-analytics-v43" onClick={() => setShowCoverage((value) => !value)}><BarChart3 size={16}/><span>Аналитика</span><em>{metrics.coverage}%</em></button>
        <button className="editor-publish-v43" onClick={() => { setToast('Опубликовано: ' + region + ' · ' + LANGUAGE_LABELS[locale] + ' · ' + currentPageName); setTimeout(() => setToast(''), 2000); }}>Опубликовать</button>
      </div>
    </header>

    `;
  app = app.slice(0, headerStart) + header + app.slice(mainStart);

  // Apply the authored page background to the real content frame.
  const frameAnchor = '<div className={`storefront-frame ${device}`}>`';
  // Handle the actual JSX anchor without relying on a trailing template marker in source code.
  if (app.includes('<div className={`storefront-frame ${device}`}>')) {
    app = app.replace('<div className={`storefront-frame ${device}`}>', '<div className={`storefront-frame ${device}`} style={{ backgroundColor: currentPageSettingsV43.background || \'#ffffff\', \'--page-background-v43\': currentPageSettingsV43.background || \'#ffffff\' }}>');
  } else {
    throw new Error('PAGE_SETTINGS_HEADER_V43: storefront frame anchor missing');
  }

  // Replace the V42 page-settings body with appearance + SEO authoring controls.
  const settingsStart = app.indexOf("{aemPanelTabV40 === 'settings' && <div className=\"aem-page-settings-v42\">");
  const settingsEnd = settingsStart >= 0 ? app.indexOf('\n          </div>\n        </div>\n      </aside>', settingsStart) : -1;
  if (settingsStart < 0 || settingsEnd < 0) throw new Error('PAGE_SETTINGS_HEADER_V43: settings body boundaries missing');
  const settingsBody = `{aemPanelTabV40 === 'settings' && <div className="aem-page-settings-v42 aem-page-settings-v43">
              <section><span className="aem-settings-kicker-v42">СТРАНИЦА</span><h3>{currentPageName}</h3><code>/content/storefront/{region.toLowerCase()}/{pageId}</code></section>

              <section className="page-appearance-v43">
                <label>ОФОРМЛЕНИЕ СТРАНИЦЫ</label>
                <div className="page-color-control-v43">
                  <input className="page-color-picker-v43" type="color" value={pageBackgroundColorV43} onChange={(event) => updatePageSettingsV43({ background: event.target.value })}/>
                  <div><strong>Фон страницы</strong><small>Цвет применяется к canvas и опубликованной странице.</small></div>
                  <input className="page-color-hex-v43" value={currentPageSettingsV43.background} onChange={(event) => updatePageSettingsV43({ background: event.target.value })} placeholder="#FFFFFF" spellCheck="false"/>
                </div>
                <div className="page-color-presets-v43">{['#FFFFFF','#FAFAFA','#F7F5F2','#F2F2F2','#111111'].map((color) => <button key={color} className={pageBackgroundColorV43.toUpperCase() === color ? 'active' : ''} style={{ background: color }} onClick={() => updatePageSettingsV43({ background: color })} title={color}><span>{color}</span></button>)}</div>
                <button className="page-reset-background-v43" onClick={() => updatePageSettingsV43({ background: '#ffffff' })}>Сбросить фон</button>
              </section>

              <section className="page-seo-v43">
                <div className="page-settings-section-head-v43"><div><label>SEO</label><strong>Поисковая оптимизация</strong></div><span>{currentPageSettingsV43.seoIndex ? 'INDEX' : 'NOINDEX'}</span></div>
                <div className="page-field-v43"><label>TITLE</label><input value={currentPageSettingsV43.seoTitle} maxLength={60} onChange={(event) => updatePageSettingsV43({ seoTitle: event.target.value })} placeholder={currentPageName + ' — интернет-магазин'}/><small>{currentPageSettingsV43.seoTitle.length}/60</small></div>
                <div className="page-field-v43"><label>H1</label><input value={currentPageSettingsV43.seoH1} maxLength={90} onChange={(event) => updatePageSettingsV43({ seoH1: event.target.value })} placeholder={currentPageName}/><small>{currentPageSettingsV43.seoH1.length}/90</small></div>
                <div className="page-field-v43 textarea"><label>META DESCRIPTION</label><textarea value={currentPageSettingsV43.seoDescription} maxLength={160} rows={3} onChange={(event) => updatePageSettingsV43({ seoDescription: event.target.value })} placeholder="Краткое описание страницы для поисковой выдачи"/><small>{currentPageSettingsV43.seoDescription.length}/160</small></div>
                <div className="page-field-v43"><label>CANONICAL URL</label><input type="url" value={currentPageSettingsV43.canonical} onChange={(event) => updatePageSettingsV43({ canonical: event.target.value })} placeholder="https://example.com/catalog/..."/></div>
                <div className="page-seo-switches-v43">
                  <label><input type="checkbox" checked={currentPageSettingsV43.seoIndex} onChange={(event) => updatePageSettingsV43({ seoIndex: event.target.checked })}/><span><strong>Индексировать</strong><small>index / noindex</small></span></label>
                  <label><input type="checkbox" checked={currentPageSettingsV43.seoFollow} onChange={(event) => updatePageSettingsV43({ seoFollow: event.target.checked })}/><span><strong>Разрешить переходы</strong><small>follow / nofollow</small></span></label>
                  <label><input type="checkbox" checked={currentPageSettingsV43.seoSitemap} onChange={(event) => updatePageSettingsV43({ seoSitemap: event.target.checked })}/><span><strong>Добавлять в sitemap.xml</strong><small>Страница участвует в sitemap</small></span></label>
                </div>
              </section>

              <section className="page-seo-v43 page-og-v43">
                <div className="page-settings-section-head-v43"><div><label>SOCIAL</label><strong>Open Graph</strong></div></div>
                <div className="page-field-v43"><label>OG:TITLE</label><input value={currentPageSettingsV43.ogTitle} maxLength={70} onChange={(event) => updatePageSettingsV43({ ogTitle: event.target.value })} placeholder={currentPageSettingsV43.seoTitle || currentPageName}/></div>
                <div className="page-field-v43 textarea"><label>OG:DESCRIPTION</label><textarea value={currentPageSettingsV43.ogDescription} maxLength={160} rows={3} onChange={(event) => updatePageSettingsV43({ ogDescription: event.target.value })} placeholder={currentPageSettingsV43.seoDescription || 'Описание для социальных сетей'}/></div>
              </section>

              <section className="aem-page-summary-v42"><label>СВОДКА</label><div><span>Секций<strong>{resolved.length}</strong></span><span>Слотов<strong>{metrics.filled}/{metrics.total}</strong></span><span>Покрытие<strong>{metrics.coverage}%</strong></span><span>OOS<strong>{metrics.oos}</strong></span></div></section>
              <button className="aem-page-info-action-v42" onClick={() => setShowCoverage(true)}><BarChart3 size={14}/><span><strong>Аналитика страницы</strong><small>Покрытие, заполнение и OOS</small></span><ChevronRight size={13}/></button>
            </div>}`;
  app = app.slice(0, settingsStart) + settingsBody + app.slice(settingsEnd);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* page-settings-header-v43 */')) {
  css += String.raw`
/* page-settings-header-v43 */
/* Single clean authoring header. */
.editor-header-v43{position:sticky;top:0;z-index:240;height:56px;min-height:56px;padding:0 16px;background:#fff;border-bottom:1px solid #dedede;display:grid;grid-template-columns:minmax(220px,1fr) auto minmax(420px,1fr);align-items:center;color:#111}
.editor-header-left-v43,.editor-header-actions-v43,.editor-history-v43,.editor-language-v43,.editor-emulator-v43{display:flex;align-items:center}.editor-header-left-v43{gap:14px}.editor-header-actions-v43{justify-content:flex-end;gap:6px}.editor-history-v43{gap:2px;padding-right:7px;margin-right:2px;border-right:1px solid #e3e3e3}.editor-language-v43{gap:0}.editor-language-v43 button{height:30px;min-width:32px;padding:0 8px;border:0;border-bottom:1px solid transparent;background:#fff;color:#888;font-size:8px;font-weight:500;letter-spacing:.04em;cursor:pointer}.editor-language-v43 button.active{color:#111;border-bottom-color:#111}.editor-language-v43 button:hover{color:#111}
.editor-layers-v43,.editor-history-v43 button,.editor-emulator-v43 button{width:34px;height:34px;border:0;background:#fff;color:#777;display:grid;place-items:center;cursor:pointer}.editor-layers-v43:hover,.editor-history-v43 button:hover:not(:disabled),.editor-emulator-v43 button:hover{background:#f5f5f5;color:#111}.editor-layers-v43.active{background:#f0f0f0;color:#111}.editor-history-v43 button:disabled{opacity:.25;cursor:not-allowed}
.editor-emulator-v43{height:38px;padding:2px;border:1px solid #dedede;background:#fff;gap:1px}.editor-emulator-v43 button.active{background:#111;color:#fff}.editor-emulator-v43{justify-self:center}
.editor-preview-v43,.editor-analytics-v43{height:34px;padding:0 10px;border:0;background:#fff;color:#555;display:flex;align-items:center;gap:6px;font-size:8px;font-weight:500;cursor:pointer}.editor-preview-v43:hover,.editor-analytics-v43:hover,.editor-preview-v43.active{background:#f5f5f5;color:#111}.editor-analytics-v43 em{font-style:normal;color:#777;font-size:7px;border-left:1px solid #ddd;padding-left:6px}.editor-publish-v43{height:34px;padding:0 15px;border:1px solid #111;background:#111;color:#fff;font-size:8px;font-weight:600;letter-spacing:.03em;cursor:pointer}.editor-publish-v43:hover{background:#292929}
/* Old two-row AEM chrome has been replaced by V43. */
.aem-global-header-v40,.aem-page-toolbar-v40{display:none!important}

/* Page settings */
.aem-page-settings-v43{padding-bottom:28px!important}.aem-page-settings-v43>section{padding:18px 0!important}.page-appearance-v43>label,.page-seo-v43 .page-settings-section-head-v43 label{display:block;margin:0!important;font-size:7px!important;letter-spacing:.1em!important;color:#777!important;font-weight:600!important}.page-color-control-v43{margin-top:11px;display:grid;grid-template-columns:42px minmax(0,1fr) 78px;gap:10px;align-items:center}.page-color-picker-v43{width:42px!important;height:42px!important;border:1px solid #d5d5d5!important;padding:3px!important;background:#fff!important;cursor:pointer}.page-color-control-v43>div{display:grid;gap:2px}.page-color-control-v43 strong{font-size:9px;font-weight:500;color:#111}.page-color-control-v43 small{font-size:7px;line-height:1.35;color:#8d8d8d}.page-color-hex-v43{height:34px!important;border:0!important;border-bottom:1px solid #bbb!important;border-radius:0!important;padding:0!important;text-transform:uppercase;font-size:8px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;outline:0!important}.page-color-hex-v43:focus{border-bottom-color:#111!important}.page-color-presets-v43{margin-top:12px;display:flex;gap:7px;align-items:center}.page-color-presets-v43 button{position:relative;width:30px;height:30px;border:1px solid #d3d3d3;padding:0;cursor:pointer}.page-color-presets-v43 button.active{outline:1px solid #111;outline-offset:2px}.page-color-presets-v43 button span{display:none}.page-reset-background-v43{margin-top:12px;padding:0;height:26px;border:0;border-bottom:1px solid #aaa;background:#fff;color:#666;font-size:8px;cursor:pointer}.page-reset-background-v43:hover{color:#111;border-bottom-color:#111}
.page-settings-section-head-v43{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.page-settings-section-head-v43>div{display:grid;gap:3px}.page-settings-section-head-v43 strong{font-size:13px;font-weight:500;color:#111}.page-settings-section-head-v43>span{font-size:7px;letter-spacing:.08em;color:#777;border:1px solid #d5d5d5;padding:4px 6px}.page-field-v43{position:relative;display:grid;gap:4px;margin-bottom:13px}.page-field-v43>label{margin:0!important;font-size:7px!important;letter-spacing:.08em!important;color:#777!important}.page-field-v43 input,.page-field-v43 textarea{width:100%!important;box-sizing:border-box!important;border:0!important;border-bottom:1px solid #c8c8c8!important;border-radius:0!important;background:#fff!important;color:#111!important;padding:8px 30px 7px 0!important;font-size:9px!important;outline:0!important;resize:vertical}.page-field-v43 textarea{line-height:1.45;min-height:62px}.page-field-v43 input:focus,.page-field-v43 textarea:focus{border-bottom-color:#111!important}.page-field-v43>small{position:absolute;right:0;bottom:8px;font-size:7px;color:#aaa}.page-field-v43.textarea>small{bottom:8px}.page-seo-switches-v43{display:grid;border-top:1px solid #eee}.page-seo-switches-v43>label{min-height:48px;margin:0!important;border-bottom:1px solid #eee;display:grid;grid-template-columns:18px minmax(0,1fr);align-items:center;gap:9px;cursor:pointer}.page-seo-switches-v43 input{width:14px;height:14px;accent-color:#111}.page-seo-switches-v43 label>span{display:grid;gap:1px}.page-seo-switches-v43 strong{font-size:9px;font-weight:500;color:#222}.page-seo-switches-v43 small{font-size:7px;color:#8e8e8e}.page-og-v43{border-top:0!important}
/* The selected background is the page surface; sections inherit it instead of forcing white. */
.storefront-frame{background:var(--page-background-v43,#fff)}.storefront-frame .builder-section,.storefront-frame .section-container{background-color:transparent!important}

@media(max-width:1240px){.editor-header-v43{grid-template-columns:minmax(170px,1fr) auto minmax(360px,1fr);padding:0 10px}.editor-preview-v43 span,.editor-analytics-v43>span{display:none}.editor-preview-v43,.editor-analytics-v43{width:34px;padding:0;justify-content:center}.editor-analytics-v43 em{display:none}.editor-publish-v43{padding:0 11px}}
@media(max-width:900px){.editor-header-v43{grid-template-columns:1fr auto 1fr;height:54px;min-height:54px}.editor-language-v43 button{min-width:27px;padding:0 5px}.editor-history-v43{display:none}.editor-publish-v43{font-size:0;width:34px;padding:0}.editor-publish-v43:after{content:'↑';font-size:15px}.editor-header-actions-v43{gap:2px}}
@media(max-width:560px){.editor-header-v43{padding:0 6px;grid-template-columns:minmax(74px,1fr) auto minmax(74px,1fr)}.editor-language-v43 button:not(.active){display:none}.editor-header-left-v43{gap:5px}.editor-emulator-v43{height:34px}.editor-emulator-v43 button{width:30px;height:30px}.editor-header-actions-v43 .editor-preview-v43{display:none}.editor-publish-v43{display:none}.page-color-control-v43{grid-template-columns:38px minmax(0,1fr)}.page-color-hex-v43{grid-column:1/-1;width:100%!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Page settings + simplified editor header v43 applied');