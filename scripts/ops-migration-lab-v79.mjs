import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
const cssPath='src/appv3.css';
let app=readFileSync(appPath,'utf8');
const MARKER='OPS_MIGRATION_LAB_V79';

if(!app.includes(MARKER)){
  const anchor='const MOBILE_LAYOUT_STABILITY_V78 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V78 marker missing');

  const helpers=String.raw`
const OPS_MIGRATION_LAB_V79 = true;
const OPS_TASK_TYPES_V79 = [
  ['section_create','Создание секции'],
  ['section_edit','Редактирование секции'],
  ['automation_single','Автоматизация секции'],
  ['automation_group','Автоматизация группы'],
  ['editorial','Editorial-вход'],
  ['look_edit','Создание / редактирование образа'],
  ['media_edit','Медиа / rich-content'],
  ['seo','SEO страницы'],
  ['region_localization','Регион / локализация'],
  ['publish','Публикация / контроль'],
  ['migration_check','Проверка миграции'],
];
function opsTaskLabelV79(key){ return OPS_TASK_TYPES_V79.find(([value])=>value===key)?.[1] || key; }
function opsElementLabelV79(target){
  if(!target) return '';
  const node=target.closest?.('button,input,select,textarea,label,[role="button"]') || target;
  return String(node.getAttribute?.('aria-label') || node.getAttribute?.('title') || node.getAttribute?.('placeholder') || node.innerText || node.value || node.className || node.tagName || '').replace(/\s+/g,' ').trim().slice(0,140);
}
function opsActionKindV79(target,label,eventType){
  const text=String(label||'').toLowerCase();
  const cls=String(target?.className||'').toLowerCase();
  if(text.includes('опубликов')) return 'publish';
  if(text.includes('отменить')||cls.includes('undo')) return 'undo';
  if(text.includes('повторить')||cls.includes('redo')) return 'redo';
  if(text.includes('mobile')||text.includes('desktop')||cls.includes('emulator')) return 'device_switch';
  if(text==='ru'||text==='en'||text==='kz'||text==='ar'||cls.includes('language')) return 'language_switch';
  if(text.includes('регион')||['ru','kz','gcc','ww'].includes(String(target?.value||'').toLowerCase())) return 'region_switch';
  if(text.includes('добавить секц')||text.includes('выбрать макет')||text.includes('макеты секций')) return 'section_add';
  if(text.includes('дублировать')) return 'duplicate';
  if(text.includes('удалить')) return 'delete';
  if(text.includes('авто')||text.includes('правил')||cls.includes('automation')) return 'automation';
  if(text.includes('предпросмотр')) return 'preview';
  if(text.includes('seo')||cls.includes('page-field-v43')||cls.includes('page-seo')) return 'seo';
  if(text.includes('образ')||cls.includes('look')) return 'look';
  if(text.includes('медиа')||text.includes('изображ')||text.includes('видео')||cls.includes('media')) return 'media';
  if(text.includes('товар')||text.includes('артикул')||cls.includes('product')) return 'product';
  if(cls.includes('tab')||cls.includes('panel')||text.includes('настройк')||text.includes('контент')) return 'context_switch';
  return eventType==='change' ? 'field_change' : 'click';
}
function opsFlattenConditionsV79(nodes=[]){
  const out=[];
  (nodes||[]).forEach((node)=>{
    if(!node) return;
    if(node.type==='group') (node.conditions||[]).forEach((condition)=>out.push(condition));
    else out.push(node);
  });
  return out.filter((item)=>item&&item.field);
}
function opsAndConditionSetsV79(rule){
  const nodes=Array.isArray(rule?.selection?.conditions)?rule.selection.conditions:[];
  const sets=[];
  const rootPlain=nodes.filter((node)=>node?.type!=='group');
  if(rule?.selection?.rootOperator!=='OR' && rootPlain.length) sets.push(rootPlain);
  nodes.filter((node)=>node?.type==='group'&&node.operator!=='OR').forEach((group)=>sets.push(group.conditions||[]));
  return sets;
}
function opsRuleConflictsV79(sections=[],pageSettings={},region='RU'){
  const issues=[];
  const add=(severity,code,message,sectionId=null,fix='')=>issues.push({severity,code,message,sectionId,fix});
  const pinnedBySku=new Map();
  (sections||[]).forEach((section)=>{
    const rule=section?.rules||{};
    const sectionName=section?.titles?.ru||section?.id||'Секция';
    const conditions=opsFlattenConditionsV79(rule?.selection?.conditions||[]);
    if(rule?.selection?.enabled){
      conditions.forEach((condition)=>{ if(condition.value===''||condition.value==null) add('warning','EMPTY_CONDITION','Есть условие без значения: '+condition.field,section.id,'Заполнить значение или удалить условие'); });
      opsAndConditionSetsV79(rule).forEach((set)=>{
        const fields=[...new Set(set.map((condition)=>condition.field))];
        fields.forEach((field)=>{
          const list=set.filter((condition)=>condition.field===field);
          const eq=list.filter((condition)=>condition.operator==='eq').map((condition)=>String(condition.value));
          const neq=list.filter((condition)=>condition.operator==='not_eq').map((condition)=>String(condition.value));
          if(new Set(eq).size>1) add('blocker','CONTRADICT_EQ',sectionName+': поле «'+field+'» одновременно равно разным значениям',section.id,'Оставить одно значение или использовать OR');
          if(eq.some((value)=>neq.includes(value))) add('blocker','EQ_EXCLUDED',sectionName+': значение «'+field+'» одновременно включено и исключено',section.id,'Удалить конфликтующее условие');
          const lowers=list.filter((condition)=>['gt','gte'].includes(condition.operator)).map((condition)=>Number(condition.value)).filter(Number.isFinite);
          const uppers=list.filter((condition)=>['lt','lte'].includes(condition.operator)).map((condition)=>Number(condition.value)).filter(Number.isFinite);
          if(lowers.length&&uppers.length&&Math.max(...lowers)>Math.min(...uppers)) add('blocker','RANGE_EMPTY',sectionName+': диапазон «'+field+'» не может вернуть кандидатов',section.id,'Исправить нижнюю/верхнюю границу');
        });
      });
    }
    const levels=[rule?.sorting?.level1,rule?.sorting?.level2].filter(Boolean);
    if(levels.length>1&&levels[0]?.criterion===levels[1]?.criterion) add('warning','DUPLICATE_SORT',sectionName+': оба уровня сортируют по одному полю',section.id,'Выбрать вторичный критерий');
    if(Array.isArray(rule?.sorting?.levels)&&rule.sorting.levels.length>2) add('blocker','SORT_LEVEL_LIMIT',sectionName+': больше 2 уровней сортировки',section.id,'Оставить максимум 2 уровня');
    const groupIds=rule?.scope?.sectionIds||section?.automationGroup?.memberSectionIds||[];
    if(groupIds.length>20) add('blocker','GROUP_LIMIT',sectionName+': в группе больше 20 секций',section.id,'Разбить группу');
    if(section?.template?.layoutV2 && !(section?.template?.mobileContainers||[]).length) add('warning','MOBILE_LAYOUT_MISSING',sectionName+': нет явной mobile-геометрии',section.id,'Настроить mobileContainers');
    const capacity=(section?.template?.containers||[]).reduce((sum,container)=>sum+(container?.slots||[]).length,0);
    if(capacity<=0) add('blocker','ZERO_CAPACITY',sectionName+': макет не содержит слотов',section.id,'Выбрать корректный макет');
    if(rule?.distribution?.groupStrategy==='repeat_section_combo' && Number(rule?.distribution?.maxRepeat||rule?.distribution?.repeatMax||3)<=0) add('blocker','REPEAT_ZERO',sectionName+': повтор секций включён с нулевым лимитом',section.id,'Указать лимит > 0');
    const chain=(rule?.uiV77?.fallbackSteps||rule?.fallback?.replacementChain||[]).filter((step)=>step?.enabled!==false&&!step?.backlog);
    const chainKeys=chain.map((step)=>step.step);
    if(new Set(chainKeys).size!==chainKeys.length) add('warning','FALLBACK_DUPLICATE',sectionName+': fallback содержит повторяющийся шаг',section.id,'Оставить один экземпляр шага');
    const autoEnabled=Boolean(rule?.selection?.enabled||rule?.mode==='auto'||rule?.mode==='hybrid');
    if(autoEnabled && Number(section?.candidates?.length||0)===0 && !['collapse','hide','collapse_and_center'].includes(String(rule?.emptyBehavior||rule?.fallback?.emptySlotBehavior||''))) add('warning','ZERO_CANDIDATES',sectionName+': автоматизация не находит кандидатов и не задан безопасный empty-state',section.id,'Добавить fallback/collapse или ослабить отбор');
    Object.values(section?.pins||{}).forEach((sku)=>{
      if(!String(sku||'').startsWith('P-') && !PRODUCTS.some((product)=>product.id===sku)) return;
      const arr=pinnedBySku.get(sku)||[]; arr.push(section.id); pinnedBySku.set(sku,arr);
    });
  });
  pinnedBySku.forEach((sectionIds,sku)=>{
    if(new Set(sectionIds).size>1) add('warning','PIN_DUPLICATE_PAGE','SKU '+sku+' закреплён вручную в нескольких секциях',sectionIds[0],'Проверить, допустим ли повтор на странице');
  });
  if(pageSettings?.seoIndex && !String(pageSettings?.seoTitle||'').trim()) add('warning','SEO_TITLE_EMPTY','Страница индексируется, но SEO Title не заполнен',null,'Заполнить Title');
  if(pageSettings?.seoIndex && !String(pageSettings?.seoH1||'').trim()) add('warning','SEO_H1_EMPTY','Страница индексируется, но H1 не заполнен',null,'Заполнить H1');
  if(pageSettings?.seoIndex && !String(pageSettings?.seoDescription||'').trim()) add('warning','SEO_DESCRIPTION_EMPTY','Страница индексируется, но Meta Description не заполнен',null,'Заполнить Description');
  if(pageSettings?.seoSitemap && pageSettings?.seoIndex===false) add('blocker','SEO_SITEMAP_NOINDEX','Страница NOINDEX, но включена в sitemap.xml',null,'Отключить sitemap или включить index');
  if(pageSettings?.seoIndex && !pageSettings?.seoFollow) add('warning','SEO_INDEX_NOFOLLOW','Страница INDEX + NOFOLLOW',null,'Проверить, действительно ли нужен nofollow');
  return issues;
}
function opsCommercialMetricsV79(resolved=[],region='RU'){
  const slots=(resolved||[]).flatMap((section)=>section?.resolvedSlots||[]);
  const filled=slots.filter((slot)=>slot?.entity);
  const products=filled.filter((slot)=>slot?.entity&&('price' in slot.entity||PRODUCTS.some((product)=>product.id===slot.entity.id)));
  const inStock=products.filter((slot)=>Number(slot.entity?.stock?.[region]??slot.entity?.stockValue??0)>0);
  const stockUnits=products.reduce((sum,slot)=>sum+Math.max(0,Number(slot.entity?.stock?.[region]??slot.entity?.stockValue??0)),0);
  const l7dUnits=products.reduce((sum,slot)=>sum+Math.max(0,Number(slot.entity?.l7d??slot.entity?.salesL7D??0)),0);
  const gmvProxy=products.reduce((sum,slot)=>sum+Math.max(0,Number(slot.entity?.price||0))*Math.max(0,Number(slot.entity?.l7d??slot.entity?.salesL7D??0)),0);
  const autoSlots=slots.filter((slot)=>slot?.status==='auto').length;
  const editorial=filled.filter((slot)=>slot?.entity&&!('price' in slot.entity)&&!PRODUCTS.some((product)=>product.id===slot.entity.id)).length;
  return {
    totalSlots:slots.length,filledSlots:filled.length,fillRate:slots.length?Math.round(filled.length/slots.length*1000)/10:0,
    productSlots:products.length,inStockProductSlots:inStock.length,inStockExposure:products.length?Math.round(inStock.length/products.length*1000)/10:100,
    oosProductSlots:products.length-inStock.length,stockUnits,l7dUnits,gmvProxy,avgPrice:products.length?Math.round(products.reduce((sum,slot)=>sum+Number(slot.entity?.price||0),0)/products.length):0,
    automationShare:filled.length?Math.round(autoSlots/filled.length*1000)/10:0,editorialSlots:editorial,
  };
}
function opsRiskScoreV79(issues=[]){
  const blockers=issues.filter((issue)=>issue.severity==='blocker').length;
  const warnings=issues.filter((issue)=>issue.severity==='warning').length;
  return Math.min(100,blockers*25+warnings*5);
}
function opsCsvV79(rows){
  const header=['task_type','task_label','started_at','duration_sec','actions','clicks','field_changes','undo','redo','context_switches','device_switches','region_switches','sections','fill_rate_pct','in_stock_exposure_pct','oos_product_slots','stock_units_exposed','l7d_units_exposed','l7d_gmv_proxy_rub','automation_share_pct','blockers','warnings','migration_risk_score','legacy_baseline_min','time_saved_pct'];
  const quote=(value)=>'"'+String(value??'').replaceAll('"','""')+'"';
  return [header.join(','),...(rows||[]).map((row)=>header.map((key)=>quote(row[key])).join(','))].join('\n');
}
function OpsMigrationPanelV79({open,onClose,resolved,sections,region,pageId,pageSettings,metrics}){
  const [taskType,setTaskType]=useState('section_create');
  const [legacyBaseline,setLegacyBaseline]=useState('');
  const [session,setSession]=useState(null);
  const [history,setHistory]=useState([]);
  const [tick,setTick]=useState(0);
  const issues=useMemo(()=>opsRuleConflictsV79(sections,pageSettings,region),[sections,pageSettings,region]);
  const commercial=useMemo(()=>opsCommercialMetricsV79(resolved,region),[resolved,region]);
  const blockers=issues.filter((issue)=>issue.severity==='blocker');
  const warnings=issues.filter((issue)=>issue.severity==='warning');
  const risk=opsRiskScoreV79(issues);
  const readiness=Math.max(0,100-risk);
  const runningSec=session?Math.max(0,(Date.now()-session.startedMs)/1000):0;
  const start=(autoType)=>setSession({id:'ops-'+Date.now(),task_type:autoType||taskType,startedMs:Date.now(),started_at:new Date().toISOString(),actions:0,clicks:0,field_changes:0,undo:0,redo:0,context_switches:0,device_switches:0,region_switches:0,events:[],legacy_baseline_min:Number(legacyBaseline||0)});
  const finish=()=>{
    if(!session) return;
    const duration=Math.max(0.1,(Date.now()-session.startedMs)/1000);
    const baseline=Number(session.legacy_baseline_min||0);
    const row={...session,task_label:opsTaskLabelV79(session.task_type),duration_sec:Math.round(duration*10)/10,sections:(sections||[]).length,fill_rate_pct:commercial.fillRate,in_stock_exposure_pct:commercial.inStockExposure,oos_product_slots:commercial.oosProductSlots,stock_units_exposed:commercial.stockUnits,l7d_units_exposed:commercial.l7dUnits,l7d_gmv_proxy_rub:Math.round(commercial.gmvProxy),automation_share_pct:commercial.automationShare,blockers:blockers.length,warnings:warnings.length,migration_risk_score:risk,time_saved_pct:baseline>0?Math.round((1-duration/(baseline*60))*1000)/10:''};
    setHistory((prev)=>[row,...prev].slice(0,100)); setSession(null);
  };
  useEffect(()=>{ if(!session) return; const timer=setInterval(()=>setTick((value)=>value+1),500); return()=>clearInterval(timer); },[session?.id]);
  useEffect(()=>{
    const onEvent=(event)=>{
      const target=event.target;
      const label=opsElementLabelV79(target);
      const kind=opsActionKindV79(target,label,event.type);
      if(!session && event.type==='click' && kind==='section_add') { start('section_create'); return; }
      if(!session) return;
      setSession((prev)=>{
        if(!prev) return prev;
        const next={...prev,actions:prev.actions+1,events:[...(prev.events||[]),{ts:new Date().toISOString(),kind,label}].slice(-250)};
        if(event.type==='click') next.clicks=prev.clicks+1;
        if(event.type==='change') next.field_changes=prev.field_changes+1;
        if(kind==='undo') next.undo=prev.undo+1;
        if(kind==='redo') next.redo=prev.redo+1;
        if(kind==='context_switch') next.context_switches=prev.context_switches+1;
        if(kind==='device_switch') next.device_switches=prev.device_switches+1;
        if(kind==='region_switch') next.region_switches=prev.region_switches+1;
        return next;
      });
      if(kind==='publish') setTimeout(()=>finish(),0);
    };
    document.addEventListener('click',onEvent,true); document.addEventListener('change',onEvent,true);
    return()=>{document.removeEventListener('click',onEvent,true);document.removeEventListener('change',onEvent,true);};
  },[session?.id,taskType,legacyBaseline,commercial.fillRate,commercial.inStockExposure,risk,sections.length]);
  useEffect(()=>{
    globalThis.__MERCH_OPS_V79__={issues,commercial,risk,readiness,history,active:session?{...session,duration_sec:Math.round(runningSec*10)/10}:null,pageId,region};
  },[issues,commercial,risk,readiness,history,session,runningSec,pageId,region,tick]);
  const exportCsv=()=>{
    const blob=new Blob([opsCsvV79(history)],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='merchandising-ops-measurements.csv'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <aside className={'ops-panel-v79 '+(open?'open':'')} aria-hidden={!open}>
    <header><div><span>ОПЕРАЦИОННАЯ ЭФФЕКТИВНОСТЬ</span><strong>Migration Control Center</strong><small>TTM · действия · rework · конфликты · коммерческое состояние</small></div><button onClick={onClose}><X size={17}/></button></header>
    <div className="ops-scroll-v79">
      <section className="ops-timer-v79"><div className="ops-section-title-v79"><span>ЗАМЕР СЦЕНАРИЯ</span><b>{session?'ИДЁТ':'ГОТОВ'}</b></div><label>Сценарий<select value={taskType} disabled={Boolean(session)} onChange={(event)=>setTaskType(event.target.value)}>{OPS_TASK_TYPES_V79.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Legacy baseline, мин <small>необязательно</small><input type="number" min="0" step="0.5" value={legacyBaseline} disabled={Boolean(session)} onChange={(event)=>setLegacyBaseline(event.target.value)} placeholder="Напр. 20"/></label><div className="ops-live-v79"><strong>{session?runningSec.toFixed(1):'0.0'}<small> сек</small></strong><span>{session?(session.actions+' действий · '+session.field_changes+' изменений'):'Нажмите «Начать замер» перед задачей'}</span></div><div className="ops-actions-v79"><button disabled={Boolean(session)} onClick={()=>start()}>Начать замер</button><button className="primary" disabled={!session} onClick={finish}>Завершить</button></div></section>
      <section><div className="ops-section-title-v79"><span>ТЕКУЩАЯ СТРАНИЦА</span><b>{readiness}% READY</b></div><div className="ops-kpis-v79"><span><b>Заполнение</b><strong>{commercial.fillRate}%</strong></span><span><b>In-stock exposure</b><strong>{commercial.inStockExposure}%</strong></span><span><b>Автоматизация</b><strong>{commercial.automationShare}%</strong></span><span><b>OOS</b><strong>{commercial.oosProductSlots}</strong></span><span><b>Сток в экспозиции</b><strong>{commercial.stockUnits}</strong></span><span><b>L7D units</b><strong>{commercial.l7dUnits}</strong></span></div><div className="ops-gmv-v79"><span>L7D GMV proxy</span><strong>{money(Math.round(commercial.gmvProxy))}</strong><small>Σ цена × L7D. Это прокси, не фактическая выручка.</small></div></section>
      <section><div className="ops-section-title-v79"><span>РИСК МИГРАЦИИ</span><b className={blockers.length?'bad':warnings.length?'warn':'ok'}>{blockers.length} blocker · {warnings.length} warning</b></div><div className="ops-riskbar-v79"><i style={{width:risk+'%'}}/></div>{issues.length?<div className="ops-issues-v79">{issues.slice(0,12).map((issue,index)=><div key={issue.code+'-'+index} className={issue.severity}><b>{issue.severity==='blocker'?'!':'i'}</b><span><strong>{issue.message}</strong><small>{issue.fix}</small></span></div>)}</div>:<div className="ops-clean-v79"><CheckCircle2 size={17}/>Противоречий не найдено</div>}</section>
      <section><div className="ops-section-title-v79"><span>ИСТОРИЯ ЗАМЕРОВ</span><button disabled={!history.length} onClick={exportCsv}>CSV</button></div>{history.length?<div className="ops-history-v79">{history.slice(0,8).map((row)=><div key={row.id}><span><strong>{row.task_label}</strong><small>{new Date(row.started_at).toLocaleTimeString('ru-RU')} · {row.actions} действий</small></span><b>{row.duration_sec}с</b>{row.time_saved_pct!==''&&<em>{row.time_saved_pct}% vs legacy</em>}</div>)}</div>:<div className="ops-empty-v79">Завершённые замеры появятся здесь.</div>}</section>
    </div>
  </aside>;
}
`;
  app=app.replace(anchor,anchor+'\n'+helpers);

  const stateAnchor="  const [publishCheckOpenV74,setPublishCheckOpenV74]=useState(false);";
  if(!app.includes(stateAnchor)) throw new Error(MARKER+': publish state anchor missing');
  app=app.replace(stateAnchor,stateAnchor+"\n  const [opsPanelOpenV79,setOpsPanelOpenV79]=useState(false);");

  const analyticsRx=/(<button className="editor-analytics-v43"[^>]*>[\s\S]*?<\/button>)/;
  if(!analyticsRx.test(app)) throw new Error(MARKER+': analytics button missing');
  app=app.replace(analyticsRx,"$1<button className={'editor-ops-v79 '+(opsPanelOpenV79?'active':'')} onClick={()=>setOpsPanelOpenV79((value)=>!value)}><CheckCircle2 size={16}/><span>Эффективность</span></button>");

  const overlayAnchor='{publishCheckOpenV74 && <MerchPublishCheckV74';
  if(!app.includes(overlayAnchor)) throw new Error(MARKER+': publish overlay anchor missing');
  app=app.replace(overlayAnchor,"<OpsMigrationPanelV79 open={opsPanelOpenV79} onClose={()=>setOpsPanelOpenV79(false)} resolved={resolved} sections={sections} region={region} pageId={pageId} pageSettings={currentPageSettingsV43} metrics={metrics}/>\n    "+overlayAnchor);

  writeFileSync(appPath,app);
}

let css=readFileSync(cssPath,'utf8');
if(!css.includes('/* ops-migration-lab-v79 */')){
  css+=String.raw`
/* ops-migration-lab-v79 */
.editor-ops-v79{height:34px;padding:0 10px;border:0;background:#fff;color:#555;display:flex;align-items:center;gap:6px;font-size:8px;font-weight:500;cursor:pointer}.editor-ops-v79:hover,.editor-ops-v79.active{background:#f2f2f2;color:#111}.ops-panel-v79{position:fixed;top:56px;right:0;bottom:0;width:min(430px,92vw);background:#fff;border-left:1px solid #dcdcdc;box-shadow:-18px 0 42px rgba(0,0,0,.08);z-index:235;transform:translateX(102%);transition:transform .22s ease;display:flex;flex-direction:column;color:#181818}.ops-panel-v79.open{transform:translateX(0)}.ops-panel-v79>header{min-height:76px;padding:14px 16px;border-bottom:1px solid #e7e7e7;display:flex;justify-content:space-between;gap:12px}.ops-panel-v79>header>div{display:grid;gap:2px}.ops-panel-v79>header span,.ops-section-title-v79>span{font-size:7px;letter-spacing:.11em;font-weight:700;color:#777}.ops-panel-v79>header strong{font-size:17px}.ops-panel-v79>header small{font-size:8px;color:#777}.ops-panel-v79>header button{width:30px;height:30px;border:0;background:#fff;display:grid;place-items:center}.ops-scroll-v79{overflow:auto;padding:0 16px 30px}.ops-scroll-v79>section{padding:18px 0;border-bottom:1px solid #ececec}.ops-section-title-v79{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.ops-section-title-v79>b{font-size:8px;font-weight:700;color:#555}.ops-section-title-v79>b.bad{color:#a92323}.ops-section-title-v79>b.warn{color:#8a5a00}.ops-section-title-v79>b.ok{color:#28734a}.ops-section-title-v79>button{height:27px;border:1px solid #d8d8d8;background:#fff;font-size:8px;padding:0 9px}.ops-timer-v79 label{display:grid;gap:4px;margin-top:8px;font-size:8px;color:#666}.ops-timer-v79 label small{font-weight:400;color:#999}.ops-timer-v79 select,.ops-timer-v79 input{height:36px;border:1px solid #d8d8d8;background:#fff;padding:0 9px;font-size:10px}.ops-live-v79{margin-top:12px;padding:13px 14px;background:#f6f6f6;display:flex;align-items:end;justify-content:space-between;gap:12px}.ops-live-v79 strong{font-size:26px;font-weight:500;line-height:1}.ops-live-v79 strong small{font-size:9px}.ops-live-v79 span{font-size:8px;color:#777;text-align:right}.ops-actions-v79{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.ops-actions-v79 button{height:36px;border:1px solid #111;background:#fff;font-size:9px}.ops-actions-v79 button.primary{background:#111;color:#fff}.ops-actions-v79 button:disabled{opacity:.35}.ops-kpis-v79{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #e5e5e5;border-left:1px solid #e5e5e5}.ops-kpis-v79>span{min-height:60px;border-right:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;padding:9px;display:grid;align-content:space-between}.ops-kpis-v79 b{font-size:7px;font-weight:500;color:#777}.ops-kpis-v79 strong{font-size:16px;font-weight:500}.ops-gmv-v79{display:grid;grid-template-columns:1fr auto;gap:3px 10px;margin-top:10px;padding:10px 0;border-top:1px solid #ececec}.ops-gmv-v79 span{font-size:8px;color:#666}.ops-gmv-v79 strong{font-size:15px;font-weight:500}.ops-gmv-v79 small{grid-column:1/-1;font-size:7px;color:#999}.ops-riskbar-v79{height:4px;background:#ededed;margin-bottom:10px;overflow:hidden}.ops-riskbar-v79 i{display:block;height:100%;background:#111}.ops-issues-v79{display:grid;gap:6px}.ops-issues-v79>div{display:grid;grid-template-columns:22px 1fr;gap:7px;padding:8px;border:1px solid #e3e3e3}.ops-issues-v79>div.blocker{border-left:3px solid #a92323}.ops-issues-v79>div.warning{border-left:3px solid #b78422}.ops-issues-v79>div>b{width:20px;height:20px;border:1px solid #bbb;display:grid;place-items:center;font-size:8px}.ops-issues-v79 span{display:grid;gap:2px}.ops-issues-v79 strong{font-size:8px;font-weight:600;line-height:1.35}.ops-issues-v79 small{font-size:7px;color:#777}.ops-clean-v79{display:flex;align-items:center;gap:7px;font-size:9px;color:#38674f;padding:10px;background:#f5f8f6}.ops-history-v79{display:grid}.ops-history-v79>div{min-height:48px;border-top:1px solid #ececec;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px}.ops-history-v79 span{display:grid;gap:2px}.ops-history-v79 strong{font-size:9px}.ops-history-v79 small{font-size:7px;color:#888}.ops-history-v79>div>b{font-size:11px}.ops-history-v79 em{font-style:normal;font-size:7px;color:#357052}.ops-empty-v79{font-size:8px;color:#999;padding:12px 0}.preview-mode .ops-panel-v79{display:none!important}@media(max-width:1199px){.editor-ops-v79 span{display:none}.ops-panel-v79{top:56px}}@media(max-width:767px){.ops-panel-v79{top:52px;width:100vw}.ops-kpis-v79{grid-template-columns:repeat(2,1fr)}}
`;
  writeFileSync(cssPath,css);
}
console.log('V79 applied: operational TTM instrumentation, commercial exposure metrics and migration conflict checker');
