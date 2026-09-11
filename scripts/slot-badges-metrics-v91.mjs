import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
const MARKER='SLOT_BADGES_METRICS_V91';
let app=readFileSync(appPath,'utf8');

if(!app.includes(MARKER)){
  const anchor='const UI_LAYOUT_STABILITY_V90 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V90 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // Remove the redundant text shown after a slot is selected for content placement.
  // Keep the selected-slot state itself: it is still needed to route the next content click.
  const redundantSelectionCopy=[
    'Выбран для контента',
    'выбран для контента',
    'Выбран для добавления контента',
    'выбран для добавления контента',
    'Слот выбран для контента',
    'слот выбран для контента',
  ];
  redundantSelectionCopy.forEach((copy)=>{ app=app.replaceAll(copy,''); });
  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* slot-badges-metrics-v91 */')){
  css+=String.raw`
/* slot-badges-metrics-v91 */
/* 1. Selected slot: the state remains visible through selection/outline; the instructional sentence is noise. */
.aem-selected-slot-v37 small{display:none!important}
.aem-selected-slot-v37{min-height:32px!important;padding-top:6px!important;padding-bottom:6px!important}

/* 2. PIN / AUTO are operational states, so they stay visible even though legacy slot headers are hidden. */
.lego-slot.filled .slot-head{display:contents!important}
.lego-slot.filled .slot-head>span{display:none!important}
.lego-slot.filled .slot-head>em{
  position:absolute!important;
  top:8px!important;
  right:44px!important;
  z-index:44!important;
  min-width:38px!important;
  height:24px!important;
  padding:0 8px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid #111!important;
  border-radius:4px!important;
  background:#111!important;
  color:#fff!important;
  box-shadow:0 2px 8px rgba(0,0,0,.18)!important;
  font-size:8px!important;
  line-height:1!important;
  font-style:normal!important;
  font-weight:800!important;
  letter-spacing:.08em!important;
  text-transform:uppercase!important;
  pointer-events:none!important;
}
.lego-slot.filled .slot-head>em.auto{
  border:1.5px solid #111!important;
  background:rgba(255,255,255,.96)!important;
  color:#111!important;
  box-shadow:0 2px 8px rgba(0,0,0,.14)!important;
}
/* Fallback for slot implementations where the status class survives but the old header does not. */
.lego-slot.pin:not(:has(.slot-head>em))::before,
.lego-slot.auto:not(:has(.slot-head>em))::before{
  position:absolute!important;
  top:8px!important;
  right:44px!important;
  z-index:44!important;
  min-width:38px!important;
  height:24px!important;
  padding:0 8px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border-radius:4px!important;
  font-size:8px!important;
  line-height:1!important;
  font-weight:800!important;
  letter-spacing:.08em!important;
  text-transform:uppercase!important;
  pointer-events:none!important;
  box-sizing:border-box!important;
}
.lego-slot.pin:not(:has(.slot-head>em))::before{content:'PIN';background:#111!important;color:#fff!important;border:1px solid #111!important;box-shadow:0 2px 8px rgba(0,0,0,.18)!important}
.lego-slot.auto:not(:has(.slot-head>em))::before{content:'AUTO';background:rgba(255,255,255,.96)!important;color:#111!important;border:1.5px solid #111!important;box-shadow:0 2px 8px rgba(0,0,0,.14)!important}

/* 3. Commercial signals on content cards: larger, higher contrast, still visually quiet. */
.content-card-v47 .content-metric-overlay-v47.library-overlay-v47{right:8px!important;bottom:8px!important;gap:5px!important}
.content-card-v47 .content-metric-overlay-v47.library-overlay-v47>span{
  min-width:88px!important;
  height:27px!important;
  padding:0 8px!important;
  grid-template-columns:7px minmax(0,1fr) auto!important;
  gap:6px!important;
  background:rgba(255,255,255,.97)!important;
  border:1px solid rgba(17,17,17,.28)!important;
  border-radius:4px!important;
  box-shadow:0 2px 9px rgba(0,0,0,.14)!important;
  backdrop-filter:blur(10px)!important;
}
.content-card-v47 .content-metric-overlay-v47.library-overlay-v47>span i{
  width:7px!important;
  height:7px!important;
  box-shadow:0 0 0 2px rgba(255,255,255,.9)!important;
}
.content-card-v47 .content-metric-overlay-v47.library-overlay-v47 em{
  font-size:7px!important;
  font-weight:700!important;
  letter-spacing:.05em!important;
  color:#454545!important;
}
.content-card-v47 .content-metric-overlay-v47.library-overlay-v47 b{
  font-size:10px!important;
  font-weight:800!important;
  color:#111!important;
}
.content-card-v47:hover .content-metric-overlay-v47.library-overlay-v47>span{border-color:rgba(17,17,17,.44)!important;box-shadow:0 3px 12px rgba(0,0,0,.17)!important}

@media(max-width:680px){
  .lego-slot.filled .slot-head>em,
  .lego-slot.pin:not(:has(.slot-head>em))::before,
  .lego-slot.auto:not(:has(.slot-head>em))::before{top:6px!important;right:38px!important;height:22px!important;min-width:34px!important;padding:0 6px!important;font-size:7px!important}
  .content-card-v47 .content-metric-overlay-v47.library-overlay-v47>span{min-width:82px!important;height:25px!important;padding:0 7px!important}
}
`;
  writeFileSync(cssPath,css);
}
console.log('V91 applied: redundant selected-slot copy removed, PIN/AUTO badges emphasized, stock/L7D chips strengthened');
