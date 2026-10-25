import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARK='AUTOMATION_DIALOG_TDZ_FIX_V108';
let app=readFileSync(path,'utf8');
if(!app.includes(MARK)){
  const anchor='const AUTOMATION_REPEAT_CLEANUP_V107 = true;';
  if(!app.includes(anchor))throw Error(MARK+': V107 marker missing');
  const from=app.indexOf('function UnifiedAutomationDrawerV69(');
  const to=from>=0?app.indexOf('\nfunction ',from+12):-1;
  if(from<0||to<0)throw Error(MARK+': automation dialog not found');
  let dialog=app.slice(from,to);
  const block=/  const autoFillRepeatV96=[^\n]+;\n  const autoFillCanApplyV96=[^\n]+;\n  const autoFillStatusV96=[^\n]+;/;
  const found=dialog.match(block);
  if(!found)throw Error(MARK+': existing calculation block not found');
  const unsafeIndex=dialog.indexOf(found[0]);
  const invalid=/  const invalidV77=[^\n]+;/;
  const invalidMatch=dialog.match(invalid);
  if(!invalidMatch)throw Error(MARK+': validation definition not found');
  if(unsafeIndex > dialog.indexOf(invalidMatch[0]))throw Error(MARK+': unexpected ordering; review patch');
  dialog=dialog.replace(block,'');
  dialog=dialog.replace(invalid,invalidMatch[0]+'\n'+found[0]);
  const validationPos=dialog.indexOf('  const invalidV77=');
  const statsPos=dialog.indexOf('  const statsV77=');
  const applyPos=dialog.indexOf('  const autoFillCanApplyV96=');
  if(!(statsPos>=0&&statsPos<validationPos&&validationPos<applyPos))throw Error(MARK+': dependencies still used before initialization');
  app=app.slice(0,from)+dialog+app.slice(to);
  app=app.replace(anchor,anchor+'\nconst '+MARK+' = true;');
  writeFileSync(path,app);
}
console.log('V108 applied: automation dialog calculates stats and validation before enabling Apply');
