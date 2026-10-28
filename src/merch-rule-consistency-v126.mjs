import {isComingSoonV125,isTeaserAllowedV125,stockForRegionV125,merchPolicyV125} from './merch-lifecycle-v125.mjs';

// Single availability gate shared by live resolution and rule preview.
// Matching the selection and sorting happens BEFORE this gate; neither is rewritten.
export function eligibleForPlacementV126(product,region,section){
  const stock=stockForRegionV125(product,region);
  return stock!==null && (stock>0 || (isTeaserAllowedV125(section)&&isComingSoonV125(product,region)));
}
export function commercialFieldV126(product,region){
  if(isComingSoonV125(product,region))return 'coming_soon';
  const stock=stockForRegionV125(product,region);
  return stock===null?'unknown':stock>0?'available':'out_of_stock';
}
export function eligibleCandidatesV126(matched,region,section){
  return (matched||[]).filter(product=>eligibleForPlacementV126(product,region,section));
}
const nodesOf=(selection)=>{
  const out=[];
  const walk=(node)=>{
    if(!node||typeof node!=='object')return;
    if(node.type==='group'){
      (node.conditions||node.children||[]).forEach(walk);
    }else if(node.field)out.push(node);
  };
  (selection?.conditions||[]).forEach(walk);
  return out;
};
export function explicitStockRuleV126(selection){
  return nodesOf(selection).some(node=>node.field==='stock'&&
    ['gt','gte','eq'].includes(node.operator)&&Number(node.value)>=(node.operator==='gt'?0:1));
}
export function requestsComingSoonV126(rule){
  if(rule?.uiV77?.scenario==='coming_soon'||rule?.scenarioV77==='coming_soon')return true;
  return nodesOf(rule?.selection).some(node=>node.field==='commercialState'&&
    node.operator==='eq'&&String(node.value)==='coming_soon');
}
export function merchRuleIssuesV126(section,region='RU',overrideRule=null){
  const policy=merchPolicyV125(section);
  const rule=overrideRule||section?.automationRuleV63||section?.groupRuleV63||section?.rules;
  if(!rule||rule?.selection?.enabled===false)return [];
  const issues=[];
  const allowed=policy.objective==='teaser'&&policy.includeComingSoon;
  if(requestsComingSoonV126(rule)&&!allowed){
    issues.push({code:'coming_soon_not_allowed',severity:'error',message:
      'Правило отбирает Coming Soon, но цель секции не разрешает анонсы. Выберите «Анонс» и включите Coming Soon либо измените отбор.'});
  }
  if(allowed&&explicitStockRuleV126(rule.selection)){
    issues.push({code:'stock_filters_teaser',severity:'warning',message:
      'Условие по положительному остатку может исключить Coming Soon. Фильтр сохранён без изменений; проверьте условия отбора.'});
  }
  if((rule.fallback?.replacementChain||[]).some(step=>step.enabled&&step.step==='keep_oos')){
    issues.push({code:'keep_oos',severity:'error',message:
      'Шаг «Оставить OOS» несовместим с контролем товарной доступности. Отключите его или настройте отдельный анонс Coming Soon.'});
  }
  return issues;
}
export function merchScopeIssuesV126(sections,rule,region='RU'){
  return (sections||[]).flatMap(section=>merchRuleIssuesV126(section,region,rule)
    .map(issue=>({...issue,sectionId:section.id,sectionName:section.titles?.ru||section.id||'Секция'})));
}
