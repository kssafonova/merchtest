import { readFileSync, writeFileSync } from 'node:fs';

const cssPath = 'src/appv3.css';
let css = readFileSync(cssPath, 'utf8');

if (!css.includes('/* center-canvas-scroll-v51 */')) {
  css += String.raw`
/* center-canvas-scroll-v51 */
/* The middle authoring canvas owns its vertical scroll. Side panels remain normal-flow columns. */
.builder-workspace{
  align-items:start!important;
  overflow:visible!important;
}

.canvas-shell{
  align-self:start!important;
  height:calc(100vh - 72px)!important;
  max-height:calc(100vh - 72px)!important;
  min-height:520px!important;
  overflow-x:auto!important;
  overflow-y:auto!important;
  overscroll-behavior:contain!important;
  scrollbar-width:thin!important;
  scroll-behavior:smooth!important;
  -webkit-overflow-scrolling:touch!important;
}

/* Do not constrain the document inside the scroll container. */
.canvas-shell>.storefront-frame,
.canvas-shell .storefront-page,
.canvas-shell .storefront-main,
.canvas-shell .main-canvas,
.canvas-shell .main-canvas-body{
  height:auto!important;
  max-height:none!important;
  min-height:max-content!important;
  overflow:visible!important;
}

/* Keep the page itself taller than the viewport when sections require it. */
.canvas-shell .storefront-frame{
  margin-bottom:32px!important;
}

/* Preview uses the same vertical scrolling behavior. */
.preview-mode .canvas-shell{
  height:calc(100vh - 72px)!important;
  max-height:calc(100vh - 72px)!important;
  overflow-x:auto!important;
  overflow-y:auto!important;
}

@media (min-width:768px) and (max-width:1023.98px){
  .canvas-shell{
    height:72vh!important;
    max-height:72vh!important;
    min-height:560px!important;
    overflow-y:auto!important;
  }
}

@media (max-width:767.98px){
  .canvas-shell{
    height:72vh!important;
    max-height:72vh!important;
    min-height:480px!important;
    overflow-x:auto!important;
    overflow-y:auto!important;
  }
}
`;
  writeFileSync(cssPath, css);
}

console.log('Center canvas scroll v51 applied: middle editing area now scrolls vertically');
