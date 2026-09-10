import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='AUTO_REPEAT_DYNAMIC_COLLAPSE_V72';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of function '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const MEDIA_PAGER_VERTICAL_V71 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V71 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // Capacity is a property of the actual section layout, never a manual automation input.
  const capacityOld="  const capacity = Math.max(1, Math.min(slotCapacity || 1, Number(rule.distribution.gridCapacity || slotCapacity || 1)));";
  const capacityNew="  const capacity = Math.max(1, slotCapacity || 1);";
  if(!app.includes(capacityOld)) throw new Error(MARKER+': capacity resolver anchor missing');
  app=app.replace(capacityOld,capacityNew);

  // Remove manual grid capacity / repeat-count controls from the rules UI.
  const manualControls='<div className="automation-fields-v63"><label><span>Ёмкость сетки</span><input type="number" min="1" value={rule.distribution.gridCapacity ?? capacity || 1} onChange={(event)=>updateDistribution({gridCapacity:Math.max(1,Number(event.target.value||1))})}/></label><label><span>Макс. повторов</span><input type="number" min="1" max={AUTOMATION_MAX_REPEAT_V63} value={rule.distribution.maxRepeatCount} onChange={(event)=>updateDistribution({maxRepeatCount:Math.max(1,Math.min(AUTOMATION_MAX_REPEAT_V63,Number(event.target.value||1)))})}/></label></div>';
  const automaticHint='<div className="automation-auto-repeat-v72"><Sparkles size={13}/><span><strong>Количество секций рассчитывается автоматически</strong><small>Система использует фактическое число слотов выбранной комбинации и создаёт ровно столько повторов, сколько нужно, чтобы показать все отобранные товары.</small></span></div>';
  if(!app.includes(manualControls)) throw new Error(MARKER+': manual capacity/repeat controls missing');
  app=app.replace(manualControls,automaticHint);

  // Repeat combination: create only the section clones that are really required.
  // The last clone remembers how many product slots it is expected to consume so the renderer can compact it.
  const loopOld=String.raw`      for(let repeatIndex=2;repeatIndex<=totalCycles;repeatIndex+=1){
        for(const source of sourceSections){
          const cloneId=source.id+'-AUTO-'+groupId+'-'+repeatIndex;
          finalIds.push(cloneId);
          repeatClones.push({...source,id:cloneId,pins:{},generatedByAutomationGroupV64:true,automationRepeatIndexV64:repeatIndex,automationRepeatSourceIdV68:source.id,automationGroup:null,groupRuleV63:null});
        }
      }`;
  const loopNew=String.raw`      let remainingToRenderV72=afterFirstCycle;
      for(let repeatIndex=2;repeatIndex<=totalCycles && remainingToRenderV72>0;repeatIndex+=1){
        for(const source of sourceSections){
          if(remainingToRenderV72<=0) break;
          const sourceCapacityV72=Math.max(1,slotCount(source.template));
          const expectedFillV72=Math.min(sourceCapacityV72,remainingToRenderV72);
          const cloneId=source.id+'-AUTO-'+groupId+'-'+repeatIndex;
          finalIds.push(cloneId);
          repeatClones.push({...source,id:cloneId,pins:{},generatedByAutomationGroupV64:true,automationRepeatIndexV64:repeatIndex,automationRepeatSourceIdV68:source.id,automationExpectedFillV72:expectedFillV72,automationPartialRepeatV72:expectedFillV72<sourceCapacityV72,automationGroup:null,groupRuleV63:null});
          remainingToRenderV72=Math.max(0,remainingToRenderV72-expectedFillV72);
        }
      }`;
  if(!app.includes(loopOld)) throw new Error(MARKER+': V68 repeat loop missing');
  app=app.replace(loopOld,loopNew);

  // Resolve-time adaptation: empty slots of a partially filled generated repeat become structural collapses,
  // not visible placeholders. The original authored template remains untouched in page state.
  const resolveReturn='  return (sections || []).map((section)=>result.get(section.id) || resolveSectionV63(section,region,pageContext,null));';
  const resolveReturnNew=String.raw`  const resolvedV72=(sections || []).map((section)=>result.get(section.id) || resolveSectionV63(section,region,pageContext,null));
  return resolvedV72.map((section)=>{
    const repeatRuleV72=normalizeAutomationRuleV63(section?.groupRuleV63 || section?.rules || {},section?.id || 'section');
    if(!section?.generatedByAutomationGroupV64 || repeatRuleV72.distribution.groupStrategy!=='repeat_section_combo') return section;
    const slotsV72=section.resolvedSlots || [];
    const visibleIndexesV72=slotsV72.filter((slot)=>Boolean(slot?.entity)).map((slot)=>Number(slot.index));
    const totalSlotsV72=slotsV72.length;
    const adaptiveV72=visibleIndexesV72.length<totalSlotsV72;
    if(!adaptiveV72) return {...section,adaptiveSlotIndexesV72:visibleIndexesV72,automationAdaptiveRepeatV72:false,automationHiddenRepeatV72:false};
    const visibleSetV72=new Set(visibleIndexesV72);
    const compactSlotsV72=slotsV72.map((slot)=>visibleSetV72.has(Number(slot.index)) ? slot : {...slot,status:'collapsed',entity:null,warning:null});
    const currentRuleV72=section.automationRuleV63 || repeatRuleV72;
    const statusV72={...(currentRuleV72.status || {}),coverage:visibleIndexesV72.length ? 100 : 0,reserveCount:section.reserveV63?.length || 0,lastRecalculatedAt:new Date().toISOString()};
    return {...section,resolvedSlots:compactSlotsV72,adaptiveSlotIndexesV72:visibleIndexesV72,automationAdaptiveRepeatV72:true,automationHiddenRepeatV72:visibleIndexesV72.length===0,automationRuleV63:{...currentRuleV72,status:statusV72}};
  });`;
  if(!app.includes(resolveReturn)) throw new Error(MARKER+': resolver return anchor missing');
  app=app.replace(resolveReturn,resolveReturnNew);

  // Generated partial repeats use only their filled slots. Remaining slots are removed from layout,
  // then the surviving slots are compacted and centered row by row on desktop and mobile.
  const aemPart=functionChunk(app,'aemSectionContainersV36');
  const aemFn=String.raw`function aemCenterAdaptiveSlotsV72(slots,cols){
  if(!slots.length) return [];
  const ordered=[...slots].sort((a,b)=>Number(a.slotIndex||0)-Number(b.slotIndex||0));
  const rows=[];
  let current=[];
  let used=0;
  ordered.forEach((slot)=>{
    const span=Math.max(1,Math.min(cols,Number(slot.span || cols)));
    const next={...slot,span};
    if(current.length && used+span>cols){ rows.push(current); current=[]; used=0; }
    current.push(next); used+=span;
  });
  if(current.length) rows.push(current);
  let rowCursor=1;
  return rows.flatMap((row)=>{
    const totalSpan=Math.min(cols,row.reduce((sum,slot)=>sum+Math.max(1,Number(slot.span||1)),0));
    let start=Math.floor((cols-totalSpan)/2)+1;
    const rowHeight=Math.max(1,...row.map((slot)=>Math.max(1,Number(slot.rows||1))));
    const centered=row.map((slot)=>{
      const next={...slot,start,rowStart:rowCursor};
      start+=Math.max(1,Number(slot.span||1));
      return next;
    });
    rowCursor+=rowHeight;
    return centered;
  });
}

function aemSectionContainersV36(section, device = 'desktop') {
  const base = aemBaseContainersV36(section?.template, device);
  const adaptive = Boolean(section?.generatedByAutomationGroupV64 && section?.automationAdaptiveRepeatV72);
  const visibleSet = adaptive ? new Set((section?.adaptiveSlotIndexesV72 || []).map(Number)) : null;
  let globalIndex = 0;
  return base.map((container) => {
    const cols = Math.max(1, Number(container?.cols || AEM_BREAKPOINTS_V36[device]?.cols || 12));
    const effective = (container?.slots || []).map((slot) => {
      const fallbackIndex = globalIndex;
      globalIndex += 1;
      return aemEffectiveSlotV36(section, device, slot, fallbackIndex, cols);
    });
    let slots = aemPackSlotsV36(container, effective);
    if(visibleSet){
      slots=slots.filter((slot)=>visibleSet.has(Number(slot.slotIndex)));
      slots=aemCenterAdaptiveSlotsV72(slots,cols);
    }
    const rows = Math.max(1, ...slots.map((slot) => Number(slot.rowStart || 1) + Number(slot.rows || 1) - 1));
    return { ...container, cols, rows, slots };
  }).filter((container)=>!visibleSet || container.slots.length>0);
}`;
  app=app.slice(0,aemPart.start)+aemFn+app.slice(aemPart.end);

  // Page-level coverage should not count structurally collapsed slots of the partial final repeat.
  app=app.replace('const slots = resolved.flatMap((s) => s.resolvedSlots);','const slots = resolved.flatMap((s) => (s.resolvedSlots || []).filter((slot)=>!(s.automationAdaptiveRepeatV72 && slot.status===\'collapsed\')));');

  // Make the repeat strategy copy explain its automatic behavior explicitly wherever an older caption survived.
  app=app.replaceAll('<strong>Повтор комбинации</strong><small>Автоматически дублировать комбинацию, пока не покрыты все товары</small>','<strong>Повтор комбинации</strong><small>Система сама создаст нужное число секций и адаптирует последний неполный повтор</small>');
  app=app.replaceAll('<strong>Повтор комбинации</strong><small>До лимита повторов или конца уникальных товаров</small>','<strong>Повтор комбинации</strong><small>Система сама создаст нужное число секций и адаптирует последний неполный повтор</small>');

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* auto-repeat-dynamic-collapse-v72 */')){
  css+=String.raw`
/* auto-repeat-dynamic-collapse-v72 */
.automation-auto-repeat-v72{min-height:54px;margin-top:9px;border:1px solid #d9d9d9;background:#fafafa;padding:10px 11px;display:flex;align-items:flex-start;gap:8px;color:#111}.automation-auto-repeat-v72>svg{margin-top:2px;flex:none}.automation-auto-repeat-v72>span{display:grid;gap:3px}.automation-auto-repeat-v72 strong{font-size:9px;font-weight:600}.automation-auto-repeat-v72 small{font-size:8px;line-height:1.45;color:#777}
/* Partial repeat sections never reserve visual space for collapsed placeholders. */
.builder-section[data-group-id] .v2-slot-wrap:has(.lego-slot.collapsed){display:none!important}
@media(max-width:767.98px){.automation-auto-repeat-v72{padding:9px}.automation-auto-repeat-v72 small{font-size:7.5px}}
`;
  writeFileSync(cssPath,css);
}

console.log('V72 applied: repeat count is automatic; partial generated repeats collapse empty slots and center remaining content');
