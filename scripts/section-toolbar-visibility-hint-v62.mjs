import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SECTION_TOOLBAR_VISIBILITY_HINT_V62';

if (!app.includes(MARKER)) {
  const markerAnchor = 'const SECTION_MULTISELECT_GROUP_RULES_V61 = true;';
  if (!app.includes(markerAnchor)) throw new Error(MARKER + ': V61 marker missing');
  app = app.replace(markerAnchor, markerAnchor + '\nconst ' + MARKER + ' = true;');

  const canvasAnchor = '<section className="canvas-shell">';
  if (!app.includes(canvasAnchor)) throw new Error(MARKER + ': canvas shell missing');
  const hint = `<section className="canvas-shell">
        {!previewMode && <div className="section-multiselect-hint-v62" role="note">
          <span className="section-multiselect-key-v62">SHIFT</span>
          <span><strong>Выберите несколько секций</strong><small>Зажмите Shift и нажимайте на секции — затем можно применить авто-правила сразу ко всей группе.</small></span>
        </div>}`;
  app = app.replace(canvasAnchor, hint);

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* section-toolbar-visibility-hint-v62 */')) {
  css += String.raw`
/* section-toolbar-visibility-hint-v62 */
/* Keep the section author toolbar inside the section bounds so canvas overflow never clips it. */
.builder-section{overflow:visible!important}
.builder-section>.section-author-toolbar-v57.section-author-toolbar-v60{
  position:relative!important;
  inset:auto!important;
  top:auto!important;
  left:auto!important;
  width:100%!important;
  max-width:100%!important;
  min-height:38px!important;
  height:38px!important;
  margin:0!important;
  transform:none!important;
  opacity:1!important;
  pointer-events:auto!important;
  display:flex!important;
  align-items:stretch!important;
  box-shadow:none!important;
  border:1px solid #d9d9d9!important;
  border-bottom:0!important;
  background:#fff!important;
  z-index:95!important;
}
.builder-section.selected>.section-author-toolbar-v60{border-color:#2680eb!important;background:#fff!important}
.section-author-toolbar-v60 .section-author-identity-v60{flex:1 1 auto!important;min-width:0!important;max-width:none!important}
.section-author-toolbar-v60 .section-author-identity-v60 strong{font-size:10px!important;color:#333!important}
.builder-section.selected>.section-author-toolbar-v60 .section-author-identity-v60 strong{color:#1473e6!important;font-weight:700!important}
.section-author-toolbar-v60 .section-author-identity-v60 small{font-size:7px!important;color:#888!important}

/* Section actions are intentionally revealed only for the active section. */
.section-author-toolbar-v60 .section-author-action-v57{display:none!important}
.builder-section.selected>.section-author-toolbar-v60 .section-author-action-v57{display:flex!important}
.builder-section.selected>.section-author-toolbar-v60 .section-author-icon-v60{display:flex!important}
.section-author-toolbar-v60 .section-select-toggle-v60,.section-author-toolbar-v60 .section-author-drag-v60{display:grid!important}
.builder-section+.builder-section{margin-top:26px!important}
.builder-section:first-of-type{margin-top:18px!important}
.preview-mode .builder-section>.section-author-toolbar-v60{display:none!important}
.preview-mode .builder-section{margin-top:0!important}

/* Always-visible multi-selection help inside the editable canvas. */
.section-multiselect-hint-v62{
  margin:0 0 14px!important;
  min-height:42px!important;
  padding:8px 11px!important;
  border:1px solid #dce8f7!important;
  background:#f7fbff!important;
  display:flex!important;
  align-items:center!important;
  gap:9px!important;
  color:#202020!important;
}
.section-multiselect-key-v62{
  flex:0 0 auto!important;
  min-width:42px!important;
  height:24px!important;
  padding:0 7px!important;
  border:1px solid #a9bfdc!important;
  background:#fff!important;
  display:grid!important;
  place-items:center!important;
  font-size:8px!important;
  font-weight:700!important;
  letter-spacing:.08em!important;
  color:#1473e6!important;
  box-shadow:0 1px 0 #d8e3ef!important;
}
.section-multiselect-hint-v62>span:last-child{display:grid!important;gap:2px!important;min-width:0!important}
.section-multiselect-hint-v62 strong{font-size:9px!important;font-weight:600!important}
.section-multiselect-hint-v62 small{font-size:8px!important;line-height:1.35!important;color:#6f7780!important}

@media(max-width:1100px){
  .builder-section.selected>.section-author-toolbar-v60 .section-author-action-v57 span{display:none!important}
  .builder-section.selected>.section-author-toolbar-v60 .section-author-action-v57{width:34px!important;padding:0!important;justify-content:center!important}
}
@media(max-width:640px){
  .section-multiselect-hint-v62{align-items:flex-start!important}
  .section-multiselect-hint-v62 small{font-size:7px!important}
  .section-author-toolbar-v60 .section-author-identity-v60{display:grid!important;min-width:0!important}
  .section-author-toolbar-v60 .section-select-toggle-v60{width:30px!important;min-width:30px!important}
  .section-author-toolbar-v60 .section-author-drag-v60{width:30px!important;min-width:30px!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V62 applied: visible in-section toolbar + Shift multi-select hint');
