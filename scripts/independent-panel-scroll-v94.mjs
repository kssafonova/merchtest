import { readFileSync, writeFileSync } from 'node:fs';

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');

if (!css.includes('/* independent-panel-scroll-v94 */')) {
  css += String.raw`
/* independent-panel-scroll-v94 */
/* Desktop editor: exactly three independent vertical scroll areas:
   left structure, central storefront, and right content/settings.
   The browser document itself must not be the scroll container. */
@media (min-width:1025px) {
  html, body, #root {
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    overflow:hidden!important;
  }

  .lego-app {
    display:flex!important;
    flex-direction:column!important;
    height:100vh!important;
    height:100dvh!important;
    min-height:0!important;
    max-height:100dvh!important;
    overflow:hidden!important;
    touch-action:auto!important;
  }
  .lego-app > .editor-header-v43 {
    flex:0 0 auto!important;
  }
  .lego-app > .builder-workspace {
    display:grid!important;
    flex:1 1 0!important;
    height:0!important;
    min-height:0!important;
    max-height:none!important;
    grid-template-rows:minmax(0,1fr)!important;
    align-items:stretch!important;
    overflow:hidden!important;
  }

  /* Left panel: fixed shell, tree/resources scroll below its header and search. */
  .lego-app .builder-workspace > .aem-author-side-panel-v40.open {
    position:static!important;
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    align-self:stretch!important;
    overflow:hidden!important;
  }
  .lego-app .aem-author-side-panel-v40 .aem-side-content-v40 {
    display:grid!important;
    grid-template-rows:auto auto minmax(0,1fr)!important;
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    overflow:hidden!important;
  }
  .lego-app .aem-author-side-panel-v40 .aem-side-scroll-v40 {
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior-y:contain!important;
    scroll-behavior:auto!important;
    scrollbar-width:thin!important;
  }

  /* Center viewport has its own vertical and, when necessary, horizontal scroll. */
  .lego-app .builder-workspace > .canvas-shell {
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    align-self:stretch!important;
    overflow-x:auto!important;
    overflow-y:auto!important;
    overscroll-behavior-x:contain!important;
    overscroll-behavior-y:contain!important;
    scroll-behavior:auto!important;
    scrollbar-width:thin!important;
    -webkit-overflow-scrolling:touch!important;
  }

  /* Right shell is fixed-height; its content pane owns the vertical scroll.
     The navigation rail stays in place alongside the scrolling content. */
  .lego-app .builder-workspace > .right-side-shell-v45 {
    position:static!important;
    display:grid!important;
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    align-self:stretch!important;
    grid-template-rows:minmax(0,1fr)!important;
    overflow:hidden!important;
  }
  .lego-app .right-side-shell-v45 > .right-edge-rail-v44 {
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    overscroll-behavior-y:contain!important;
  }
  body .lego-app .right-side-shell-v45 > .aem-properties-panel-v40 {
    height:100%!important;
    min-height:0!important;
    max-height:100%!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior-y:contain!important;
    scroll-behavior:auto!important;
    scrollbar-width:thin!important;
  }

  /* Keep filters followed by cards in natural flow inside the RIGHT scroller.
     Do not restore nested 1fr/2fr viewport rows or inner competing scrollbars. */
  body .lego-app .right-side-shell-v45 .content-browser-mode-v44,
  body .lego-app .right-side-shell-v45 .section-settings-mode-v44 {
    min-height:0!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-right-workspace-v42 {
    flex:0 0 auto!important;
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    display:block!important;
    overflow:visible!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-right-workspace-content-v42 {
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    display:flex!important;
    flex-direction:column!important;
    grid-template-rows:none!important;
    overflow:visible!important;
  }
  body .lego-app .content-browser-mode-v44 .aem-browser-shell-v37,
  body .lego-app .content-browser-mode-v44 .simple-library-scroll,
  body .lego-app .content-browser-mode-v44 .content-library-scroll,
  body .lego-app .section-settings-mode-v44 .simple-section-settings,
  body .lego-app .section-settings-mode-v44 .settings-scroll {
    height:auto!important;
    min-height:0!important;
    max-height:none!important;
    overflow:visible!important;
    overscroll-behavior:auto!important;
    scroll-behavior:auto!important;
  }
}
`;
  writeFileSync(cssPath, css);
}

console.log('V94 applied: left, center and right independently scroll on desktop');
