import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFigmaUrl,convertFigmaFile,makeFigmaSection,updateImportedText,FIGMA_FORMAT} from '../src/figma-bridge.mjs';

const textNode={
  type:'TEXT',id:'5:9',name:'Heading',characters:'Новая коллекция',
  absoluteBoundingBox:{x:28,y:32,width:490,height:56},
  style:{fontFamily:'Inter',fontSize:44,fontWeight:700,lineHeightPx:52,textAlignHorizontal:'LEFT'},
  fills:[{type:'SOLID',color:{r:0.12,g:0.2,b:0.32}}],
};
const frame={
  type:'FRAME',id:'5:1',name:'Hero / desktop',
  absoluteBoundingBox:{x:0,y:0,width:1440,height:680},
  layoutMode:'VERTICAL',paddingLeft:28,paddingTop:32,itemSpacing:18,
  fills:[{type:'SOLID',color:{r:1,g:1,b:1}}],
  children:[textNode,{type:'RECTANGLE',id:'5:10',name:'Image',
    absoluteBoundingBox:{x:28,y:120,width:700,height:420},
    fills:[{type:'IMAGE',imageRef:'hash1'}]}],
};
test('Figma URL validation and node-id parsing',()=>{
  assert.deepEqual(parseFigmaUrl('https://www.figma.com/design/AbCD123/My-Page?node-id=5-1'),
    {fileKey:'AbCD123',nodeId:'5:1'});
  assert.throws(()=>parseFigmaUrl('https://example.com/design/file'),/figma.com/);
});
test('Figma REST document becomes native layered blocks',()=>{
  const result=convertFigmaFile({name:'Campaign',
    document:{type:'DOCUMENT',children:[{type:'CANVAS',children:[frame]}]},
    images:{hash1:'data:image/png;base64,aGVsbG8='}
  });
  assert.equal(result.format,FIGMA_FORMAT);
  assert.equal(result.blocks.length,1);
  const node=result.blocks[0];
  assert.equal(node.layout,'column');
  assert.equal(node.children[0].text,'Новая коллекция');
  assert.equal(node.children[0].font.size,44);
  assert.match(node.children[1].image,/^data:image/);
});
test('Node-specific REST results supported',()=>{
  const result=convertFigmaFile({name:'Hero',nodes:{'5:1':{document:frame}}},{nodeId:'5:1'});
  assert.equal(result.blocks.length,1);
  assert.equal(result.blocks[0].name,'Hero / desktop');
});
test('Figma plugin selection and editable sections',()=>{
  const result=convertFigmaFile({name:'Selection',selection:[frame]});
  const section=makeFigmaSection(result.blocks[0]);
  assert.equal(section.template.containers[0].slots.length,1);
  assert.equal(section.rules.mode,'manual');
  const edited=updateImportedText(section.figmaNode,'5:9','Новое название');
  assert.equal(edited.children[0].text,'Новое название');
  assert.equal(section.figmaNode.children[0].text,'Новая коллекция');
});
test('Empty or invalid input safely rejected',()=>{
  assert.throws(()=>convertFigmaFile({document:{type:'DOCUMENT',children:[]}}),/не найдены фреймы/i);
  assert.throws(()=>convertFigmaFile(null),/Некорректный JSON/);
});
