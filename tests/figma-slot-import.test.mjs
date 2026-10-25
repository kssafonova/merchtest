import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveFigmaSlotTemplate,makeFigmaSlotSection,inspectFigmaSlots} from '../src/figma-slot-import.mjs';

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
  assert.equal(section.template.category,'Макеты из Figma');
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
test('Overlapping slots are rejected instead of silently breaking the layout',()=>{
  const design=node('10:1','Bad layout',0,0,1200,600,[
    node('10:2','Slot 1',0,0,800,600),
    node('10:3','Slot 2',400,0,800,600),
  ]);
  assert.throws(()=>deriveFigmaSlotTemplate(design),/пересекаются/);
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
