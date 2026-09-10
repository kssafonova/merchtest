import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='ZARA_LAYOUT_LIBRARY_V73';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

const defs=[
 [1,'Hero',[[1,1,12,1,2]],[[1,1,4,1,2]]],
 [2,'Два равных',[[1,1,6,1,1],[2,7,6,1,1]],[[1,1,4,1,1],[2,1,4,2,1]]],
 [3,'Три равных',[[1,1,4,1,1],[2,5,4,1,1],[3,9,4,1,1]],[[1,1,4,1,1],[2,1,4,2,1],[3,1,4,3,1]]],
 [4,'Четыре товара',[[1,1,3,1,1],[2,4,3,1,1],[3,7,3,1,1],[4,10,3,1,1]],[[1,1,2,1,1],[2,3,2,1,1],[3,1,2,2,1],[4,3,2,2,1]]],
 [5,'Editorial 2/3 + 1/3',[[1,1,8,1,2],[2,9,4,1,2]],[[1,1,4,1,2],[2,1,4,3,1]]],
 [6,'Editorial 1/3 + 2/3',[[1,1,4,1,2],[2,5,8,1,2]],[[2,1,4,1,2],[1,1,4,3,1]]],
 [7,'Большой + два малых справа',[[1,1,8,1,2],[2,9,4,1,1],[3,9,4,2,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1]]],
 [8,'Два малых слева + большой',[[1,1,4,1,1],[2,1,4,2,1],[3,5,8,1,2]],[[3,1,4,1,2],[1,1,2,3,1],[2,3,2,3,1]]],
 [9,'Большой 50% + стек',[[1,1,6,1,2],[2,7,6,1,1],[3,7,6,2,1]],[[1,1,4,1,2],[2,1,4,3,1],[3,1,4,4,1]]],
 [10,'Стек + большой 50%',[[1,1,6,1,1],[2,1,6,2,1],[3,7,6,1,2]],[[3,1,4,1,2],[1,1,4,3,1],[2,1,4,4,1]]],
 [11,'50 / 25 / 25',[[1,1,6,1,1],[2,7,3,1,1],[3,10,3,1,1]],[[1,1,4,1,1],[2,1,2,2,1],[3,3,2,2,1]]],
 [12,'25 / 25 / 50',[[1,1,3,1,1],[2,4,3,1,1],[3,7,6,1,1]],[[3,1,4,1,1],[1,1,2,2,1],[2,3,2,2,1]]],
 [13,'25 / 50 / 25',[[1,1,3,1,1],[2,4,6,1,1],[3,10,3,1,1]],[[2,1,4,1,1],[1,1,2,2,1],[3,3,2,2,1]]],
 [14,'40 / 60 editorial',[[1,1,5,1,2],[2,6,7,1,2]],[[2,1,4,1,2],[1,1,4,3,1]]],
 [15,'60 / 40 editorial',[[1,1,7,1,2],[2,8,5,1,2]],[[1,1,4,1,2],[2,1,4,3,1]]],
 [16,'Асимметрия 5–7 / 7–5',[[1,1,5,1,1],[2,6,7,1,1],[3,1,7,2,1],[4,8,5,2,1]],[[1,1,4,1,1],[2,1,4,2,1],[3,1,4,3,1],[4,1,4,4,1]]],
 [17,'Мозаика 8 + 2×2',[[1,1,8,1,2],[2,9,2,1,1],[3,11,2,1,1],[4,9,2,2,1],[5,11,2,2,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1],[4,1,2,4,1],[5,3,2,4,1]]],
 [18,'2×2 + Hero',[[1,1,2,1,1],[2,3,2,1,1],[3,1,2,2,1],[4,3,2,2,1],[5,5,8,1,2]],[[5,1,4,1,2],[1,1,2,3,1],[2,3,2,3,1],[3,1,2,4,1],[4,3,2,4,1]]],
 [19,'Hero + два товара',[[1,1,12,1,2],[2,1,6,3,1],[3,7,6,3,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1]]],
 [20,'Hero + три товара',[[1,1,12,1,2],[2,1,4,3,1],[3,5,4,3,1],[4,9,4,3,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1],[4,1,4,4,1]]],
 [21,'Hero + четыре товара',[[1,1,12,1,2],[2,1,3,3,1],[3,4,3,3,1],[4,7,3,3,1],[5,10,3,3,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1],[4,1,2,4,1],[5,3,2,4,1]]],
 [22,'Три товара + Hero',[[1,1,4,1,1],[2,5,4,1,1],[3,9,4,1,1],[4,1,12,2,2]],[[1,1,2,1,1],[2,3,2,1,1],[3,1,4,2,1],[4,1,4,3,2]]],
 [23,'Два товара + Hero',[[1,1,6,1,1],[2,7,6,1,1],[3,1,12,2,2]],[[1,1,2,1,1],[2,3,2,1,1],[3,1,4,2,2]]],
 [24,'Центральный акцент',[[1,1,3,1,1],[2,4,6,1,2],[3,10,3,1,1]],[[2,1,4,1,2],[1,1,2,3,1],[3,3,2,3,1]]],
 [25,'Узкий / широкий / узкий',[[1,1,2,1,2],[2,3,8,1,2],[3,11,2,1,2]],[[2,1,4,1,2],[1,1,2,3,1],[3,3,2,3,1]]],
 [26,'Fashion magazine',[[1,1,4,1,2],[2,5,8,1,1],[3,5,4,2,1],[4,9,4,2,1]],[[1,1,4,1,2],[2,1,4,3,1],[3,1,2,4,1],[4,3,2,4,1]]],
 [27,'Magazine reverse',[[1,1,8,1,1],[2,9,4,1,2],[3,1,4,2,1],[4,5,4,2,1]],[[2,1,4,1,2],[1,1,4,3,1],[3,1,2,4,1],[4,3,2,4,1]]],
 [28,'Пять товаров fashion-grid',[[1,1,6,1,2],[2,7,3,1,1],[3,10,3,1,1],[4,7,3,2,1],[5,10,3,2,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1],[4,1,2,4,1],[5,3,2,4,1]]],
 [29,'Editorial story',[[1,1,12,1,2],[2,1,5,3,1],[3,6,7,3,1],[4,1,7,4,1],[5,8,5,4,1]],[[1,1,4,1,2],[2,1,4,3,1],[3,1,4,4,1],[4,1,4,5,1],[5,1,4,6,1]]],
 [30,'ZARA-style mixed wall',[[1,1,6,1,2],[2,7,3,1,1],[3,10,3,1,1],[4,7,6,2,1],[5,1,4,3,1],[6,5,4,3,1],[7,9,4,3,1]],[[1,1,4,1,2],[2,1,2,3,1],[3,3,2,3,1],[4,1,4,4,1],[5,1,2,5,1],[6,3,2,5,1],[7,1,4,6,1]]],
];

const makeContainer=(cols,raw)=>({
  cols,
  rows:Math.max(1,...raw.map(([, , ,row,rows])=>row+(rows||1)-1)),
  columnGap:4,
  rowGap:4,
  container:{mode:'full',width:'100%',maxWidth:null,align:'center',marginLeft:0,marginRight:0,paddingLeft:0,paddingRight:0},
  slots:raw.map(([id,start,span,rowStart,rows])=>({slotIndex:id-1,start,span,rowStart,rows:rows||1})),
});
const layouts=defs.map(([n,name,desktop,mobile])=>({
  id:'LAYOUT-'+n,
  label:n+'. '+name,
  system:true,
  layoutV2:true,
  category:'Макеты',
  description:name+' · Desktop 12 колонок / Mobile 4 колонки',
  tags:['ZARA','12→4','responsive'],
  containers:[makeContainer(12,desktop)],
  mobileContainers:[makeContainer(4,mobile)],
}));

if(!app.includes(MARKER)){
  const anchor='const AUTO_REPEAT_DYNAMIC_COLLAPSE_V72 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V72 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // Replace the generated V2 layout library itself so every picker, preview, canvas and automation clone
  // receives the same canonical 30-layout geometry.
  const libStart=app.indexOf('const SECTION_LAYOUT_LIBRARY_V2 = ');
  const libEnd=libStart>=0?app.indexOf(';\nconst TYPE_LIBRARY',libStart):-1;
  if(libStart<0||libEnd<0) throw new Error(MARKER+': SECTION_LAYOUT_LIBRARY_V2 block missing');
  app=app.slice(0,libStart)+'const SECTION_LAYOUT_LIBRARY_V2 = '+JSON.stringify(layouts)+app.slice(libEnd);

  // Restore explicit mobileContainers. V70's generic mobile normalization is intentionally superseded here.
  const resolverPart=functionChunk(app,'layoutContainersForDeviceV34');
  const resolver=String.raw`function layoutContainersForDeviceV34(type, viewport = 'desktop') {
  const desktop=Array.isArray(type?.containers)?type.containers:[];
  if(viewport!=='mobile') return desktop;
  if(Array.isArray(type?.mobileContainers) && type.mobileContainers.length) return type.mobileContainers;
  let globalIndex=0;
  return desktop.map((container)=>{
    const source=Array.isArray(container?.slots)?container.slots:[];
    const slots=source.map((slot,index)=>{
      const slotIndex=slot?.slotIndex!=null?Number(slot.slotIndex):globalIndex++;
      if(source.length===1) return {...slot,slotIndex,start:1,span:4,rowStart:1,rows:Math.max(1,Number(slot?.rows||1))};
      const row=Math.floor(index/2)+1;
      return {...slot,slotIndex,start:index%2===0?1:3,span:2,rowStart:row,rows:1};
    });
    return {...container,cols:4,rows:Math.max(1,Math.ceil(source.length/2)),columnGap:4,rowGap:4,container:{...(container?.container||{}),mode:'full',width:'100%',maxWidth:null,align:'center',marginLeft:0,marginRight:0,paddingLeft:0,paddingRight:0},slots};
  });
}`;
  app=app.slice(0,resolverPart.start)+resolver+app.slice(resolverPart.end);

  // First-load sample should use the canonical three-equal layout rather than a legacy TYPE-3 preset.
  app=app.replace("initialSection('TYPE-3', { ru: 'Секция', en: 'Section', kk: 'Секция', ar: 'قسم' }, {}, 'manual')","initialSection('LAYOUT-3', { ru: 'Секция', en: 'Section', kk: 'Секция', ar: 'قسم' }, {}, 'manual')");

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* zara-layout-library-v73 */')){
  css+=String.raw`
/* zara-layout-library-v73 */
/* Canonical merchandising grid: desktop 12 columns, mobile 4 columns, Zara-like narrow gutters. */
.builder-section.layout-v2 .section-container{width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;padding-left:0!important;padding-right:0!important;box-sizing:border-box!important}
.builder-section.layout-v2 .slot-grid{width:100%!important;max-width:100%!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;column-gap:4px!important;row-gap:4px!important;align-items:stretch!important}
.storefront-frame.mobile .builder-section.layout-v2 .slot-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;column-gap:4px!important;row-gap:4px!important}
.builder-section.layout-v2 .v2-slot-wrap{min-width:0!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:hidden!important}
.builder-section.layout-v2 .v2-slot-wrap>.lego-slot{width:100%!important;height:100%!important;margin:0!important;box-sizing:border-box!important}
.builder-section.layout-v2 .lego-slot img,.builder-section.layout-v2 .lego-slot video{width:100%!important;height:100%!important;display:block!important;object-fit:cover!important}

/* Previews intentionally mirror the same narrow gutters and 12/4 proportions. */
.layout-photo-grid,.type-preview-grid{column-gap:4px!important;row-gap:4px!important}
.dual-layout-device.desktop .layout-photo-grid,.responsive-type-previews>div:first-child .type-preview-grid{grid-template-columns:repeat(12,minmax(0,1fr))!important}
.dual-layout-device.mobile .layout-photo-grid,.responsive-type-previews>div:last-child .type-preview-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
.type-card .dual-layout-preview-v34{gap:7px!important}.dual-layout-device{gap:4px!important}

/* Media reaches almost to the section edge; author chrome is outside the media geometry. */
.builder-section.layout-v2>.section-containers{width:100%!important;max-width:100%!important}
.storefront-frame.mobile .builder-section.layout-v2>.section-containers{padding-left:0!important;padding-right:0!important}
`;
  writeFileSync(cssPath,css);
}

console.log('V73 applied: exact 30-layout Zara library, desktop 12 cols, mobile 4 cols, explicit mobile order and 4px gutters');
