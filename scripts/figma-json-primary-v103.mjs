import {readFileSync,writeFileSync} from 'node:fs';
const path='src/appv3.css';
let css=readFileSync(path,'utf8');
if(!css.includes('/* figma-json-primary-v103 */')){css+=String.raw`
/* figma-json-primary-v103 */
.figma-json-main-v103{display:flex;flex-direction:column;gap:12px;border:1px solid #d7e2f1;border-radius:12px;background:#f8faff;padding:17px}
.figma-json-main-heading-v103{display:flex;align-items:flex-start;gap:10px;color:#245bc3}
.figma-json-main-heading-v103>div{display:grid;gap:4px;min-width:0}
.figma-json-main-heading-v103 strong{color:#24364b;font-size:14px;font-weight:750;line-height:1.25}
.figma-json-main-heading-v103 small{color:#66788f;font-size:11px;line-height:1.5}
.figma-json-main-v103>label{font-size:11px;color:#52647b;font-weight:650}
.figma-json-main-v103>textarea{box-sizing:border-box;display:block;width:100%;height:235px;min-height:155px;max-height:52vh;resize:vertical;border:1px solid #bfcde0;border-radius:9px;background:#fff;padding:13px 14px;color:#203148;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;tab-size:2;white-space:pre;overflow:auto}
.figma-json-main-v103>textarea:focus{outline:2px solid #245bc3;outline-offset:1px}
.figma-json-main-v103>textarea::placeholder{color:#9aa7b8}
.figma-json-main-actions-v103{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.figma-json-main-actions-v103>span{color:#6e7f94;font-size:10px}
.figma-json-main-actions-v103>div{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-left:auto}
.figma-json-main-actions-v103 button{min-height:38px;padding:0 14px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer}
.figma-json-main-actions-v103 button.figma-json-check-v103{background:#245bc3;border:1px solid #245bc3;color:#fff}
.figma-json-main-actions-v103 button.figma-json-check-v103:hover:not(:disabled){background:#174798}
.figma-json-main-actions-v103 button.figma-json-clear-v103{background:#fff;border:1px solid #d4ddeb;color:#5f7086}
.figma-json-main-actions-v103 button:disabled{opacity:.4;cursor:not-allowed}
.figma-import-alternatives-v103{margin-top:15px;border:1px solid #e3e8f1;border-radius:10px;overflow:hidden;background:#fff}
.figma-import-alternatives-v103>summary{padding:13px 14px;font-size:11px;font-weight:650;color:#4d617d;cursor:pointer;list-style-position:inside}
.figma-import-alternatives-v103[open]>summary{border-bottom:1px solid #e3e8f1}
.figma-import-alternatives-v103>.figma-link-primary-v99{margin:13px 14px 0}
.figma-import-alternatives-v103>.figma-import-zone-v97{margin:0 14px 14px;min-height:135px}
.figma-import-alternatives-v103>.figma-import-separator-v99{margin:12px 14px}
@media(max-width:540px){.figma-json-main-v103{padding:12px}.figma-json-main-v103>textarea{height:210px;max-height:42vh;font-size:11px}.figma-json-main-actions-v103>div{width:100%;justify-content:flex-end}.figma-import-alternatives-v103>.figma-link-primary-v99{margin:10px 10px 0}.figma-import-alternatives-v103>.figma-import-zone-v97{margin:0 10px 10px}}
`;writeFileSync(path,css);}
console.log('V103 applied: visible JSON editor for Figma import');
