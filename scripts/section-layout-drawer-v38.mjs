import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SECTION_LAYOUT_DRAWER_V38';

if (!app.includes(MARKER)) {
  const anchor = 'const AEM_SITES_COMMERCE_BROWSER_V37 = true;';
  if (!app.includes(anchor)) throw new Error('SECTION_LAYOUT_DRAWER_V38: V37 marker missing');

  const helpers = String.raw`
function sectionLayoutOverrideCountV38(section) {
  return Object.values(section?.layoutOverrides || {}).reduce((sum, value) => sum + Object.keys(value || {}).length, 0);
}

function scrollToSectionAutomationV38() {
  const target = document.querySelector('.section-settings-v18 .unified-rule-block');
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('automation-focus-v38');
  window.setTimeout(() => target.classList.remove('automation-focus-v38'), 1200);
}

function SectionEditLauncherV38({ section, device = 'desktop', onEditLayout, onAutomation }) {
  if (!section) return null;
  const overrides = sectionLayoutOverrideCountV38(section);
  const breakpoint = AEM_BREAKPOINTS_V36[device] ? device : 'desktop';
  const config = AEM_BREAKPOINTS_V36[breakpoint];
  return <section className="section-edit-launcher-v38">
    <div className="section-edit-launcher-head-v38">
      <div><span>МАКЕТ СЕКЦИИ</span><strong>{layoutDisplayName(section.template)}</strong><small>Responsive Grid · {config.cols} колонок · {overrides ? overrides + ' локальных override' : 'без локальных override'}</small></div>
      <span className="section-edit-breakpoint-v38">{config.label}</span>
    </div>
    <button className="section-edit-preview-v38" onClick={onEditLayout} title="Открыть редактор макета">
      <AemMiniSectionPreviewV36 section={section} device={breakpoint}/>
      <span className="section-edit-preview-hint-v38"><LayoutGrid size={13}/>Нажмите, чтобы редактировать геометрию</span>
    </button>
    <div className="section-edit-actions-v38">
      <button className="primary" onClick={onEditLayout}><LayoutGrid size={14}/><span><strong>Редактировать макет</strong><small>Desktop · Tablet · Mobile</small></span><ChevronRight size={15}/></button>
      <button className="secondary" onClick={onAutomation}><span><strong>Автоматизация</strong><small>Отбор · сортировка · резерв · fallback</small></span><ChevronRight size={15}/></button>
    </div>
  </section>;
}

function SectionLayoutDrawerV38({ open, section, device = 'desktop', onDeviceChange, onLayoutChange, onClose }) {
  if (!open || !section) return null;
  const overrides = sectionLayoutOverrideCountV38(section);
  return <div className="section-layout-drawer-shell-v38" role="dialog" aria-modal="false" aria-label="Редактирование макета секции">
    <aside className="section-layout-drawer-v38">
      <header className="section-layout-drawer-head-v38">
        <div><span>СЕКЦИЯ · МАКЕТ</span><strong>{section.titles?.ru || section.titles?.en || layoutDisplayName(section.template)}</strong><small>{layoutDisplayName(section.template)} · {overrides ? overrides + ' override' : 'базовый preset'}</small></div>
        <button onClick={onClose} title="Закрыть"><X size={18}/></button>
      </header>
      <div className="section-layout-drawer-scroll-v38">
        <AemLayoutInspectorV36 section={section} device={device} onDeviceChange={onDeviceChange} onLayoutChange={onLayoutChange}/>
      </div>
      <footer className="section-layout-drawer-footer-v38">
        <span><i/>Изменения применяются к canvas сразу</span>
        <button onClick={onClose}>Готово</button>
      </footer>
    </aside>
  </div>;
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  const panelStart = app.indexOf('function SectionSettingsPanel(');
  const panelEnd = panelStart >= 0 ? app.indexOf('\nfunction TypePreview(', panelStart) : -1;
  if (panelStart < 0 || panelEnd < 0) throw new Error('SECTION_LAYOUT_DRAWER_V38: SectionSettingsPanel boundaries missing');
  let panel = app.slice(panelStart, panelEnd);

  const signaturePattern = /function SectionSettingsPanel\(([^)]*)\) \{\n  if \(!section\) return null;/;
  if (!signaturePattern.test(panel)) throw new Error('SECTION_LAYOUT_DRAWER_V38: SectionSettingsPanel signature anchor missing');
  panel = panel.replace(signaturePattern, (match, args) => `function SectionSettingsPanel(${args}) {\n  const [layoutDrawerOpenV38, setLayoutDrawerOpenV38] = useState(false);\n  if (!section) return null;`);

  const inspector = '<AemLayoutInspectorV36 section={section} device={device} onDeviceChange={onDeviceChange} onLayoutChange={onLayoutChange}/>';
  if (!panel.includes(inspector)) throw new Error('SECTION_LAYOUT_DRAWER_V38: embedded AEM inspector missing');
  panel = panel.replace(inspector, `<SectionEditLauncherV38 section={section} device={device} onEditLayout={() => setLayoutDrawerOpenV38(true)} onAutomation={scrollToSectionAutomationV38}/>
    <SectionLayoutDrawerV38 open={layoutDrawerOpenV38} section={section} device={device} onDeviceChange={onDeviceChange} onLayoutChange={onLayoutChange} onClose={() => setLayoutDrawerOpenV38(false)}/>`);

  app = app.slice(0, panelStart) + panel + app.slice(panelEnd);
  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* section-layout-drawer-v38 */')) {
  css += String.raw`
/* section-layout-drawer-v38 */
.section-edit-launcher-v38{margin:18px 0 22px;padding:0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;background:#fff;color:#111}
.section-edit-launcher-head-v38{min-height:72px;padding:16px 0 13px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.section-edit-launcher-head-v38>div{display:grid;gap:4px;min-width:0}.section-edit-launcher-head-v38 span,.section-edit-launcher-head-v38 small{font-size:9px;line-height:1.3;letter-spacing:.06em;text-transform:uppercase;color:#777}.section-edit-launcher-head-v38 strong{font-size:15px;font-weight:500;line-height:1.25;color:#111}.section-edit-breakpoint-v38{flex:none;color:#111!important;border-bottom:1px solid #111;padding-bottom:3px}
.section-edit-preview-v38{width:100%;padding:16px;border:0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;background:#fafafa;text-align:left;cursor:pointer;display:grid;gap:10px}.section-edit-preview-v38:hover{background:#f7f7f7}.section-edit-preview-v38 .aem-mini-preview-v36{width:min(100%,360px);margin:0 auto}.section-edit-preview-hint-v38{display:flex;align-items:center;justify-content:center;gap:6px;font-size:9px;letter-spacing:.04em;text-transform:uppercase;color:#6b6b6b}
.section-edit-actions-v38{display:grid;grid-template-columns:1fr 1fr;gap:0}.section-edit-actions-v38 button{min-height:64px;padding:12px 14px;border:0;background:#fff;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer}.section-edit-actions-v38 button+button{border-left:1px solid #e5e5e5}.section-edit-actions-v38 button>span{display:grid;gap:3px;flex:1;min-width:0}.section-edit-actions-v38 button strong{font-size:11px;font-weight:600;color:#111}.section-edit-actions-v38 button small{font-size:8px;line-height:1.3;color:#777}.section-edit-actions-v38 button.primary{background:#111;color:#fff}.section-edit-actions-v38 button.primary strong,.section-edit-actions-v38 button.primary small{color:#fff}.section-edit-actions-v38 button.primary small{opacity:.65}.section-edit-actions-v38 button:hover{background:#f6f6f6}.section-edit-actions-v38 button.primary:hover{background:#242424}

.section-layout-drawer-shell-v38{position:fixed;inset:0;z-index:1200;pointer-events:none}.section-layout-drawer-v38{position:absolute;top:0;right:0;bottom:0;width:min(620px,calc(100vw - 72px));background:#fff;border-left:1px solid #ddd;box-shadow:-18px 0 42px rgba(0,0,0,.08);display:grid;grid-template-rows:auto minmax(0,1fr) auto;pointer-events:auto;animation:sectionLayoutDrawerInV38 .18s ease-out both}.section-layout-drawer-head-v38{min-height:78px;padding:16px 20px 14px;border-bottom:1px solid #e5e5e5;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;background:#fff}.section-layout-drawer-head-v38>div{display:grid;gap:4px;min-width:0}.section-layout-drawer-head-v38 span,.section-layout-drawer-head-v38 small{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:#777}.section-layout-drawer-head-v38 strong{font-size:19px;font-weight:500;color:#111;line-height:1.2}.section-layout-drawer-head-v38 button{width:32px;height:32px;border:0;background:transparent;display:grid;place-items:center;color:#111;cursor:pointer}.section-layout-drawer-head-v38 button:hover{background:#f5f5f5}
.section-layout-drawer-scroll-v38{min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 20px 28px}.section-layout-drawer-v38 .aem-layout-inspector-v36{margin:0!important;padding:0!important;border:0!important;background:#fff!important}.section-layout-drawer-v38 .aem-layout-head{padding:22px 0 16px!important;border-bottom:1px solid #e5e5e5!important}.section-layout-drawer-v38 .aem-breakpoint-tabs{position:sticky;top:0;z-index:4;background:#fff;padding:14px 0!important;border-bottom:1px solid #e5e5e5!important}.section-layout-drawer-v38 .aem-layout-preview-row{margin-top:18px!important}.section-layout-drawer-v38 .aem-layout-slot-list{margin-top:8px!important}
.section-layout-drawer-footer-v38{min-height:64px;padding:10px 20px;border-top:1px solid #e5e5e5;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px}.section-layout-drawer-footer-v38 span{display:flex;align-items:center;gap:7px;font-size:9px;color:#6b6b6b}.section-layout-drawer-footer-v38 span i{width:6px;height:6px;border-radius:50%;background:#2e7d32}.section-layout-drawer-footer-v38>button{height:38px;padding:0 24px;border:1px solid #111;background:#111;color:#fff;font-size:10px;font-weight:600;cursor:pointer}.section-layout-drawer-footer-v38>button:hover{background:#2a2a2a}
.automation-focus-v38{animation:automationFocusV38 1.1s ease-out}
@keyframes sectionLayoutDrawerInV38{from{transform:translateX(22px);opacity:.6}to{transform:translateX(0);opacity:1}}
@keyframes automationFocusV38{0%,25%{box-shadow:inset 3px 0 0 #111;background:#fafafa}100%{box-shadow:inset 0 0 0 transparent;background:#fff}}

@media(max-width:1024px){.section-layout-drawer-v38{width:min(580px,calc(100vw - 28px))}.section-edit-actions-v38{grid-template-columns:1fr}.section-edit-actions-v38 button+button{border-left:0;border-top:1px solid #e5e5e5}}
@media(max-width:767px){.section-layout-drawer-v38{width:100vw;left:0;border-left:0;box-shadow:none}.section-layout-drawer-head-v38{padding:14px 16px}.section-layout-drawer-scroll-v38{padding:0 16px 24px}.section-layout-drawer-footer-v38{padding:10px 16px}.section-edit-launcher-v38{margin-top:14px}.section-edit-preview-v38{padding:12px}}
`;
  writeFileSync(cssPath, css);
}

console.log('Section layout drawer v38 applied: layout mode moved into dedicated side editor');
