import React from 'react';
import {renderToString} from 'react-dom/server';
import {createServer} from 'vite';
// Render the REAL analytics mode (rather than only the default/closed editor).
if(typeof globalThis.window==='undefined')globalThis.window={setTimeout,clearTimeout,addEventListener(){},removeEventListener(){},dispatchEvent(){return true;}};
if(typeof globalThis.document==='undefined')globalThis.document={body:{},documentElement:{},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){},removeEventListener(){}};
if(typeof globalThis.CustomEvent==='undefined')globalThis.CustomEvent=class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}};
const server=await createServer({
 plugins:[{
   name:'merch-page-analytics-smoke-v120',enforce:'pre',
   transform(code,id){
     if(!id.replaceAll('\\','/').endsWith('/src/AppV3.jsx'))return null;
     const needle='const [analyticsModeV120,setAnalyticsModeV120]=useState(false);';
     if(!code.includes(needle))throw Error('V120 analytics toggle missing from AppV3');
     return code.replace(needle,'const [analyticsModeV120,setAnalyticsModeV120]=useState(true);');
   }
 }],
 server:{middlewareMode:true},appType:'custom',logLevel:'silent'
});
try{
 const app=await server.ssrLoadModule('/src/AppV3.jsx');
 const html=renderToString(React.createElement(app.default));
 for(const needle of ['merch-analytics-inspector-v120','merch-analytics-section-strip-v120','merch-analytics-slot-badge-v120','merch-analytics-section-report-v122','merch-analytics-slot-button-v122','Качество наполнения','Демо-метрики','ДАННЫЕ ВИТРИНЫ']){
   if(!html.includes(needle))throw Error('Missing analytical UI in live page: '+needle);
 }
 if(html.includes('Симулированные события, не измерения магазина'))throw Error('Simulation unexpectedly enabled by default');
 if(html.includes('inline-section-appearance-v121'))throw Error('Authoring style controls leaked into analytics mode');
 console.log('V120 runtime smoke passed: real editor renders analytics inspector, section strips and slot controls ('+html.length+' chars)');
}catch(error){
 console.error('V120 ANALYTICS MODE FAILED');
 console.error(error?.stack||error);
 process.exitCode=1;
}finally{await server.close();}
