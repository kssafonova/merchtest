// Commercial availability is separate from warehouse stock.
// A zero-stock product is NOT automatically Coming Soon: explicit lifecycle data is mandatory.
// The fixture below is for the merchtest demo only, not a claim about actual LIME inventory.
export const MERCH_OBJECTIVES_V125 = Object.freeze([
  {id:'sales',label:'Продажи',hint:'Показываем то, что можно купить сейчас'},
  {id:'teaser',label:'Анонс',hint:'Разрешаем Coming Soon для формирования спроса'},
  {id:'sell_through',label:'Реализация остатков',hint:'Продвигаем доступные запасы, не подменяя STR'},
]);
export const DEFAULT_MERCH_POLICY_V125 = Object.freeze({objective:'sales',includeComingSoon:false});
export const DEMO_COMING_SOON_V125 = Object.freeze({
  RU:['LIM019'],KZ:['LIM013'],GCC:['LIM033'],WW:['LIM002'],
});
const validStatus=(value)=>String(value||'').toLowerCase().replace(/[\s-]+/g,'_');
export function stockForRegionV125(product,region='RU'){
  if(!product||!('price' in product))return null;
  const value=product?.stock?.[region]??product?.stockValue??null;
  return value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
}
export function attachDemoLifecycleV125(products){
  return (products||[]).map(product=>{
    const next={...product},statuses={...(product.lifecycleByRegion||{})};
    for(const [region,ids] of Object.entries(DEMO_COMING_SOON_V125)){
      if(ids.includes(String(product.id)) && stockForRegionV125(product,region)===0 && !statuses[region]){
        statuses[region]='coming_soon';next.demoLifecycleV125=true;
      }
    }
    if(Object.keys(statuses).length)next.lifecycleByRegion=statuses;
    return next;
  });
}
export function isComingSoonV125(product,region='RU'){
  const status=validStatus(product?.lifecycleByRegion?.[region]??product?.commercialStatusByRegion?.[region]
    ??product?.commercialStatus??product?.lifecycleStatus??product?.lifecycle);
  return status==='coming_soon'&&stockForRegionV125(product,region)===0;
}
export function merchPolicyV125(section){
  const policy=section?.merchPolicyV125||DEFAULT_MERCH_POLICY_V125;
  return {objective:MERCH_OBJECTIVES_V125.some(item=>item.id===policy.objective)?policy.objective:'sales',
    includeComingSoon:Boolean(policy.includeComingSoon)};
}
export function isTeaserAllowedV125(section){
  const policy=merchPolicyV125(section);
  return policy.objective==='teaser' && policy.includeComingSoon;
}
export function placementStateV125(product,region,section){
  const stock=stockForRegionV125(product,region);
  if(stock==null)return 'unknown';
  if(stock>0)return 'available';
  if(isComingSoonV125(product,region))return isTeaserAllowedV125(section)?'coming_soon':'coming_soon_misplaced';
  return 'unwanted_oos';
}
export function auditMerchSectionV125(section,region='RU'){
  const slots=section?.resolvedSlots||[];
  const counts={available:0,comingSoon:0,comingSoonMisplaced:0,unwantedOos:0,unknown:0,zeroStock:0,products:0};
  for(const slot of slots){
    const entity=slot?.entity;
    if(!entity||!('price' in entity))continue;
    counts.products++;
    const state=placementStateV125(entity,region,section);
    if(state==='available')counts.available++;
    else if(state==='coming_soon')counts.comingSoon++;
    else if(state==='coming_soon_misplaced')counts.comingSoonMisplaced++;
    else if(state==='unwanted_oos')counts.unwantedOos++;
    else counts.unknown++;
    if(stockForRegionV125(entity,region)===0)counts.zeroStock++;
  }
  return {...counts,commercialOos:counts.unwantedOos+counts.comingSoonMisplaced};
}
// Deprecated compatibility export: commercial goals must NEVER rewrite explicit selection conditions.
// Kept temporarily for imports from older demos, but intentionally returns the original rule.
export function stripStockFromSelectionV125(selection){return selection;}
export function merchStatusLabelV125(product,region,section){
  const state=placementStateV125(product,region,section);
  return {coming_soon:'Скоро в продаже',coming_soon_misplaced:'Анонс вне сценария',unwanted_oos:'Нет в наличии',available:'В наличии',unknown:'Остаток неизвестен'}[state];
}
