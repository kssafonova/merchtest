import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachDemoLifecycleV125,isComingSoonV125,stockForRegionV125,placementStateV125,
  auditMerchSectionV125,stripStockFromSelectionV125,merchPolicyV125,
} from '../src/merch-lifecycle-v125.mjs';
import {actualSectionV120,pageAnalyticsV120} from '../src/page-analytics-v120.mjs';
const product=(id,ru=0,kz=5,commercialStatus=null)=>({
  id,name:id,price:1000,stock:{RU:ru,KZ:kz},...(commercialStatus?{lifecycleByRegion:{RU:commercialStatus}}:{})
});
const sections=(items,policy={objective:'sales',includeComingSoon:false})=>({
  id:'S-TEST',titles:{ru:'Тест'},template:{containers:[{slots:items.map(()=>({span:4}))}]},
  merchPolicyV125:policy, resolvedSlots:items.map((entity,index)=>({index,entity,status:'pin'})),
});
test('zero inventory by itself must NOT be interpreted as Coming Soon',()=>{
  const p=product('OOS',0);
  assert.equal(isComingSoonV125(p,'RU'),false);
  assert.equal(placementStateV125(p,'RU',sections([p],{objective:'teaser',includeComingSoon:true})),'unwanted_oos');
});
test('an explicitly tagged teaser is allowed only in an announcement with permission',()=>{
  const p=product('CS',0,6,'coming_soon');
  assert.equal(isComingSoonV125(p,'RU'),true);
  assert.equal(isComingSoonV125(p,'KZ'),false);
  assert.equal(placementStateV125(p,'RU',sections([p])),'coming_soon_misplaced');
  assert.equal(placementStateV125(p,'RU',sections([p],{objective:'teaser',includeComingSoon:false})),'coming_soon_misplaced');
  assert.equal(placementStateV125(p,'RU',sections([p],{objective:'teaser',includeComingSoon:true})),'coming_soon');
});
test('available stock takes precedence even if lifecycle flag is stale',()=>{
  const p=product('STALE',3,5,'coming_soon');
  assert.equal(isComingSoonV125(p,'RU'),false);
  assert.equal(placementStateV125(p,'RU',sections([p])),'available');
});
test('audit separates total zero-stock, correct Coming Soon and unwanted OOS',()=>{
  const coming=product('CS',0,5,'coming_soon'),unavailable=product('OOS',0),available=product('OK',8);
  const a=auditMerchSectionV125(sections([coming,unavailable,available],{objective:'teaser',includeComingSoon:true}),'RU');
  assert.deepEqual([a.products,a.zeroStock,a.comingSoon,a.unwantedOos,a.commercialOos,a.available],[3,2,1,1,1,1]);
  const b=auditMerchSectionV125(sections([coming,unavailable],{objective:'sales',includeComingSoon:false}),'RU');
  assert.equal(b.comingSoonMisplaced,1);
  assert.equal(b.commercialOos,2);
});
test('no stock feed means unknown, not automatically OOS',()=>{
  const p={id:'UNKNOWN',price:10};
  assert.equal(stockForRegionV125(p,'RU'),null);
  assert.equal(placementStateV125(p,'RU',sections([p])),'unknown');
});
test('demo lifecycle is explicit, region-scoped and does not rewrite source objects',()=>{
  const source=product('LIM019',0,7),other=product('LIM020',0);
  const result=attachDemoLifecycleV125([source,other]);
  assert.equal(source.lifecycleByRegion,undefined);
  assert.equal(result[0].lifecycleByRegion.RU,'coming_soon');
  assert.equal(result[0].demoLifecycleV125,true);
  assert.equal(result[1].lifecycleByRegion,undefined);
  assert.equal(isComingSoonV125(result[0],'KZ'),false);
});
test('strip stock from teaser selection but preserve collection and nested conditions',()=>{
  const original={enabled:true,rootOperator:'AND',conditions:[
    {type:'condition',field:'stock',operator:'gt',value:0},
    {type:'condition',field:'collection',operator:'eq',value:'W26'},
    {type:'group',operator:'AND',children:[
      {type:'condition',field:'category',operator:'eq',value:'Платья'},
      {type:'condition',field:'stock',operator:'gt',value:0},
    ]},
  ]};
  const result=stripStockFromSelectionV125(original);
  assert.equal(result.conditions.length,2);
  assert.equal(result.conditions[0].field,'collection');
  assert.deepEqual(result.conditions[1].children.map(x=>x.field),['category']);
  assert.equal(original.conditions.length,3);
});
test('commercial audit is reflected in existing page and section analytics without fictional STR',()=>{
  const soon=product('CS',0,5,'coming_soon'),oos=product('OOS',0);
  const teaser=sections([soon,oos],{objective:'teaser',includeComingSoon:true});
  const a=actualSectionV120(teaser,'RU');
  assert.deepEqual([a.oos,a.comingSoon,a.commercialOos],[2,1,1]);
  const report=pageAnalyticsV120([teaser],{mode:'actual',region:'RU'});
  assert.deepEqual([report.totals.oos,report.totals.comingSoon,report.totals.commercialOos],[2,1,1]);
  assert.equal(report.behavior.orders,null);
  assert.ok(report.issues.some(issue=>issue.kind==='coming_soon'));
  assert.ok(report.issues.some(issue=>issue.kind==='oos'));
});
test('unknown policy falls back to conversion, not teaser',()=>{
  assert.deepEqual(merchPolicyV125({merchPolicyV125:{objective:'unknown',includeComingSoon:true}}),
    {objective:'sales',includeComingSoon:true});
  assert.equal(placementStateV125(product('CS',0,5,'coming_soon'),'RU',{merchPolicyV125:{objective:'unknown',includeComingSoon:true}}),'coming_soon_misplaced');
});
