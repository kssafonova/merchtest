import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('MCP server advertises the Figma importer and returns editor contract',async()=>{
  const script=fileURLToPath(new URL('../scripts/merchtest-figma-mcp.mjs',import.meta.url));
  const child=spawn(process.execPath,[script],{stdio:['pipe','pipe','pipe'],env:{...process.env,FIGMA_TOKEN:''}});
  let stream='';
  const pending=new Map();
  child.stdout.setEncoding('utf8');
  child.stdout.on('data',chunk=>{
    stream+=chunk;
    let index;
    while((index=stream.indexOf('\n'))>=0){
      const line=stream.slice(0,index);stream=stream.slice(index+1);
      if(!line.trim())continue;
      const payload=JSON.parse(line);
      const callback=pending.get(payload.id);
      if(callback){pending.delete(payload.id);callback(payload);}
    }
  });
  const request=(id,method,params={})=>new Promise((resolve,reject)=>{
    const tm=setTimeout(()=>{pending.delete(id);reject(Error('MCP response timeout: '+method));},4000);
    pending.set(id,data=>{clearTimeout(tm);resolve(data);});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
  try{
    const init=await request(1,'initialize',{protocolVersion:'2025-06-18'});
    assert.equal(init.result.serverInfo.name,'merchtest-figma');
    const tools=await request(2,'tools/list');
    assert.ok(tools.result.tools.some(tool=>tool.name==='figma_to_merchtest'));
    const contract=await request(3,'tools/call',{name:'merchtest_editor_contract',arguments:{}});
    assert.match(contract.result.content[0].text,/merchtest-figma\/v1/);
    const missing=await request(4,'tools/call',{name:'figma_to_merchtest',arguments:{url:'https://www.figma.com/design/Abc123/X'}});
    assert.equal(missing.result.isError,true);
  }finally{
    child.stdin.end();child.kill();
  }
});
