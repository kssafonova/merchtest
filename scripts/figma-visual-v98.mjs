import {readFileSync,writeFileSync} from 'node:fs';
const path='src/appv3.css';
let css=readFileSync(path,'utf8');
if(!css.includes('/* figma-visual-v98 */')){css+=String.raw`
/* figma-visual-v98 */
/* Button and imported-page controls */
.editor-figma-trigger-v97{height:36px!important;padding:0 12px!important;border:1px solid #d8dee8!important;border-radius:7px!important;background:#fff!important;color:#263344!important;display:flex!important;align-items:center!important;gap:7px!important;font-size:11px!important;font-weight:650!important;white-space:nowrap!important}
.editor-figma-trigger-v97:hover{background:#eff5ff!important;border-color:#9db9ee!important;color:#245bc3!important}
.builder-section:has(.figma-imported-block-v97) .section-containers,.builder-section:has(.figma-imported-block-v97) .merch-empty-section-v74{display:none!important}
.builder-section:has(.figma-imported-block-v97){padding-bottom:0!important}
.figma-imported-block-v97{margin:8px 0 0;background:#fff;border:1px solid #e6ebf1;overflow:hidden}
.figma-edit-hint-v97{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#f6f9fe;border-bottom:1px solid #e2e7ef;color:#5d6878;font-size:10px}
.figma-render-v97{max-width:100%;overflow:hidden}
.figma-root-v97{position:relative;isolation:isolate}
.figma-text-v97{display:block;min-height:1em}
.figma-text-v97.editable{cursor:text;border-radius:2px}
.figma-text-v97.editable:hover{outline:1px dashed #4b80d5;outline-offset:1px}
.figma-text-v97.editable:focus{outline:2px solid #245bc3;outline-offset:1px;background:rgba(255,255,255,.45)}
/* Import dialog */
.figma-import-backdrop-v97{position:fixed;inset:0;z-index:20000;background:rgba(16,24,40,.46);display:grid;place-items:center;padding:20px}
.figma-import-dialog-v97{width:min(640px,100%);max-height:min(820px,calc(100dvh - 40px));background:#fff;border-radius:13px;box-shadow:0 24px 80px rgba(16,24,40,.22);display:flex;flex-direction:column;overflow:hidden;color:#1c2533}
.figma-import-dialog-v97>header{display:flex;justify-content:space-between;gap:18px;padding:22px 24px 18px;border-bottom:1px solid #e4e9f0}
.figma-import-dialog-v97>header>div{display:grid;gap:5px}
.figma-import-dialog-v97>header span{font-size:9px;letter-spacing:.12em;font-weight:750;color:#245bc3}
.figma-import-dialog-v97 h2{margin:0;font-size:23px;line-height:1.15;letter-spacing:-.02em}
.figma-import-dialog-v97 p{margin:0;color:#6a7688;font-size:12px;line-height:1.45}
.figma-import-dialog-v97>header>button{width:34px;height:34px;border:0;background:#f2f4f8;border-radius:8px;display:grid;place-items:center}
.figma-import-body-v97{padding:18px 24px 24px;overflow:auto;min-height:0}
.figma-import-zone-v97{min-height:188px;border:1.5px dashed #a8b9d6;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#f8faff;text-align:center;padding:18px;color:#536683}
.figma-import-zone-v97.dragging{border-color:#245bc3;background:#edf4ff}
.figma-import-zone-v97>strong{font-size:13px;color:#273b56}
.figma-import-zone-v97>span{font-size:11px}
.figma-import-zone-v97>button,.figma-link-help-v97 button{height:34px;border:1px solid #245bc3;border-radius:7px;background:#fff;color:#245bc3;font-size:11px;font-weight:650;padding:0 12px}
.figma-import-zone-v97>small{font-size:9px;color:#7d8b9d}
.figma-link-help-v97{margin-top:14px;border:1px solid #e6eaf1;border-radius:8px}
.figma-link-help-v97>summary{padding:12px;display:flex;gap:8px;align-items:center;cursor:pointer;color:#3c4d64;font-size:12px;font-weight:600}
.figma-link-help-v97>p{padding:0 12px 10px}
.figma-link-help-v97>div{display:flex;gap:7px;padding:0 12px 12px}
.figma-link-help-v97 input{width:100%;min-width:0;min-height:34px;border:1px solid #d8dee8;border-radius:7px;padding:0 9px;font-size:11px}
.figma-import-warning-v97{display:flex;align-items:flex-start;gap:8px;margin-top:12px;padding:11px;border:1px solid #ead7ae;border-radius:7px;background:#fff9ee;color:#7a4c19;font-size:11px;line-height:1.5;overflow-wrap:anywhere}
.figma-import-warning-v97 svg{flex:0 0 auto}
.figma-import-busy-v97{padding:12px;font-size:12px}
.figma-import-review-v97{margin-top:20px;display:grid;gap:14px}
.figma-review-title-v97{display:flex;align-items:center;justify-content:space-between;gap:12px}
.figma-review-title-v97>div{display:grid;gap:4px}
.figma-review-title-v97 strong{font-size:13px}
.figma-review-title-v97 small{color:#7b8593;font-size:10px}
.figma-review-title-v97 button{background:#fff;border:0;color:#245bc3;font-size:11px}
.figma-review-list-v97{display:grid;gap:6px;max-height:240px;overflow:auto}
.figma-review-list-v97>label{min-height:56px;padding:9px 11px;border:1px solid #e0e5ee;border-radius:8px;display:flex;align-items:center;gap:12px;cursor:pointer}
.figma-review-list-v97>label.picked{border-color:#93b4ee;background:#f4f8ff}
.figma-frame-icon-v97{width:34px;height:34px;display:grid;place-items:center;border-radius:7px;background:#e8eef7;color:#5d779e}
.figma-review-list-v97>label>span:nth-last-child(2){flex:1;min-width:0;display:grid;gap:4px}
.figma-review-list-v97>label strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.figma-review-list-v97>label small{font-size:10px;color:#7b8593}
.figma-import-mode-v97{border-top:1px solid #e6e9f0;padding-top:14px;display:grid;gap:9px}
.figma-import-mode-v97>strong{font-size:12px}
.figma-import-mode-v97>label{display:flex;align-items:flex-start;gap:9px;cursor:pointer}
.figma-import-mode-v97>label span{display:grid;gap:3px}
.figma-import-mode-v97 b{font-size:11px}
.figma-import-mode-v97 small{font-size:10px;color:#7b8593}
.figma-import-dialog-v97>footer{display:flex;align-items:center;gap:8px;padding:14px 24px;border-top:1px solid #e6eaf0;background:#fff}
.figma-import-dialog-v97>footer span{font-size:10px;color:#6c7788;margin-right:auto}
.figma-import-dialog-v97>footer button{height:38px;padding:0 14px;border:1px solid #d4dae5;background:#fff;border-radius:7px;font-size:11px;font-weight:650}
.figma-import-dialog-v97>footer button.primary{background:#245bc3;border-color:#245bc3;color:#fff}
.figma-import-dialog-v97>footer button:disabled{opacity:.4;cursor:not-allowed}
@media(max-width:1024px){.editor-figma-trigger-v97{min-width:36px!important;width:36px!important;padding:0!important;justify-content:center!important}.editor-figma-trigger-v97 span{display:none!important}}
@media(max-width:540px){.figma-import-backdrop-v97{padding:0}.figma-import-dialog-v97{height:100dvh;max-height:100dvh;width:100%;border-radius:0}.figma-import-dialog-v97>header{padding:16px}.figma-import-body-v97{padding:14px 16px}.figma-import-dialog-v97>footer{padding:12px 16px;flex-wrap:wrap}.figma-import-dialog-v97>footer span{flex:1 1 100%}}
`;writeFileSync(path,css);}
console.log('V98 applied: Figma import UI styling');
