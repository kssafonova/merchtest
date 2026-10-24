import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
const MARKER='DOCUMENT_SCROLL_CONTENT_FLOW_V93';
let app=readFileSync(appPath,'utf8');

if(!app.includes(MARKER)){
  const anchor='const PANEL_FLOW_SLOT_METRICS_V92 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V92 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');
  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* document-scroll-content-flow-v93 */')){
  css+=String.raw`
/* document-scroll-content-flow-v93 */
/* V92 stretched the side columns but left the old 1fr/2fr viewport grid inside the content
   browser. On a long page that made the filter zone tens of thousands of pixels tall and pushed
   product cards far below the viewport. Desktop now has one vertical scroll owner: the document. */
@media (min-width:1024px){
  html,body{
    height:auto!important;
    min-height:100%!important;
    max-height:none!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior-y:auto!important;
  }
  #root,.lego-app{
    height:auto!important;
    min-height:100vh!important;
    max-height:none!important;
    overflow:visible!important;
  }
  .lego-app{touch-action:pan-y!important}

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
    /* An overflow-x:auto / overflow-y:visible mix computes to auto/auto,
       making the canvas a non-scrolling wheel trap. Let the document scroll. */
    overflow:visible!important;
    overscroll-behavior:auto!important;
    scroll-behavior:auto!important;
  }

  /* Left panel is part of page flow; no clipped internal viewport. */
  .aem-author-side-panel-v40.open{
    position:static!important;
    height:auto!important;
    min-height:calc(100vh - 74px)!important;
    max-height:none!important;
    align-self:stretch!important;
    overflow:visible!important;
  }
  .aem-author-side-panel-v40 .aem-side-content-v40,
  .aem-author-side-panel-v40 .aem-side-scroll-v40{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
    overscroll-behavior:auto!important;
  }

  /* Right shell stretches with whichever is taller: canvas or content. */
  .right-side-shell-v45{
    position:static!important;
    height:auto!important;
    min-height:calc(100vh - 74px)!important;
    max-height:none!important;
    align-self:stretch!important;
    grid-template-rows:auto!important;
    overflow:visible!important;
  }
  .right-side-shell-v45>.right-edge-rail-v44,
  .right-side-shell-v45>.aem-properties-panel-v40{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    align-self:stretch!important;
    overflow:visible!important;
  }

  /* Content browser: natural vertical document flow.
     Filters keep intrinsic height; cards follow immediately instead of receiving 2/3 of a huge row. */
  body .lego-app .right-side-shell-v45 .content-browser-mode-v44,
  body .lego-app .right-side-shell-v45 .section-settings-mode-v44{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-right-workspace-v42{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    display:block!important;
    overflow:visible!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-right-workspace-content-v42{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    display:flex!important;
    flex-direction:column!important;
    grid-template-columns:none!important;
    grid-template-rows:none!important;
    overflow:visible!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-selected-slot-v37{
    flex:0 0 auto!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-browser-shell-v37{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    flex:0 0 auto!important;
    overflow:visible!important;
    overscroll-behavior:auto!important;
  }
  body .lego-app .content-browser-mode-v44 .simple-library-scroll,
  body .lego-app .content-browser-mode-v44 .content-library-scroll{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    flex:0 0 auto!important;
    display:block!important;
    overflow:visible!important;
    overscroll-behavior:auto!important;
  }

  /* Settings use the same page scroll model rather than a clipped inner pane. */
  body .lego-app .section-settings-mode-v44 .simple-section-settings,
  body .lego-app .section-settings-mode-v44 .settings-scroll{
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
  }
}
/* The mobile editor deliberately uses a bounded scrolling canvas, but avoid
   scripted smooth-scroll animations fighting touch-driven scrolling. */
@media (max-width:1023.98px){
  .lego-app .canvas-shell,
  .lego-app .aem-side-scroll-v40,
  .lego-app .aem-browser-shell-v37,
  .lego-app .content-library-scroll{
    scroll-behavior:auto!important;
    -webkit-overflow-scrolling:touch!important;
  }
}
`;
  writeFileSync(cssPath,css);
}

console.log('V93 applied: document vertical scroll restored; filters use intrinsic height; content cards remain directly below filters');
