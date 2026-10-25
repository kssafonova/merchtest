// Deterministic, inspectable demo policy for choosing existing storefront section types.
// Not a trained model: no user tracking, remote calls, or implied sales lift.
export const PERSONALIZATION_DEFAULT_V115=Object.freeze({
  enabled:true, exploration:15, candidateIds:[], fixedTypeId:null,
});
const number=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const bound=(n,min,max)=>Math.max(min,Math.min(max,number(n)));
export function slotCountV115(type,device='desktop'){
  const containers=device==='mobile'&&type?.mobileContainers?.length?type.mobileContainers:type?.containers;
  return Array.isArray(containers)?containers.reduce((n,c)=>n+(c.slots?.length||0),0):0;
}
export function layoutFeaturesV115(type,device='desktop'){
  const containers=device==='mobile'&&type?.mobileContainers?.length?type.mobileContainers:type?.containers;
  const slots=(containers||[]).flatMap(c=>c.slots||[]);
  const total=slots.length||1;
  const cols=(containers||[])[0]?.cols||12;
  const complex=slots.filter(s=>(Number(s.rows)||1)>1||(Number(s.span)||cols)>cols/2).length/total;
  const overlay=(containers||[]).some(c=>c.figmaOverlayV111);
  const density=bound(slots.length/8,0,1);
  const hero=bound(complex+(overlay?.28:0),0,1);
  return {slots:slots.length,density,hero,overlay,complex,device};
}
export function normalizedContextV115(input={}){
  const segment=['new','returning'].includes(input.segment)?input.segment:'new';
  const device=input.device==='mobile'?'mobile':'desktop';
  const content=['product','look','media'].includes(input.content)?input.content:'product';
  return {segment,device,content,dwell:bound(input.dwell,0,90),scroll:bound(input.scroll,0,100),
    click:bound(input.click,0,20),wishlist:bound(input.wishlist,0,20)};
}
export function safeCandidatesV115(types,ids,section,context){
  const currentType=section?.template;
  const selected=Array.isArray(ids)&&ids.length?ids:[currentType?.id];
  const minSlots=Math.max(0,...Object.keys(section?.pins||{}).filter(key=>section.pins[key]!=null).map(x=>Number(x)+1).filter(Number.isFinite));
  const byId=new Map((types||[]).filter(Boolean).map(t=>[t.id,t]));
  if(currentType?.id&&!byId.has(currentType.id))byId.set(currentType.id,currentType);
  const unique=[...new Set(selected.filter(Boolean))];
  const eligible=unique.map(id=>byId.get(id)).filter(t=>t&&slotCountV115(t,context?.device)>=Math.max(1,minSlots));
  // A safe baseline always survives a stale/deleted candidate selection.
  return eligible.length?eligible:currentType?[currentType]:[];
}
export function hashV115(value){
  let h=2166136261;
  for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}
function observationsV115(history,key){
  const x=history?.[key]||{};
  return {shown:Math.max(0,number(x.shown)),positive:Math.max(0,number(x.positive))};
}
export function scoreTypeV115(type,context,history={},sectionId=''){
  const features=layoutFeaturesV115(type,context.device);
  const isActive=context.dwell>=25||context.click>=2||context.wishlist>=1;
  const quick=context.scroll>=70&&context.dwell<15;
  const engagement=isActive?.13:quick?-.13:0;
  const profile=context.segment==='new'
    ?features.hero*.22-features.density*.11
    :features.density*.16+features.complex*.08;
  const attention=isActive?features.hero*.15:quick?features.density*.21:0;
  const content=context.content==='media'
    ?features.hero*.2
    :context.content==='look'?features.hero*.12:features.density*.13;
  const key=sectionId+'|'+type.id+'|'+context.segment+'|'+context.device;
  const obs=observationsV115(history,key);
  // Beta(1,1) prior to prevent an unseen variant from always losing.
  const rate=(obs.positive+1)/(obs.shown+2);
  const empirical=(rate-.5)*.6;
  const score=bound(.48+profile+attention+content+engagement+empirical,0,1);
  const reason=[
    context.segment==='new'?'Первое посещение':'Повторный визит',
    quick?'быстрый скролл':isActive?'высокая вовлечённость':'нейтральное взаимодействие',
    features.overlay?'перекрывающиеся слоты':features.hero>.45?'крупные блоки':'компактная сетка',
  ];
  return {type,score,reason,features,history:obs,key};
}
export function chooseTypeV115({types=[],candidateIds=[],section,context={},history={},exploration=15,seed='demo',fixedTypeId=null}={}){
  const ctx=normalizedContextV115(context);
  const candidates=safeCandidatesV115(types,candidateIds,section,ctx);
  const ranked=candidates.map(type=>scoreTypeV115(type,ctx,history,section?.id||'')).sort((a,b)=>b.score-a.score||String(a.type.id).localeCompare(String(b.type.id)));
  if(!ranked.length)return {selected:null,mode:'fallback',ranked,context:ctx,reason:'Нет допустимых тайпов'};
  const forced=ranked.find(x=>x.type.id===fixedTypeId);
  if(forced)return {selected:forced.type,mode:'fixed',ranked,context:ctx,reason:'Тайп зафиксирован вручную'};
  const percent=bound(exploration,0,50);
  const bucket=[seed,section?.id,ctx.segment,ctx.device,ctx.content,ctx.dwell,ctx.scroll,ctx.click,ctx.wishlist].join('|');
  const shouldExplore=ranked.length>1&&(hashV115(bucket+'|mode')%10000)/100<percent;
  // Deterministic exploration for repeatable previews: a non-leading candidate.
  const selected=shouldExplore?ranked[1+hashV115(bucket+'|arm')%(ranked.length-1)]:ranked[0];
  return {selected:selected.type,mode:shouldExplore?'exploration':'exploitation',ranked,context:ctx,
    reason:shouldExplore?'Исследование альтернативной геометрии':'Выбрана наиболее подходящая геометрия'};
}
export function recordFeedbackV115(history={},typeId,sectionId,context,positive){
  const ctx=normalizedContextV115(context);
  const key=sectionId+'|'+typeId+'|'+ctx.segment+'|'+ctx.device;
  const old=observationsV115(history,key);
  return {...history,[key]:{shown:old.shown+1,positive:old.positive+(positive?1:0)}};
}
export function personalizeSectionV115(section,types,context={},history={}){
  const policy=section?.personalizationV115;
  if(!policy?.enabled)return section;
  const decision=chooseTypeV115({types,candidateIds:policy.candidateIds,section,context,
    history,exploration:policy.exploration,fixedTypeId:policy.fixedTypeId,
    seed:policy.seed||'merchtest-v115'});
  if(!decision.selected||decision.selected.id===section.template?.id)return section;
  return {...section,template:decision.selected,typeId:decision.selected.id,
    personalizationPreviewV115:{mode:decision.mode,selectedTypeId:decision.selected.id,originalTypeId:section.template?.id}};
}
