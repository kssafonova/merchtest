import React from 'react';
import {renderToString} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
if(typeof globalThis.window==='undefined')globalThis.window={setTimeout,clearTimeout,addEventListener(){},removeEventListener(){},dispatchEvent(){return true;}};
if(typeof globalThis.document==='undefined')globalThis.document={body:{},documentElement:{},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){},removeEventListener(){}};
if(typeof globalThis.CustomEvent==='undefined')globalThis.CustomEvent=class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}};
const css=readFileSync('src/appv3.css','utf8');
for(const rule of ['/* merch-studio-ux-v123','studio-view-switch-v123','--studio-primary','#27634f','studio-workspace-context-v123']){
 if(!css.includes(rule))throw Error('V123 design token/rule missing: '+rule);
}
async function render(preview=false){
 const server=await createServer({
  plugins:[{name:'merch-studio-mode-v123',enforce:'pre',transform(code,id){
   if(!id.replaceAll('\\','/').endsWith('/src/AppV3.jsx'))return null;
   if(!preview)return null;
   const src='const [previewMode, setPreviewMode] = useState(false);';
   if(!code.includes(src))throw Error('V123 Preview state anchor not found');
   return code.replace(src,'const [previewMode, setPreviewMode] = useState(true);');
  }}],server:{middlewareMode:true},appType:'custom',logLevel:'silent'
 });
 try{
  const mod=await server.ssrLoadModule('/src/AppV3.jsx');
  return renderToString(React.createElement(mod.default));
 }finally{await server.close();}
}
try{
 const editor=await render(false);
 for(const needle of ['studio-view-switch-v123','studio-current-page-v123','studio-workspace-context-v123','Редактор','Просмотр','Аналитика']){
  if(!editor.includes(needle))throw Error('V123 editor missing '+needle);
 }
 const count=(editor.match(/studio-view-item-v123/g)||[]).length;
 if(count!==3)throw Error('V123 expected 3 explicit editor/view/analysis modes, got '+count);
 if(editor.includes('section-header-line'))throw Error('V123 section title unexpectedly shown in editor canvas');
 if(editor.includes('RECSYS_LAYOUT_V115'))throw Error('V123 personalization unexpectedly activated');
 const preview=await render(true);
 if(!preview.includes('studio-view-switch-v123'))throw Error('V123 switching modes disappears in preview');
 if(preview.includes('studio-workspace-context-v123'))throw Error('V123 edit-only context leaked into preview');
 if(preview.includes('inline-section-appearance-v121'))throw Error('V123 editing controls leaked into preview');
 if(preview.includes('section-header-line'))throw Error('V123 section title leaked into preview');
 console.log('V123 runtime smoke passed: 3 mode controls, editor orientation, clean preview ('+editor.length+'/'+preview.length+' chars)');
}catch(error){
 console.error('V123 runtime smoke failed:',error?.stack||error);
 process.exitCode=1;
}
