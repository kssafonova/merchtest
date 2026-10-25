import {readFileSync,writeFileSync} from 'node:fs';
const path='src/appv3.css';
let css=readFileSync(path,'utf8');
if(!css.includes('/* hosted-figma-import-v99 */')){css+=String.raw`
/* hosted-figma-import-v99 */
.figma-link-primary-v99{display:grid;gap:13px;padding:16px;border:1px solid #d2ddf2;border-radius:11px;background:linear-gradient(130deg,#f5f8ff 0%,#fff 95%)}
.figma-link-header-v99{display:flex;gap:10px;align-items:center;color:#245bc3}
.figma-link-header-v99>div{display:grid;gap:4px}
.figma-link-header-v99 strong{font-size:14px;color:#20304a;font-weight:700}
.figma-link-header-v99 small{font-size:11px;color:#67758a;line-height:1.4}
.figma-link-controls-v99{display:flex;gap:9px;align-items:stretch}
.figma-link-controls-v99 input{height:44px;flex:1;min-width:0;border:1px solid #cdd9eb;border-radius:8px;background:#fff;padding:0 13px;font-family:inherit;font-size:12px;color:#1e2d42}
.figma-link-controls-v99 input:focus{outline:2px solid #245bc3;outline-offset:1px}
.figma-link-controls-v99 button{min-width:134px;min-height:44px;border:1px solid #245bc3;background:#245bc3;color:#fff;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;padding:0 13px}
.figma-link-controls-v99 button:hover:not(:disabled){background:#1a489d}
.figma-link-controls-v99 button:disabled{opacity:.45;cursor:not-allowed}
.figma-import-dialog-v97 .figma-link-status-v99{margin:0;color:#6a7a90;font-size:10.5px;line-height:1.5}
.figma-import-separator-v99{display:flex;align-items:center;gap:12px;margin:20px 0 15px;color:#97a2b1;font-size:9px;letter-spacing:.07em;font-weight:750}
.figma-import-separator-v99::before,.figma-import-separator-v99::after{content:"";height:1px;background:#e3e8f0;flex:1}
.figma-import-zone-v97{min-height:140px}
@media(max-width:520px){.figma-link-controls-v99{flex-direction:column}.figma-link-controls-v99 button{min-height:42px}.figma-link-primary-v99{padding:13px}}
`;writeFileSync(path,css);}
console.log('V99 applied: Figma URL-first import UI');
