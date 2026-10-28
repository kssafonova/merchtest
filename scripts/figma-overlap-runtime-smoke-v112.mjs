import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
import {deriveFigmaSlotTemplate} from '../src/figma-slot-import.mjs';

// A production build can pass while the special overlapping canvas fails to render.
// Render the actual SectionCanvas with two overlapping Figma layers.
const server=await createServer({
  plugins:[{name:'figma-overlap-smoke-v112',enforce:'pre',transform(source,id){
    if(!id.replaceAll('\\','/').endsWith('/src/AppV3.jsx'))return null;
    return source+'\nexport { SectionCanvas as __FigmaOverlapCanvasV112 };\n';
  }}],
  server:{middlewareMode:true},appType:'custom',logLevel:'silent'
});
try{
  const mod=await server.ssrLoadModule('/src/AppV3.jsx');
  const block={id:'F:1',name:'Overlapping feature',kind:'container',box:{x:0,y:0,w:1200,h:600},children:[
    {id:'F:2',name:'Slot 1',kind:'container',box:{x:0,y:0,w:900,h:600},children:[]},
    {id:'F:3',name:'Slot 2',kind:'container',box:{x:300,y:90,w:650,h:420},children:[]},
  ]};
  const template=deriveFigmaSlotTemplate(block);
  if(!template.containers[0].figmaOverlayV111)throw Error('Template is missing overlap flag');
  const section={id:'S-TEST',template,typeId:template.id,titles:{ru:'Наложение'},
    rules:{mode:'manual'},pins:{},resolvedSlots:[{index:0,status:'empty',entity:null},{index:1,status:'empty',entity:null}]};
  for(const device of ['desktop','mobile']){
    const html=renderToString(React.createElement(mod.__FigmaOverlapCanvasV112,{
      section,locale:'ru',region:'RU',device,selected:true,editable:true,
      onSelect(){},onPin(){},onUnpin(){},onDuplicate(){},onDelete(){},onSectionDragStart(){},onSectionDrop(){}
    }));
    if(!html.includes('Наложение'))throw Error('Canvas lost title on '+device);
    for(const control of ['inline-section-appearance-v121','Оформление','Сверху','Снизу','Скрыть элементы']){
      if(!html.includes(control))throw Error('V121 inline section control missing ('+device+'): '+control);
    }
    if(device==='desktop'){
      if(!html.includes('figma-overlay-grid-v111'))throw Error('Desktop overlap canvas missing');
      if(!html.includes('--figma-x-v111'))throw Error('Desktop absolute slot geometry missing');
      if(!html.includes('Слои Figma'))throw Error('Layer selector missing');
    }else if(html.includes('figma-overlay-grid-v111'))
      throw Error('Automatic mobile layout should not be forced into overlap');
  }
  // V121: no accidental reset of existing section style values after introducing split padding.
  const styled={...section,styleV57:{background:'#F4E7D5',textColor:'#17253A',padding:24,paddingTop:72,paddingBottom:8,hideElements:true}};
  const styledHtml=renderToString(React.createElement(mod.__FigmaOverlapCanvasV112,{
    section:styled,locale:'ru',region:'RU',device:'desktop',selected:true,editable:true,
    onSelect(){},onPin(){},onUnpin(){},onDuplicate(){},onDelete(){},onSectionDragStart(){},onSectionDrop(){}
  }));
  for(const expected of ['data-hide-elements-v121="true"','padding-top:72px','padding-bottom:8px','#F4E7D5','#17253A']){
    if(!styledHtml.includes(expected))throw Error('V121 live section style not reflected in render: '+expected);
  }
  const previewHtml=renderToString(React.createElement(mod.__FigmaOverlapCanvasV112,{
    section:styled,locale:'ru',region:'RU',device:'desktop',selected:true,editable:false,
    onSelect(){},onPin(){},onUnpin(){},onDuplicate(){},onDelete(){},onSectionDragStart(){},onSectionDrop(){}
  }));
  if(previewHtml.includes('inline-section-appearance-v121'))throw Error('V121 style controls leaked into preview');
  console.log('V112/V121 runtime smoke passed: Figma overlaps, inline appearance, split padding, visibility and preview isolation');
}catch(error){
  console.error('V112 FIGMA OVERLAP RENDER FAILED');
  console.error(error?.stack||error);
  process.exitCode=1;
}finally{await server.close();}
