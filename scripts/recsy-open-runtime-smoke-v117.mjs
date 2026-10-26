import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
const server=await createServer({
  plugins:[{name:'recsy-open-runtime-v117',enforce:'pre',transform(code,id){
    if(!id.replaceAll('\\','/').endsWith('/src/PersonalizationPanelV115.jsx'))return null;
    const source="import {createPortal} from 'react-dom';";
    if(!code.includes(source))throw Error('RecSys panel portal import changed');
    return code.replace(source,'const createPortal = (children) => children;');
  }}],
  server:{middlewareMode:true},appType:'custom',logLevel:'silent',
});
const before=globalThis.document;
try{
  const {default:Panel}=await server.ssrLoadModule('/src/PersonalizationPanelV115.jsx');
  const template={id:'demo-layout-1',label:'Демо: 3 слота',containers:[{cols:12,slots:[{slotIndex:0,start:1,span:4,rowStart:1,rows:1},{slotIndex:1,start:5,span:4,rowStart:1,rows:1},{slotIndex:2,start:9,span:4,rowStart:1,rows:1}]}]};
  const section={id:'section-smoke',template,typeId:template.id,pins:{},titles:{ru:'Секция предпросмотра'}};
  globalThis.document={};
  const html=renderToString(React.createElement(Panel,{open:true,onClose(){},sections:[section],types:[template],activeId:section.id,context:{intent:'search',pageType:'plp',segment:'returning',content:'product'},history:{},onContext(){},onSave(){},onRemove(){}}));
  for(const needed of ['Варианты витрины','Проверка сценариев','Подбирать автоматически','Применить к секции']){
    if(!html.includes(needed))throw Error('RecSys open smoke: missing '+needed);
  }
  console.log('V117 runtime smoke passed: personalization drawer opens ('+html.length+' chars)');
}catch(error){
  console.error('V117 RecSys drawer render failed',error?.stack||error);
  process.exitCode=1;
}finally{
  if(before===undefined)delete globalThis.document;
  else globalThis.document=before;
  await server.close();
}
