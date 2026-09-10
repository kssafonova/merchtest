import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PAGE_SETTINGS_TOOLBAR_V43';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_PANEL_TABS_V42 = true;';
  if (!app.includes(anchor)) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: V42 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // Per-page visual settings + language-specific SEO.
  const panelState = "const [aemPanelSearchV40, setAemPanelSearchV40] = useState('');";
  if (!app.includes(panelState)) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: panel state anchor missing');
  app = app.replace(panelState, panelState + "\n  const [pageAuthoringV43, setPageAuthoringV43] = useState({});");

  const pageNameAnchor = '  const currentPageName = nameFor(currentPage, locale);';
  if (!app.includes(pageNameAnchor)) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: current page anchor missing');
  const pageSettingsSource = String.raw`
  const pageSettingsKeyV43 = region + ':' + pageId;
  const pageSettingsEntryV43 = pageAuthoringV43[pageSettingsKeyV43] || {};
  const pageBackgroundV43 = pageSettingsEntryV43.backgroundColor || '#FFFFFF';
  const pageSeoV43 = {
    title: currentPageName,
    h1: currentPageName,
    description: '',
    canonical: '',
    indexable: true,
    follow: true,
    ...(pageSettingsEntryV43.seo?.[locale] || {}),
  };
  const updatePageVisualV43 = (patch) => setPageAuthoringV43((previous) => ({
    ...previous,
    [pageSettingsKeyV43]: { ...(previous[pageSettingsKeyV43] || {}), ...patch },
  }));
  const updatePageSeoV43 = (patch) => setPageAuthoringV43((previous) => {
    const entry = previous[pageSettingsKeyV43] || {};
    return {
      ...previous,
      [pageSettingsKeyV43]: {
        ...entry,
        seo: { ...(entry.seo || {}), [locale]: { ...(entry.seo?.[locale] || {}), ...patch } },
      },
    };
  });`;
  app = app.replace(pageNameAnchor, pageNameAnchor + pageSettingsSource);

  // Apply the page background to the editable storefront frame.
  const frameAnchor = '<div className={`storefront-frame ${device}`}>';
  if (!app.includes(frameAnchor)) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: storefront frame anchor missing');
  app = app.replace(frameAnchor, '<div className={`storefront-frame ${device}`} style={{ backgroundColor: pageBackgroundV43, \'--page-background-v43\': pageBackgroundV43 }}>');

  // Replace the entire editor toolbar with one compact authoring header.
  const toolbarStart = app.indexOf('<div className="builder-toolbar aem-page-toolbar-v40">');
  const workspaceAnchor = '\n\n    <main className="builder-workspace">';
  const toolbarEnd = toolbarStart >= 0 ? app.indexOf(workspaceAnchor, toolbarStart) : -1;
  if (toolbarStart < 0 || toolbarEnd < 0) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: toolbar boundaries missing');
  const toolbar = `<div className="builder-toolbar aem-page-toolbar-v40 clean-author-toolbar-v43">
      <div className="author-toolbar-left-v43">
        <button className={'aem-left-panel-toggle-v41 icon-only-v43 ' + (aemPanelOpenV40 ? 'active' : '')} onClick={() => setAemPanelOpenV40((value) => !value)} title={aemPanelOpenV40 ? 'Скрыть боковую панель' : 'Открыть боковую панель'}><Layers3 size={18}/></button>
        <div className="language-switch author-languages-v43">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div>
      </div>
      <div className="device-group aem-device-group-v36 author-emulator-v43" aria-label="Эмулятор устройств">
        <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop"><Monitor size={18}/></button>
        <button className={device === 'tablet' ? 'active' : ''} onClick={() => setDevice('tablet')} title="Tablet"><LayoutGrid size={17}/></button>
        <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile"><Smartphone size={18}/></button>
      </div>
      <div className="author-toolbar-actions-v43">
        <button className="icon-action" disabled={!history.length} onClick={undo} title="Отменить"><Undo2 size={16}/></button>
        <button className="icon-action" disabled={!future.length} onClick={redo} title="Повторить"><Redo2 size={16}/></button>
        <span className="author-toolbar-divider-v43"/>
        <button className={previewMode ? 'active' : ''} onClick={() => { const next = !previewMode; setPreviewMode(next); setAemAuthorModeV40('edit'); }}><Eye size={16}/>{previewMode ? 'Вернуться' : 'Предпросмотр'}</button>
        <button className={showCoverage ? 'active' : ''} onClick={() => setShowCoverage((value) => !value)}><BarChart3 size={16}/>Покрытие</button>
        <button className="primary publish-v43" onClick={() => { setToast('Опубликовано: ' + LANGUAGE_LABELS[locale] + ' · ' + currentPageName); setTimeout(() => setToast(''), 2000); }}>Опубликовать</button>
      </div>
    </div>`;
  app = app.slice(0, toolbarStart) + toolbar + app.slice(toolbarEnd);

  // Replace Settings tab with visual page settings + language-specific SEO.
  const settingsStart = app.indexOf("{aemPanelTabV40 === 'settings' && <div className=\"aem-page-settings-v42\">");
  const settingsEndAnchor = '\n          </div>\n        </div>\n      </aside>';
  const settingsEnd = settingsStart >= 0 ? app.indexOf(settingsEndAnchor, settingsStart) : -1;
  if (settingsStart < 0 || settingsEnd < 0) throw new Error('PAGE_SETTINGS_TOOLBAR_V43: settings boundaries missing');
  const settingsBody = `{aemPanelTabV40 === 'settings' && <div className="aem-page-settings-v42 aem-page-settings-v43">
              <section><span className="aem-settings-kicker-v42">КОНТЕКСТ СТРАНИЦЫ</span><h3>{currentPageName}</h3><code>/content/storefront/{region.toLowerCase()}/{pageId}</code></section>

              <section className="page-background-settings-v43">
                <label>ФОН СТРАНИЦЫ</label>
                <div className="page-color-control-v43">
                  <input className="page-color-picker-v43" type="color" value={pageBackgroundV43} onChange={(event) => updatePageVisualV43({ backgroundColor: event.target.value.toUpperCase() })}/>
                  <div><span>Цвет фона</span><input className="page-color-hex-v43" value={pageBackgroundV43} onChange={(event) => { const value = event.target.value.toUpperCase(); if (/^#[0-9A-F]{6}$/.test(value)) updatePageVisualV43({ backgroundColor: value }); }} maxLength={7}/></div>
                  <button onClick={() => updatePageVisualV43({ backgroundColor: '#FFFFFF' })}>Сбросить</button>
                </div>
                <div className="page-color-presets-v43">{['#FFFFFF','#FAFAFA','#F7F5F2','#EFEDE8','#111111'].map((color) => <button key={color} className={pageBackgroundV43 === color ? 'active' : ''} style={{ backgroundColor: color }} onClick={() => updatePageVisualV43({ backgroundColor: color })} title={color}/>)}</div>
                <small>Цвет применяется к текущей странице независимо от выбранного устройства.</small>
              </section>

              <section><label>РЕГИОН</label><div className="aem-settings-segment-v42">{Object.keys(REGION_CONFIG).map((item) => <button key={item} className={region === item ? 'active' : ''} onClick={() => switchRegion(item)}>{item}</button>)}</div><small>Регион убран из шапки и управляется здесь.</small></section>
              <section><label>ЯЗЫК</label><div className="aem-settings-segment-v42">{languages.map((lang) => <button key={lang} className={locale === lang ? 'active' : ''} onClick={() => setLocale(lang)}>{LANGUAGE_LABELS[lang]}</button>)}</div></section>

              <section className="page-seo-settings-v43">
                <div className="seo-section-head-v43"><div><label>SEO СТРАНИЦЫ</label><strong>{LANGUAGE_LABELS[locale]}</strong></div><span>SEO хранится отдельно для языковой версии</span></div>
                <label className="seo-field-v43"><span>TITLE</span><input value={pageSeoV43.title} onChange={(event) => updatePageSeoV43({ title: event.target.value })} placeholder={currentPageName}/><em>{pageSeoV43.title.length}/60</em></label>
                <label className="seo-field-v43"><span>H1</span><input value={pageSeoV43.h1} onChange={(event) => updatePageSeoV43({ h1: event.target.value })} placeholder={currentPageName}/></label>
                <label className="seo-field-v43 textarea"><span>META DESCRIPTION</span><textarea value={pageSeoV43.description} onChange={(event) => updatePageSeoV43({ description: event.target.value })} placeholder="Краткое описание страницы для поисковой выдачи" rows={3}/><em>{pageSeoV43.description.length}/160</em></label>
                <label className="seo-field-v43"><span>CANONICAL URL</span><input value={pageSeoV43.canonical} onChange={(event) => updatePageSeoV43({ canonical: event.target.value })} placeholder="https://example.com/catalog/..."/></label>
                <div className="seo-robots-v43"><span>ROBOTS</span><div><button className={pageSeoV43.indexable ? 'active' : ''} onClick={() => updatePageSeoV43({ indexable: true })}>INDEX</button><button className={!pageSeoV43.indexable ? 'active' : ''} onClick={() => updatePageSeoV43({ indexable: false })}>NOINDEX</button><button className={pageSeoV43.follow ? 'active' : ''} onClick={() => updatePageSeoV43({ follow: true })}>FOLLOW</button><button className={!pageSeoV43.follow ? 'active' : ''} onClick={() => updatePageSeoV43({ follow: false })}>NOFOLLOW</button></div></div>
                <div className="seo-preview-v43"><span>ПРЕДПРОСМОТР</span><strong>{pageSeoV43.title || currentPageName}</strong><small>{pageSeoV43.canonical || '/content/storefront/' + region.toLowerCase() + '/' + pageId}</small><p>{pageSeoV43.description || 'Meta description пока не заполнен.'}</p></div>
              </section>

              <section className="aem-page-summary-v42"><label>СВОДКА</label><div><span>Секций<strong>{resolved.length}</strong></span><span>Слотов<strong>{metrics.filled}/{metrics.total}</strong></span><span>Покрытие<strong>{metrics.coverage}%</strong></span><span>OOS<strong>{metrics.oos}</strong></span></div></section>
              <button className="aem-page-info-action-v42" onClick={() => setShowCoverage(true)}><BarChart3 size={14}/><span><strong>Аналитика / покрытие</strong><small>Заполнение, ассортимент и OOS</small></span><ChevronRight size={13}/></button>
            </div>}`;
  app = app.slice(0, settingsStart) + settingsBody + app.slice(settingsEnd);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* page-settings-toolbar-v43 */')) {
  css += String.raw`
/* page-settings-toolbar-v43 */
/* One clean header: language → centered emulator → history → preview → analytics → publish. */
.aem-global-header-v40{display:none!important}
.clean-author-toolbar-v43{height:58px!important;min-height:58px!important;padding:0 16px!important;background:#fff!important;border-bottom:1px solid #dedede!important;display:grid!important;grid-template-columns:minmax(260px,1fr) auto minmax(430px,1fr)!important;align-items:center!important;gap:16px!important;position:relative!important;z-index:220!important;box-shadow:none!important}
.author-toolbar-left-v43{min-width:0;display:flex;align-items:center;gap:14px}.icon-only-v43{width:36px!important;height:36px!important;padding:0!important;display:grid!important;place-items:center!important;border:0!important;border-right:1px solid #e3e3e3!important;background:#fff!important;color:#333!important}.icon-only-v43.active{background:#f3f3f3!important;color:#111!important}.icon-only-v43 span{display:none!important}
.author-languages-v43{display:flex!important;align-items:center!important;gap:3px!important;border:0!important}.author-languages-v43 button{height:30px!important;min-width:34px!important;padding:0 8px!important;border:0!important;border-bottom:1px solid transparent!important;background:#fff!important;color:#888!important;font-size:9px!important;font-weight:500!important;letter-spacing:.04em!important}.author-languages-v43 button.active{color:#111!important;border-bottom-color:#111!important}
.author-emulator-v43{justify-self:center!important;display:flex!important;align-items:center!important;height:38px!important;border:1px solid #dedede!important;background:#fff!important;padding:2px!important;gap:1px!important}.author-emulator-v43 button{width:36px!important;height:32px!important;border:0!important;background:#fff!important;color:#888!important;display:grid!important;place-items:center!important}.author-emulator-v43 button.active{background:#222!important;color:#fff!important}.author-emulator-v43 button:hover:not(.active){background:#f4f4f4!important;color:#222!important}
.author-toolbar-actions-v43{justify-self:end!important;display:flex!important;align-items:center!important;gap:3px!important;min-width:0}.author-toolbar-actions-v43>button{height:36px!important;border:0!important;background:#fff!important;color:#444!important;padding:0 10px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;font-size:9px!important;font-weight:500!important;white-space:nowrap!important}.author-toolbar-actions-v43>button:hover:not(:disabled){background:#f4f4f4!important;color:#111!important}.author-toolbar-actions-v43>button.active{background:#f0f0f0!important;color:#111!important}.author-toolbar-actions-v43>button.icon-action{width:34px!important;padding:0!important}.author-toolbar-actions-v43>button:disabled{opacity:.28!important}.author-toolbar-divider-v43{width:1px;height:22px;background:#ddd;margin:0 5px}.author-toolbar-actions-v43 .publish-v43{background:#111!important;color:#fff!important;padding:0 18px!important}.author-toolbar-actions-v43 .publish-v43:hover{background:#2a2a2a!important;color:#fff!important}
.aem-author-shell-v40 .builder-workspace{height:calc(100vh - 58px)!important;min-height:calc(100vh - 58px)!important}.preview-mode .clean-author-toolbar-v43{display:grid!important}.preview-mode .aem-author-side-panel-v40,.preview-mode .aem-properties-panel-v40{display:none!important}

/* Page background */
.storefront-frame{background:var(--page-background-v43,#fff)!important}.storefront-frame .builder-section{background-color:transparent!important}
.page-background-settings-v43{display:grid!important;gap:10px!important}.page-color-control-v43{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:10px;align-items:center}.page-color-picker-v43{width:48px!important;height:42px!important;padding:2px!important;border:1px solid #d4d4d4!important;background:#fff!important;cursor:pointer!important}.page-color-control-v43>div{display:grid;gap:3px}.page-color-control-v43>div>span{font-size:7px;color:#8b8b8b;letter-spacing:.06em}.page-color-hex-v43{height:28px!important;border:0!important;border-bottom:1px solid #aaa!important;border-radius:0!important;padding:0!important;background:#fff!important;font-size:10px!important;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;text-transform:uppercase}.page-color-control-v43>button{height:30px;border:0;border-bottom:1px solid #bcbcbc;background:#fff;color:#555;font-size:8px;cursor:pointer}.page-color-presets-v43{display:flex;gap:7px}.page-color-presets-v43 button{width:25px;height:25px;border:1px solid #cfcfcf;box-shadow:inset 0 0 0 2px #fff;cursor:pointer}.page-color-presets-v43 button.active{outline:1px solid #111;outline-offset:2px}

/* SEO */
.page-seo-settings-v43{display:grid!important;gap:13px!important}.seo-section-head-v43{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.seo-section-head-v43>div{display:grid;gap:3px}.seo-section-head-v43 label{font-size:7px;letter-spacing:.09em;color:#777;font-weight:600}.seo-section-head-v43 strong{font-size:13px;font-weight:500;color:#111}.seo-section-head-v43>span{max-width:120px;text-align:right;font-size:7px;line-height:1.35;color:#999}.seo-field-v43{position:relative;display:grid!important;gap:5px!important}.seo-field-v43>span,.seo-robots-v43>span{font-size:7px!important;letter-spacing:.08em!important;color:#777!important;font-weight:600!important}.seo-field-v43 input,.seo-field-v43 textarea{width:100%!important;border:0!important;border-bottom:1px solid #aaa!important;border-radius:0!important;background:#fff!important;padding:6px 34px 6px 0!important;color:#111!important;font-size:10px!important;line-height:1.4!important;outline:none!important;resize:vertical!important}.seo-field-v43 textarea{min-height:66px!important}.seo-field-v43 input:focus,.seo-field-v43 textarea:focus{border-bottom-color:#111!important}.seo-field-v43>em{position:absolute;right:0;bottom:7px;font-style:normal;font-size:7px;color:#aaa}.seo-field-v43.textarea>em{bottom:8px}.seo-robots-v43{display:grid;gap:7px}.seo-robots-v43>div{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.seo-robots-v43 button{height:29px;border:1px solid #d5d5d5;background:#fff;color:#777;font-size:7px;letter-spacing:.04em;cursor:pointer}.seo-robots-v43 button.active{background:#222;border-color:#222;color:#fff}.seo-preview-v43{padding:11px 0;border-top:1px solid #ececec;border-bottom:1px solid #ececec;display:grid;gap:3px}.seo-preview-v43>span{font-size:7px;letter-spacing:.08em;color:#999}.seo-preview-v43>strong{font-size:13px;font-weight:500;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seo-preview-v43>small{font-size:7px;color:#557a4e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seo-preview-v43>p{margin:2px 0 0;font-size:8px;line-height:1.45;color:#777}

@media(max-width:1240px){.clean-author-toolbar-v43{grid-template-columns:minmax(190px,1fr) auto minmax(360px,1fr)!important;padding:0 10px!important;gap:8px!important}.author-toolbar-actions-v43>button{padding:0 7px!important}.author-toolbar-actions-v43 .publish-v43{padding:0 12px!important}}
@media(max-width:1024px){.clean-author-toolbar-v43{grid-template-columns:auto 1fr auto!important}.author-languages-v43{max-width:160px;overflow-x:auto}.author-emulator-v43{justify-self:center!important}.author-toolbar-actions-v43>button:not(.icon-action):not(.publish-v43){font-size:0!important;width:36px!important;padding:0!important}.author-toolbar-actions-v43>button:not(.icon-action):not(.publish-v43) svg{width:17px;height:17px}.author-toolbar-actions-v43 .publish-v43{font-size:8px!important}}
@media(max-width:680px){.clean-author-toolbar-v43{height:auto!important;min-height:54px!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'left center' 'actions actions'!important;padding:6px 8px!important}.author-toolbar-left-v43{grid-area:left}.author-emulator-v43{grid-area:center}.author-toolbar-actions-v43{grid-area:actions;justify-self:stretch!important;justify-content:flex-end!important;border-top:1px solid #eee;padding-top:5px}.aem-author-shell-v40 .builder-workspace{height:calc(100vh - 100px)!important;min-height:calc(100vh - 100px)!important}.page-color-control-v43{grid-template-columns:42px minmax(0,1fr)}.page-color-control-v43>button{grid-column:2}.seo-robots-v43>div{grid-template-columns:1fr 1fr}}
`;
  writeFileSync(cssPath, css);
}

console.log('Page settings + clean author toolbar v43 applied');
