#!/usr/bin/env node
// Minimal MCP stdio server for Figma -> merchtest. No runtime dependencies.
// Run locally with FIGMA_TOKEN in the process environment. Tokens are never
// serialized into editor JSON or passed to the GitHub Pages frontend.
import {createInterface} from 'node:readline';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,join,basename} from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const execFileAsync=promisify(execFile);
const script=fileURLToPath(new URL('./figma-pull.mjs',import.meta.url));
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const write=(payload)=>process.stdout.write(JSON.stringify(payload)+'\n');
const tools=[
  {name:'figma_to_merchtest',description:'Convert a Figma Design frame or file URL into editable merchtest JSON. Requires FIGMA_TOKEN in local environment; returns import file path. No user secrets are sent to the frontend.',inputSchema:{type:'object',properties:{url:{type:'string',description:'https://www.figma.com/design/... optionally with node-id'},output_name:{type:'string',description:'Optional output filename (basename only), e.g. hero.json'}},required:['url'],additionalProperties:false}},
  {name:'merchtest_editor_contract',description:'Read the editor component contract for turning Figma frames into native, independently editable merchtest sections.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
];
const ok=(value)=>({content:[{type:'text',text:typeof value==='string'?value:JSON.stringify(value,null,2)}]});
const bad=(text)=>({isError:true,content:[{type:'text',text}]});
async function callTool(name,args={}){
  if(name==='merchtest_editor_contract')return ok({
    format:'merchtest-figma/v1',
    component:'FigmaImportedLayout',
    sections:'makeFigmaSection(block,index)',
    frame:'container | text | rectangle | ellipse',
    layout:'HORIZONTAL -> flex row, VERTICAL -> flex column, NONE -> positioned layers',
    edit:'Text layers can be edited on canvas; sections can be selected, moved, copied, removed.',
    import:'Drop exported .json on canvas, or use editor toolbar -> Из Figma.',
    warnings:'No code execution from imported JSON. Interaction logic, responsive breakpoints and complex vectors require review.',
  });
  if(name!=='figma_to_merchtest')return bad('Unknown MCP tool: '+name);
  if(typeof args.url!=='string')return bad('Provide a Figma Design URL in "url".');
  if(!process.env.FIGMA_TOKEN)return bad('Set FIGMA_TOKEN in the MCP server environment. Never commit a token to GitHub.');
  const namePart=(typeof args.output_name==='string'?basename(args.output_name):'figma-import.json').replace(/[^A-Za-z0-9._-]/g,'').slice(0,80);
  const file=join(root,'imports',namePart.toLowerCase().endsWith('.json')?namePart:namePart+'.json');
  try{
    const {stdout}=await execFileAsync(process.execPath,[script,args.url,'--out',file],{cwd:root,env:process.env,maxBuffer:512000,timeout:120000});
    const saved=JSON.parse(await readFile(file,'utf8'));
    return ok({status:'created',path:file,file:basename(file),source:saved.source,frames:saved.blocks?.length||0,notes:stdout.trim(),nextStep:'Open https://kssafonova.github.io/merchtest/ and drop this JSON on the canvas to import it.'});
  }catch(error){return bad('Figma import failed: '+(error?.stderr||error?.message||String(error)).slice(0,700));}
}
async function onMessage(message){
  if(!message||typeof message!=='object')return;
  if(typeof message.id==='undefined')return;
  const reply=(result)=>write({jsonrpc:'2.0',id:message.id,result});
  const fail=(code,msg)=>write({jsonrpc:'2.0',id:message.id,error:{code,message:msg}});
  try{
    switch(message.method){
      case 'initialize':reply({protocolVersion:message.params?.protocolVersion||'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'merchtest-figma',version:'1.0.0'}});break;
      case 'ping':reply({});break;
      case 'tools/list':reply({tools});break;
      case 'tools/call':reply(await callTool(message.params?.name,message.params?.arguments||{}));break;
      case 'resources/list':reply({resources:[]});break;
      default:fail(-32601,'Method not found: '+message.method);
    }
  }catch(error){fail(-32603,String(error?.message||error));}
}
const rl=createInterface({input:process.stdin,crlfDelay:Infinity});
rl.on('line',(line)=>{try{onMessage(JSON.parse(line));}catch(error){process.stderr.write('MCP invalid message: '+error.message+'\n');}});
