import {readFileSync,writeFileSync} from 'node:fs';
const file='src/AppV3.jsx',marker='AUTOMATION_APPLY_FIX_V104';
let code=readFileSync(file,'utf8');
function expectPatch(a,b,label){if(!code.includes(a))throw Error(marker+': missing '+label);code=code.replace(a,b);}
if(!code.includes(marker)){
  expectPatch('const AUTOFILL_USER_FLOW_V96 = true;','const AUTOFILL_USER_FLOW_V96 = true;\nconst '+marker+' = true;','V96 marker');
  // Repair a major regression: the UI offers "show all" for one section but
  // V77 sends it to the single-section updater, while V68 rejects one-member
  // groups. Both sides must recognize a single repeatable section.
  const start=code.indexOf('function UnifiedAutomationDrawerV69(');
  const end=start>=0?code.indexOf('\nfunction ',start+12):-1;
  if(start<0||end<0)throw Error(marker+': automation drawer not found');
  let drawer=code.slice(start,end);
  const saveOld="    if(isGroup) onApplyGroup?.(normalized,memberIdsV77,{mode:showAllV77?'full':'incremental',groupId:existingGroup?.groupId||null});\n    else onApplySingle?.(normalized,memberIdsV77[0]||targetSection.id);";
  const saveNew="    if(isGroup||showAllV77) onApplyGroup?.(normalized,memberIdsV77,{mode:showAllV77?'full':'incremental',groupId:existingGroup?.groupId||null});\n    else onApplySingle?.(normalized,memberIdsV77[0]||targetSection.id);";
  if(!drawer.includes(saveOld))throw Error(marker+': original save dispatcher changed');
  drawer=drawer.replace(saveOld,saveNew);
  const canOld="const autoFillCanApplyV96=!invalidV77&&previewV88.pool>0&&freeSlotsV86>0;";
  if(!drawer.includes(canOld))throw Error(marker+': validation model missing');
  drawer=drawer.replace(canOld,"const autoFillCanApplyV96=!invalidV77&&statsV77.capacity>0;");
  const ctaOld="{isGroup?'Заполнить '+memberIdsV77.length+' секции':showAllV77?'Создать и заполнить секции':'Заполнить секцию'}";
  if(!drawer.includes(ctaOld))throw Error(marker+': CTA anchor missing');
  drawer=drawer.replace(ctaOld,"{previewV88.pool===0?'Сохранить правило':isGroup?'Применить к '+memberIdsV77.length+' секциям':showAllV77?'Создать и заполнить секции':'Применить к секции'}");
  const footerOld="{autoFillCanApplyV96?'Можно применить к странице':autoFillStatusV96.title}";
  if(!drawer.includes(footerOld))throw Error(marker+': footer anchor missing');
  drawer=drawer.replace(footerOld,"{!autoFillCanApplyV96?autoFillStatusV96.title:previewV88.pool===0?'Правило сохранится без товаров, пока отбор пуст':'Готово к применению'}");
  code=code.slice(0,start)+drawer+code.slice(end);
  // A repeatable single section is a valid automation group (one source).
  // Avoid accidentally constructing a group with no source sections.
  expectPatch("if(uniqueIds.length<2){ setToast('Для авто-группы выберите минимум 2 секции'); window.setTimeout(()=>setToast(''),1500); return; }",
    "if(uniqueIds.length<1){ setToast('Выберите хотя бы одну секцию'); window.setTimeout(()=>setToast(''),2000); return; }",'single source repeat');
  const groupMarker="sourceSectionIdsV68:uniqueIds,repeatPlanV68,colorToken";
  expectPatch(groupMarker,"sourceSectionIdsV68:uniqueIds,repeatSingleV76:uniqueIds.length===1,repeatPlanV68,colorToken",'single repeat metadata');
  writeFileSync(file,code);
}
console.log('V104 applied: single-section automation repetition and explicit save behavior');
