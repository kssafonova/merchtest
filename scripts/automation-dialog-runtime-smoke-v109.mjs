import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';

// This smoke test renders the ACTUAL automation editor with seeded section
// props. The ordinary V75 smoke covers only the closed-editor initial page.
const source=readFileSync('src/AppV3.jsx','utf8');
const defAt=source.indexOf('function UnifiedAutomationDrawerV69(');
const limit=source.indexOf('\nfunction ',defAt+12);
if(defAt<0||limit<0)throw Error('Automation smoke: editor definition missing');
const dialog=source.slice(defAt,limit);
function pos(text){const i=dialog.indexOf(text);if(i<0)throw Error('Automation smoke: missing '+text);return i;}
const dependencies=['const statsV77=','const invalidV77=','const autoFillRepeatV96=','const autoFillCanApplyV96=','const autoFillStatusV96='];
for(let i=1;i<dependencies.length;i++){
  if(pos(dependencies[i-1])>=pos(dependencies[i]))
    throw Error('Automation smoke: '+dependencies[i]+' evaluated before dependency '+dependencies[i-1]);
}

const server=await createServer({
  plugins:[{
    name:'automation-dialog-render-v109',enforce:'pre',
    transform(code,id){
      if(!id.replaceAll('\\','/').endsWith('/src/AppV3.jsx'))return null;
      const portalImport="import { createPortal } from 'react-dom';";
      if(!code.includes(portalImport))throw Error('Automation smoke: ReactDOM portal import changed');
      return code.replace(portalImport,'const createPortal = (children) => children;')
        +'\nexport {UnifiedAutomationDrawerV69 as __AutomationDialogSmokeV109,TYPE_LIBRARY as __TypeFixturesV109};\n';
    },
  }],
  server:{middlewareMode:true},appType:'custom',logLevel:'silent',
});
try{
  const mod=await server.ssrLoadModule('/src/AppV3.jsx');
  const template=mod.__TypeFixturesV109.find(t=>t.layoutV2)||mod.__TypeFixturesV109[0];
  const section={id:'S-SMOKE-108',template,pins:{},rules:{mode:'manual'},titles:{ru:'Smoke-секция'}};
  const html=renderToString(React.createElement(mod.__AutomationDialogSmokeV109,{
    targetSection:section,allSections:[section],selectedIds:[section.id],
    region:'RU',pageId:'home',currentPage:{names:{ru:'Главная'}},
    onApplySingle(){},onApplyGroup(){},onClose(){},
  }));
  if(!html.includes('Автонаполнение')&&!html.includes('Авто-наполнение'))
    throw Error('Automation smoke: rules editor did not render');
  for(const label of ['Какие товары показывать?','Где разместить товары?','Что получится','Дополнительные настройки']){
    if(!html.includes(label))throw Error('Automation smoke: simplified CJM missing '+label);
  }
  console.log('V109 runtime smoke passed: automation dialog rendered '+html.length+' chars');
}catch(error){
  console.error('V109 AUTOMATION OPEN FAILED');
  console.error(error?.stack||error);
  process.exitCode=1;
}finally{await server.close();}
