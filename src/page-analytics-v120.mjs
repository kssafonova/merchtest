// Page / section / slot merchandising analytics for merchtest.
// No customer tracking is performed by this module.
// "demo" interaction metrics are deterministic placeholders, always labelled as simulation.
const num=(value)=>Number.isFinite(Number(value))?Number(value):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(s)=>{let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;};
export const ANALYTICS_EVENTS_V120=Object.freeze({
  page_view:'page_view',section_view:'section_view',slot_view:'slot_view',
  slot_click:'slot_click',slot_add_to_cart:'slot_add_to_cart',slot_purchase:'slot_purchase',
});
export const VIEWABILITY_POLICY_V120='>=50% видимой площади не менее 1 секунды (для будущего сборщика)';
export const numberDisplayV120=(value,unit='')=>value==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(value)+unit;
const slotEntity=(slot)=>slot?.entity||slot?.item||null;
const normalizeStock=(entity,region)=>{
  if(!entity||!('price' in entity))return null;
  const raw=entity.stock?.[region]??entity.stockValue??entity.stock?.RU??entity.availableVariants??null;
  return raw==null?null:num(raw);
};
function readSlots(section){
  if(Array.isArray(section?.resolvedSlots))return section.resolvedSlots;
  return Array.from({length:section?.template?.containers?.flatMap(c=>c.slots||[]).length||0},(_,index)=>({index,entity:null,status:'empty'}));
}
export function actualSectionV120(section,region='RU'){
  const slots=readSlots(section);
  const filled=slots.filter(slot=>Boolean(slotEntity(slot)));
  const products=filled.map(slotEntity).filter(item=>item&&'price' in item);
  const ids=products.map(item=>String(item.id||item.sku||'')).filter(Boolean);
  const oos=products.filter(entity=>normalizeStock(entity,region)===0);
  const pinned=slots.filter(slot=>slot.status==='pin'||(section?.pins&&Object.hasOwn(section.pins,String(slot.index)))).length;
  const automated=slots.filter(slot=>slot.status==='auto').length;
  const unique=new Set(ids);
  const categoryCounts={};const colorCounts={};
  for(const product of products){
    const category=String(product.category||product.subcategory||'Не указана');
    const color=String(product.color||'Не указан');
    categoryCounts[category]=(categoryCounts[category]||0)+1;
    colorCounts[color]=(colorCounts[color]||0)+1;
  }
  return {capacity:slots.length,filled:filled.length,empty:slots.length-filled.length,productSlots:products.length,pinned,automated,
    oos:oos.length,knownStock:products.filter(item=>normalizeStock(item,region)!=null).length,
    skuIds:ids,uniqueSku:unique.size,duplicates:ids.length-unique.size,categoryCounts,colorCounts,
    slots:slots.map((slot,index)=>({
      index:Number.isInteger(slot?.index)?slot.index:index,entity:slotEntity(slot),
      sku:slotEntity(slot)?.id||null,status:slot?.status||'empty',
      stock:normalizeStock(slotEntity(slot),region),
      pinned:slot?.status==='pin'||Boolean(section?.pins&&Object.hasOwn(section.pins,String(slot?.index??index))),
    }))};
}
function emptyBehavior(){return {views:null,exposures:null,clicks:null,carts:null,orders:null,revenue:null,ctr:null,cartRate:null};}
const cohortFactor={all:1,organic:.67,paid:.24,direct:.32};
function demoBehavior(section,period,traffic,device,slotNumber=0){
  const p=({7:1,14:2,30:4.2})[Number(period)]||1;
  const seed=hash(section.id+'|'+slotNumber+'|'+traffic+'|'+device);
  const views=Math.round((340+(seed%530))*p*(cohortFactor[traffic]||1));
  const exposures=Math.max(0,Math.round(views*clamp(.87-(slotNumber*.09)-(seed%17)/200,.18,.98)));
  const clicks=Math.round(exposures*clamp(.025+(seed%84)/1000,.015,.16));
  const carts=Math.round(clicks*clamp(.06+(seed%25)/100,.05,.45));
  const orders=Math.round(carts*clamp(.11+(seed%21)/100,.04,.39));
  // Demo attribution: once per slot, not a causal or net-lift estimate.
  const revenue=orders*(890+(seed%8)*750);
  return {views,exposures,clicks,carts,orders,revenue,
    ctr:exposures?100*clicks/exposures:null,
    cartRate:clicks?100*carts/clicks:null};
}
const aggregateBehavior=(items)=>{
  if(!items.some(x=>x?.exposures!=null))return emptyBehavior();
  const sum=k=>items.reduce((v,item)=>v+num(item?.[k]),0);
  const exposures=sum('exposures'),clicks=sum('clicks');
  return {views:sum('views'),exposures,clicks,carts:sum('carts'),orders:sum('orders'),revenue:sum('revenue'),
    ctr:exposures?100*clicks/exposures:null,cartRate:clicks?100*sum('carts')/clicks:null};
};
export function eventMetricsV120(events,sectionId,slotIndex=null){
  // Events must already be scoped to one page, region, device and time range by the data provider.
  if(!Array.isArray(events)||!events.length)return emptyBehavior();
  const rows=events.filter(e=>String(e.section_id||e.sectionId)===String(sectionId)
    &&(slotIndex===null||Number(e.slot_id??e.slotIndex)===Number(slotIndex)));
  const count=type=>rows.filter(e=>e.type===type).length;
  const exposures=count(slotIndex==null?'section_view':'slot_view');
  const clicks=count('slot_click'),carts=count('slot_add_to_cart'),orders=count('slot_purchase');
  const revenue=rows.filter(e=>e.type==='slot_purchase').reduce((v,e)=>v+num(e.revenue),0);
  return {views:null,exposures,clicks,carts,orders,revenue,
    ctr:exposures?clicks/exposures*100:null,cartRate:clicks?carts/clicks*100:null};
}
export function insightsV120(records){
  const out=[];
  const pageSkus=new Map();
  for(const rec of records)for(const sku of rec.actual.skuIds)pageSkus.set(sku,(pageSkus.get(sku)||0)+1);
  const duplicated=[...pageSkus].filter(([,n])=>n>1);
  if(duplicated.length)out.push({kind:'duplicate',severity:'warning',title:'Повторения SKU',detail:duplicated.length+' артикулов встречаются больше одного раза на странице',action:'Проверить дедупликацию и ручные PIN'});
  for(const rec of records){
    if(rec.actual.empty)out.push({kind:'empty',sectionId:rec.id,severity:'warning',title:'Пустые слоты',detail:rec.name+': '+rec.actual.empty+' пустых из '+rec.actual.capacity,action:'Заполнить или проверить правило'});
    if(rec.actual.oos)out.push({kind:'oos',sectionId:rec.id,severity:'warning',title:'Товар без остатков',detail:rec.name+': '+rec.actual.oos+' SKU с нулевым остатком',action:'Заменить PIN или включить OOS-замену'});
    if(rec.behavior.ctr!=null&&rec.behavior.exposures>=100&&rec.behavior.ctr>=7&&rec.behavior.exposures<250)
      out.push({kind:'opportunity',sectionId:rec.id,severity:'info',title:'Интересный блок с ограниченным охватом',detail:rec.name+': высокий CTR при сравнительно малом количестве видимых показов',action:'Проверить перенос выше и сравнить в эксперименте'});
  }
  return out;
}
export function pageAnalyticsV120(sections=[],{region='RU',device='desktop',period=7,traffic='all',mode='actual',events=[]}={}){
  const demonstration=mode==='demo';
  const records=sections.map((section,position)=>{
    const actual=actualSectionV120(section,region);
    const slots=actual.slots.map(slot=>({...slot,behavior:demonstration?demoBehavior(section,period,traffic,device,position*3+slot.index):eventMetricsV120(events,section.id,slot.index)}));
    const behavior=demonstration?aggregateBehavior(slots.filter(x=>x.entity).map(x=>x.behavior)):
      eventMetricsV120(events,section.id);
    return {id:section.id,name:section.titles?.ru||section.template?.label||'Секция',typeId:section.typeId||section.template?.id||'',position:position+1,actual,behavior,slots};
  });
  const allSkus=records.flatMap(r=>r.actual.skuIds);
  const totals={sections:records.length,slots:records.reduce((n,r)=>n+r.actual.capacity,0),
    filled:records.reduce((n,r)=>n+r.actual.filled,0),empty:records.reduce((n,r)=>n+r.actual.empty,0),
    pinned:records.reduce((n,r)=>n+r.actual.pinned,0),automated:records.reduce((n,r)=>n+r.actual.automated,0),
    oos:records.reduce((n,r)=>n+r.actual.oos,0),uniqueSkus:new Set(allSkus).size,
    duplicatedSku:[...new Set(allSkus.filter(sku=>allSkus.filter(x=>x===sku).length>1))].length};
  const behavior=demonstration?aggregateBehavior(records.map(r=>r.behavior)):
    events.length?aggregateBehavior(records.map(r=>r.behavior)):emptyBehavior();
  return {mode:demonstration?'demo':'actual',period:Number(period),traffic,device,region,records,totals,behavior,
    issues:insightsV120(records),eventConnected:!demonstration&&events.length>0,
    disclaimer:demonstration?'Симулированные события, не измерения магазина. Заказы и выручка — условные значения.':
      'Поведенческие события не подключены. Показаны только текущие свойства витрины.'};
}
