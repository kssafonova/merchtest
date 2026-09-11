import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
const MARKER='PANEL_FLOW_SLOT_METRICS_V92';
let app=readFileSync(appPath,'utf8');

if(!app.includes(MARKER)){
  const anchor='const SLOT_BADGES_METRICS_V91 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V91 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // Remove the operational-efficiency UI from the authoring shell. Keep the underlying
  // validation helpers because publish safety still uses them.
  const opsButton="<button className={'editor-ops-v79 '+(opsPanelOpenV79?'active':'')} onClick={()=>setOpsPanelOpenV79((value)=>!value)}><CheckCircle2 size={16}/><span>Эффективность</span></button>";
  if(app.includes(opsButton)) app=app.replace(opsButton,'');
  app=app.replace(/<OpsMigrationPanelV79 open=\{opsPanelOpenV79\}[^>]*\/>\s*/g,'');

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* panel-flow-slot-metrics-v92 */')){
  css+=String.raw`
/* panel-flow-slot-metrics-v92 */
/* 1. Metrics placed INSIDE storefront slots must be as legible as metrics in the content browser. */
.lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47{
  right:10px!important;
  bottom:10px!important;
  gap:5px!important;
  z-index:43!important;
}
.lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47>span{
  min-width:90px!important;
  height:28px!important;
  padding:0 9px!important;
  grid-template-columns:7px minmax(0,1fr) auto!important;
  gap:7px!important;
  background:rgba(255,255,255,.97)!important;
  border:1px solid rgba(17,17,17,.34)!important;
  border-radius:4px!important;
  box-shadow:0 3px 12px rgba(0,0,0,.17)!important;
  backdrop-filter:blur(10px)!important;
}
.lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47>span i{
  width:7px!important;
  height:7px!important;
  box-shadow:0 0 0 2px rgba(255,255,255,.92)!important;
}
.lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47 em{
  font-size:7px!important;
  font-weight:750!important;
  letter-spacing:.055em!important;
  color:#414141!important;
}
.lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47 b{
  font-size:10px!important;
  font-weight:850!important;
  color:#111!important;
}
.builder-section.selected .lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47>span,
.lego-slot.filled:hover .content-metric-overlay-v47.slot-overlay-v47>span{
  border-color:rgba(17,17,17,.5)!important;
  box-shadow:0 4px 14px rgba(0,0,0,.2)!important;
}

/* 2. Efficiency/Migration Control Center is no longer part of the authoring UI. */
.editor-ops-v79,.ops-panel-v79{display:none!important}

/* 3. Desktop side columns run for the full page height instead of ending at the old 560–760px cap.
   The document remains the vertical scroll owner; left/right backgrounds stretch to the canvas end. */
@media (min-width:1024px){
  html,body,#root,.lego-app{height:auto!important;min-height:100%!important}
  .builder-workspace{
    height:auto!important;
    min-height:calc(100vh - 74px)!important;
    max-height:none!important;
    align-items:stretch!important;
    overflow:visible!important;
  }
  .canvas-shell{
    height:auto!important;
    min-height:calc(100vh - 74px)!important;
    max-height:none!important;
    align-self:stretch!important;
    overflow-y:visible!important;
  }
  .aem-author-side-panel-v40.open{
    position:static!important;
    height:auto!important;
    min-height:100%!important;
    max-height:none!important;
    align-self:stretch!important;
    overflow:hidden!important;
  }
  .aem-author-side-panel-v40 .aem-side-content-v40{
    height:100%!important;
    min-height:100%!important;
  }
  .aem-author-side-panel-v40 .aem-side-scroll-v40{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
  }
  .right-side-shell-v45{
    position:static!important;
    height:auto!important;
    min-height:100%!important;
    max-height:none!important;
    align-self:stretch!important;
    overflow:hidden!important;
  }
  .right-side-shell-v45>.right-edge-rail-v44,
  .right-side-shell-v45>.aem-properties-panel-v40{
    height:100%!important;
    min-height:100%!important;
    max-height:none!important;
    align-self:stretch!important;
  }
  .content-browser-mode-v44,.section-settings-mode-v44{
    height:100%!important;
    min-height:100%!important;
    max-height:none!important;
  }
}

@media(max-width:680px){
  .lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47{right:7px!important;bottom:7px!important;gap:4px!important}
  .lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47>span{min-width:78px!important;height:24px!important;padding:0 7px!important;gap:5px!important}
  .lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47 em{font-size:6.3px!important}
  .lego-slot.filled .content-metric-overlay-v47.slot-overlay-v47 b{font-size:8.5px!important}
}
`;
  writeFileSync(cssPath,css);
}

console.log('V92 applied: slot metrics emphasized, efficiency panel removed, desktop side panels stretch with document');
