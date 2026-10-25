import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveFigmaSlotTemplate,makeFigmaSlotSection,inspectFigmaSlots,isCompactVectorDiagram} from '../src/figma-slot-import.mjs';
import {convertFigmaFile} from '../src/figma-bridge.mjs';

const node=(id,name,x,y,w,h,children=[],kind='container')=>({id,name,kind,box:{x,y,w,h},children});
test('12-column Figma mosaic is a native slot grid with shared desktop and mobile indices',()=>{
  const design=node('5:1','Hero / new collection',0,0,1200,600,[
    node('5:2','Slot 1 — hero',0,0,800,600),
    node('5:3','Slot 2 — product',800,0,400,300),
    node('5:4','Slot 3 — product',800,300,400,300),
  ]);
  const result=deriveFigmaSlotTemplate(design);
  assert.equal(result.layoutV2,true);
  assert.equal(result.figmaImportedV100,true);
  assert.equal(result.containers[0].cols,12);
  assert.deepEqual(result.containers[0].slots.map(s=>[s.slotIndex,s.start,s.span,s.rowStart,s.rows]),[
    [0,1,8,1,2],[1,9,4,1,1],[2,9,4,2,1],
  ]);
  assert.equal(result.mobileContainers[0].cols,4);
  assert.deepEqual(result.mobileContainers[0].slots.map(s=>s.slotIndex),[0,1,2]);
});
test('Empty slot templates remain unfilled, editable and compatible with automation',()=>{
  const design=node('7:1','Карточки',0,0,1200,460,[
    node('7:2','Товар 1',0,0,600,460),
    node('7:3','Товар 2',600,0,600,460),
  ]);
  const section=makeFigmaSlotSection(design);
  assert.equal(section.template.containers[0].slots.length,2);
  assert.equal(section.template.containers[0].slots[0].slotIndex,0);
  assert.deepEqual(section.pins,{});
  assert.equal(section.rules.mode,'manual');
  assert.equal(section.figmaNode,undefined);
  assert.equal(section.template.category,'Секция');
});
test('Nested Auto Layout wrappers resolve to cells, not one screenshot layer',()=>{
  const design=node('8:1','Макет',0,0,1200,400,[
    node('8:2','Layout',0,0,1200,400,[
      node('8:3','Фото A',0,0,600,400,[],'shape'),
      node('8:4','Фото B',600,0,600,400,[],'shape'),
    ]),
  ]);
  const output=inspectFigmaSlots(design);
  assert.equal(output.count,2);
  assert.equal(output.desktop[0].span,6);
  assert.equal(output.desktop[1].span,6);
});
test('Named slot hides decorative children from slot discovery',()=>{
  const design=node('9:1','Hero',0,0,1200,480,[
    node('9:2','Slot 1',0,0,1200,480,[node('9:3','Caption',20,20,400,38,[],'text')]),
  ]);
  assert.equal(inspectFigmaSlots(design).count,1);
});
test('Overlapping slots preserve original positions and paint order',()=>{
  const design=node('10:1','Editorial overlap',0,0,1200,600,[
    node('10:2','Slot 1',0,0,800,600),
    node('10:3','Slot 2',400,0,800,600),
  ]);
  const type=deriveFigmaSlotTemplate(design);
  assert.equal(type.containers[0].figmaOverlayV111,true);
  assert.equal(type.mobileContainers[0].figmaOverlayV111,false);
  assert.deepEqual(type.containers[0].figmaFrameV111,{width:1200,height:600});
  const slots=type.containers[0].slots;
  assert.deepEqual(slots.map(s=>s.slotIndex),[0,1]);
  assert.deepEqual(slots.map(s=>s.sourceBox),[
    {x:0,y:0,w:800,h:600},{x:400,y:0,w:800,h:600},
  ]);
  assert.deepEqual(slots.map(s=>s.figmaLayerOrderV111),[0,1]);
  assert.deepEqual(type.mobileContainers[0].slots.map(s=>s.slotIndex),[0,1]);
});
test('Named Figma slots with identical coordinates are two distinct selectable layers',()=>{
  const design=node('o:1','Full overlay',0,0,1200,700,[
    node('o:2','Slot 1',0,0,1200,700),
    node('o:3','Slot 2',0,0,1200,700),
  ]);
  const type=deriveFigmaSlotTemplate(design);
  assert.equal(type.containers[0].slots.length,2);
  assert.equal(type.containers[0].figmaOverlayV111,true);
  assert.deepEqual(type.containers[0].slots.map(s=>s.figmaLayerOrderV111),[0,1]);
});
test('Import handles grid-quantization collision without altering Figma geometry',()=>{
  const design=node('q:1','One-pixel gap',0,0,1200,600,[
    node('q:2','Slot 1',0,0,601,600),
    node('q:3','Slot 2',602,0,598,600),
  ]);
  const type=deriveFigmaSlotTemplate(design);
  assert.equal(type.containers[0].slots.length,2);
  assert.equal(type.containers[0].slots[1].sourceBox.x,602);
});
test('Background shapes do not become content slots',()=>{
  const design=node('11:1','Row',0,0,1200,500,[
    node('11:2','Background',0,0,1200,500,[],'shape'),
    node('11:3','Photo 1',0,0,600,500,[],'shape'),
    node('11:4','Photo 2',600,0,600,500,[],'shape'),
  ]);
  const output=inspectFigmaSlots(design);
  assert.equal(output.count,2);
});
test('Empty frame can become a single full width slot',()=>{
  const design=node('12:1','Hero',0,0,1200,420);
  const result=deriveFigmaSlotTemplate(design);
  assert.equal(result.containers[0].slots.length,1);
  assert.equal(result.containers[0].slots[0].span,12);
});


// Exact compact JSON structure supplied by the user, including nested GRID frames
// and relative x/y coordinates. No id / absoluteBoundingBox / REST wrapper.
const compactFigmaExample=[
  {name:'Frame 5',type:'COMPONENT',x:88,y:-27,width:62,height:51,children:[
    {name:'Frame 2',type:'FRAME',x:0,y:28,width:62,height:23,children:[
      {type:'VECTOR',x:0,y:0,width:20,height:23},
      {type:'VECTOR',x:21,y:0,width:20,height:23},
      {type:'VECTOR',x:42,y:0,width:20,height:23},
    ],layoutMode:'GRID',primaryAxisSizingMode:'FIXED',counterAxisSizingMode:'FIXED',
      primaryAxisAlignItems:'MIN',counterAxisAlignItems:'MIN',
      tailwind:{width:'w-62',height:'h-23',flex:'flex',justifyContent:'justify-start',alignItems:'items-start'}},
    {name:'Frame 1',type:'FRAME',x:0,y:0,width:62,height:25,children:[
      {type:'VECTOR',x:0,y:0,width:19,height:25},
      {type:'VECTOR',x:20,y:0,width:41,height:25},
    ],layoutMode:'GRID',primaryAxisSizingMode:'FIXED',counterAxisSizingMode:'FIXED',
      primaryAxisAlignItems:'MIN',counterAxisAlignItems:'MIN',itemSpacing:1,
      tailwind:{width:'w-62',height:'h-25',flex:'flex gap-1',justifyContent:'justify-start',alignItems:'items-start'}},
  ],layoutMode:'NONE',primaryAxisSizingMode:'AUTO',counterAxisSizingMode:'FIXED',
    primaryAxisAlignItems:'MIN',counterAxisAlignItems:'MIN',
    tailwind:{width:'w-62',height:'h-51',marginLeft:'ml-88',flex:'flex',justifyContent:'justify-start',alignItems:'items-start'}},
];
test('user compact Figma JSON array parses nested relative positions and GRID safely',()=>{
  const doc=convertFigmaFile(compactFigmaExample);
  assert.equal(doc.blocks.length,1);
  const root=doc.blocks[0];
  assert.equal(root.name,'Frame 5');
  assert.deepEqual(root.box,{x:88,y:-27,w:62,h:51});
  assert.equal(root.children[0].layout,'grid');
  assert.deepEqual(root.children[0].box,{x:88,y:1,w:62,h:23});
  assert.deepEqual(root.children[0].children[1].box,{x:109,y:1,w:20,h:23});
  assert.deepEqual(root.children[1].box,{x:88,y:-27,w:62,h:25});
  assert.deepEqual(root.children[1].children[1].box,{x:108,y:-27,w:41,h:25});
  assert.notEqual(root.children[0].children[1].id,root.children[0].children[2].id);
  assert.equal(root.children[0].children[0].sourceType,'VECTOR');
});
test('tiny vector COMPONENT is identified as an icon, not five merchandise slots',()=>{
  const doc=convertFigmaFile(compactFigmaExample);
  assert.throws(()=>inspectFigmaSlots(doc.blocks[0]),/62×51 px похож на иконку/);
});
test('compact JSON with explicitly labeled Frame slots creates native template',()=>{
  const json=[{name:'Editorial',type:'FRAME',x:88,y:-27,width:1200,height:600,
    layoutMode:'GRID',children:[
      {name:'Slot 1',type:'FRAME',x:0,y:0,width:800,height:600,children:[
        {type:'VECTOR',x:20,y:20,width:40,height:40},
      ]},
      {name:'Slot 2',type:'FRAME',x:800,y:0,width:400,height:300,children:[
        {type:'TEXT',x:10,y:10,width:160,height:30,characters:'Sample'},
      ]},
      {name:'Slot 3',type:'FRAME',x:800,y:300,width:400,height:300},
    ],
  }];
  const converted=convertFigmaFile(json);
  const section=makeFigmaSlotSection(converted.blocks[0]);
  assert.deepEqual(section.template.containers[0].slots.map(({start,span,rowStart,rows})=>[start,span,rowStart,rows]),[
    [1,8,1,2],[9,4,1,1],[9,4,2,1],
  ]);
  assert.deepEqual(section.pins,{});
  assert.equal(section.rules.mode,'manual');
  assert.equal(section.template.mobileContainers[0].cols,4);
});


test('tiny Figma icon can be deliberately interpreted as a five-slot 2+3 layout',()=>{
  const doc=convertFigmaFile(compactFigmaExample);
  const frame=doc.blocks[0];
  assert.equal(isCompactVectorDiagram(frame),true);
  const report=inspectFigmaSlots(frame,{interpretMiniature:true});
  assert.equal(report.count,5);
  assert.equal(report.method,'miniature');
  assert.deepEqual(report.desktop.map(s=>[s.start,s.span,s.rowStart,s.rows]),[
    [1,4,1,1],
    [5,8,1,1],
    [1,4,2,1],
    [5,4,2,1],
    [9,4,2,1],
  ]);
  const section=makeFigmaSlotSection(frame,0,{interpretMiniature:true});
  assert.equal(section.rules.mode,'manual');
  assert.deepEqual(section.pins,{});
  assert.equal(section.template.mobileContainers[0].slots.length,5);
});


// The later example includes absoluteRenderBounds + relativeTransform on each
// leaf frame. Absolute coordinates must win over parent offsets.
const detailedFrameExport={
  type:'FRAME',id:'10:13',name:'Frame 8',x:88,y:-27,width:62,height:51,
  visible:true,locked:false,opacity:1,relativeTransform:[[1,0,88],[0,1,-27]],
  absoluteRenderBounds:{x:88,y:-27,width:62,height:51},fillGeometry:[{windingRule:'NONZERO',data:'M0 0 L62 0 L62 51 L0 51 L0 0 Z'}],
  fills:[],strokes:[],effects:[],
  children:[
    {type:'FRAME',id:'2:10',name:'Frame 2',x:0,y:28,width:62,height:23,
      relativeTransform:[[1,0,0],[0,1,28]],absoluteRenderBounds:{x:88,y:1,width:62,height:23},children:[
      {type:'FRAME',id:'10:4',name:'Frame 1',x:0,y:0,width:20,height:23,
        relativeTransform:[[1,0,0],[0,1,0]],absoluteRenderBounds:{x:88,y:1,width:20,height:23},fillGeometry:[{data:'M0 0 L20 0 L20 23 L0 23 Z'}],fills:[],strokes:[],effects:[]},
      {type:'FRAME',id:'10:5',name:'Frame 2',x:21,y:0,width:20,height:23,
        relativeTransform:[[1,0,21],[0,1,0]],absoluteRenderBounds:{x:109,y:1,width:20,height:23},fillGeometry:[{data:'M0 0 L20 0 L20 23 L0 23 Z'}],fills:[],strokes:[],effects:[]},
      {type:'FRAME',id:'10:6',name:'Frame 3',x:42,y:0,width:20,height:23,
        relativeTransform:[[1,0,42],[0,1,0]],absoluteRenderBounds:{x:130,y:1,width:20,height:23},fillGeometry:[{data:'M0 0 L20 0 L20 23 L0 23 Z'}],fills:[],strokes:[],effects:[]},
    ]},
    {type:'FRAME',id:'3:11',name:'Frame 1',x:0,y:0,width:62,height:25,
      relativeTransform:[[1,0,0],[0,1,0]],absoluteRenderBounds:{x:88,y:-27,width:62,height:25},children:[
      {type:'FRAME',id:'10:3',name:'Frame 1',x:0,y:0,width:19,height:25,
        absoluteRenderBounds:{x:88,y:-27,width:19,height:25},relativeTransform:[[1,0,0],[0,1,0]],fills:[],strokes:[]},
      {type:'FRAME',id:'10:2',name:'Frame 2',x:20,y:0,width:41,height:25,
        absoluteRenderBounds:{x:108,y:-27,width:41,height:25},relativeTransform:[[1,0,20],[0,1,0]],fills:[],strokes:[]},
    ]},
  ],
};
test('full user JSON exports five child Frames without double-additive coordinates',()=>{
  const doc=convertFigmaFile(detailedFrameExport);
  assert.equal(doc.blocks.length,1);
  const frame=doc.blocks[0];
  assert.deepEqual(frame.box,{x:88,y:-27,w:62,h:51});
  assert.deepEqual(frame.children[0].box,{x:88,y:1,w:62,h:23});
  assert.deepEqual(frame.children[0].children[2].box,{x:130,y:1,w:20,h:23});
  assert.deepEqual(frame.children[1].children[1].box,{x:108,y:-27,w:41,h:25});
  assert.equal(isCompactVectorDiagram(frame),true);
  assert.throws(()=>inspectFigmaSlots(frame),/миниатюру схемы/);
  const review=inspectFigmaSlots(frame,{interpretMiniature:true});
  assert.equal(review.count,5);
  assert.equal(review.method,'miniature');
  assert.deepEqual(review.desktop.map(s=>[s.name,s.start,s.span,s.rowStart,s.rows]),[
    ['Слот 1',1,4,1,1],
    ['Слот 2',5,8,1,1],
    ['Слот 3',1,4,2,1],
    ['Слот 4',5,4,2,1],
    ['Слот 5',9,4,2,1],
  ]);
  const section=makeFigmaSlotSection(frame,0,{interpretMiniature:true});
  assert.equal(section.template.layoutV2,true);
  assert.deepEqual(section.pins,{});
  assert.equal(section.figmaNode,undefined);
  assert.equal(section.template.mobileContainers[0].cols,4);
});


test('one Section component supports different mobile placement with shared content slot indices',()=>{
  const desktop=node('f:1','Desktop editorial',0,0,1200,600,[
    node('f:2','Slot 1',0,0,800,600),
    node('f:3','Slot 2',800,0,400,300),
    node('f:4','Slot 3',800,300,400,300),
  ]);
  const mobile=node('m:1','Mobile editorial',0,0,375,800,[
    node('m:2','Slot 2',0,0,185,300),
    node('m:3','Slot 3',190,0,185,300),
    node('m:4','Slot 1',0,300,375,500),
  ]);
  const section=makeFigmaSlotSection(desktop,0,{mobileBlock:mobile,name:'Editorial · Новинки'});
  assert.equal(section.template.category,'Секция');
  assert.equal(section.template.componentKind,'Секция');
  assert.equal(section.titles.ru,'Editorial · Новинки');
  assert.equal(section.template.containers[0].cols,12);
  assert.equal(section.template.mobileContainers[0].cols,4);
  assert.deepEqual(section.template.mobileContainers[0].slots.map(x=>x.slotIndex),[1,2,0]);
  assert.deepEqual(section.pins,{});
  assert.equal(section.template.figmaMetaV100.mobileMode,'imported');
  assert.equal(section.template.figmaMetaV100.mobileMapping,'name');
});
test('mobile layout must represent every content slot once',()=>{
  const desktop=node('f:8','Desktop',0,0,1200,400,[
    node('f:9','Slot 1',0,0,600,400),
    node('f:10','Slot 2',600,0,600,400),
  ]);
  const mobile=node('m:8','Mobile',0,0,375,550,[node('m:9','Slot 1',0,0,375,550)]);
  assert.throws(()=>makeFigmaSlotSection(desktop,0,{mobileBlock:mobile}),/Число слотов должно совпадать/);
});


test('Overlapping mobile frames import with same slot bindings, independent layer order',()=>{
  const desktop=node('ov:1','Desktop',0,0,1200,600,[
    node('ov:2','Slot 1',0,0,900,600),
    node('ov:3','Slot 2',400,100,600,350),
  ]);
  const mobile=node('ov:4','Mobile',0,0,390,800,[
    node('ov:5','Slot 2',45,170,300,400),
    node('ov:6','Slot 1',0,0,390,800),
  ]);
  const type=deriveFigmaSlotTemplate(desktop,{mobileBlock:mobile});
  assert.equal(type.containers[0].figmaOverlayV111,true);
  assert.equal(type.mobileContainers[0].figmaOverlayV111,true);
  assert.deepEqual(type.mobileContainers[0].figmaFrameV111,{width:390,height:800});
  // Mobile is sorted by visual position but paints in the original Figma order.
  assert.deepEqual(type.mobileContainers[0].slots.map(s=>s.slotIndex),[0,1]);
  assert.deepEqual(type.mobileContainers[0].slots.map(s=>s.figmaLayerOrderV111),[1,0]);
  assert.deepEqual(type.mobileContainers[0].slots.map(s=>s.sourceBox),[
    {x:0,y:0,w:390,h:800},{x:45,y:170,w:300,h:400},
  ]);
});
