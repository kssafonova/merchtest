import test from 'node:test';
import assert from 'node:assert/strict';
import {actualSectionV120,pageAnalyticsV120,eventMetricsV120,insightsV120,VIEWABILITY_POLICY_V120} from '../src/page-analytics-v120.mjs';

const product=(id,stock=5,color='Красный')=>({id,name:id,price:1200,stock:{RU:stock},color,category:'Платья'});
const template={id:'LAYOUT-3',containers:[{cols:12,slots:[{slotIndex:0},{slotIndex:1},{slotIndex:2}]}]};
const section=(id,slots,pins={})=>({id,typeId:'LAYOUT-3',template,pins,titles:{ru:id},resolvedSlots:slots.map((e,i)=>({index:i,entity:e,status:e?(Object.hasOwn(pins,i)?'pin':'auto'):'empty'}))});
const a=section('a',[product('SKU-A'),product('SKU-B',0),null],{0:'SKU-A'});
const b=section('b',[product('SKU-A'),product('SKU-C'),null]);
test('source-of-truth merchandising facts are derived from live resolved page sections',()=>{
 const x=actualSectionV120(a,'RU');
 assert.deepEqual([x.capacity,x.filled,x.empty,x.oos,x.pinned,x.automated],[3,2,1,1,1,1]);
 assert.equal(x.slots[1].stock,0);
 assert.equal(x.categoryCounts['Платья'],2);
});
test('real mode never makes up page views, CTR, revenue, or orders without events',()=>{
 const x=pageAnalyticsV120([a,b],{mode:'actual',region:'RU'});
 assert.equal(x.mode,'actual');
 assert.equal(x.behavior.ctr,null);
 assert.equal(x.behavior.orders,null);
 assert.equal(x.behavior.revenue,null);
 assert.equal(x.records[0].behavior.exposures,null);
 assert.deepEqual([x.totals.sections,x.totals.slots,x.totals.filled,x.totals.oos,x.totals.duplicatedSku],[2,6,4,1,1]);
 assert.ok(x.issues.some(i=>i.kind==='duplicate'));
 assert.ok(x.issues.some(i=>i.kind==='oos'));
 assert.ok(x.issues.some(i=>i.kind==='empty'));
 assert.equal(x.eventConnected,false);
});
test('synthetic demo is labeled, deterministic, and mathematically bounded',()=>{
 const options={mode:'demo',period:7,traffic:'organic',device:'mobile'};
 const a1=pageAnalyticsV120([a,b],options),a2=pageAnalyticsV120([a,b],options);
 assert.deepEqual(a1,a2);
 assert.equal(a1.mode,'demo');
 assert.match(a1.disclaimer,/Симулированные/);
 assert.ok(a1.behavior.exposures>=a1.behavior.clicks);
 assert.ok(a1.behavior.clicks>=a1.behavior.carts);
 assert.ok(a1.behavior.carts>=a1.behavior.orders);
 assert.equal(a1.totals.filled,4);
});
test('events are scoped by section and slot to avoid attribution leakage',()=>{
 const events=[
  {type:'section_view',section_id:'a'},
  {type:'slot_view',section_id:'a',slot_id:0},
  {type:'slot_click',section_id:'a',slot_id:0},
  {type:'slot_add_to_cart',section_id:'a',slot_id:0},
  {type:'slot_purchase',section_id:'a',slot_id:0,revenue:2200},
  {type:'slot_purchase',section_id:'b',slot_id:0,revenue:4400},
 ];
 const x=eventMetricsV120(events,'a',0);
 assert.deepEqual([x.exposures,x.clicks,x.carts,x.orders,x.revenue,x.ctr],[1,1,1,1,2200,100]);
 assert.equal(eventMetricsV120(events,'b',0).revenue,4400);
 assert.equal(eventMetricsV120(events,'a',1).exposures,0);
 assert.equal(eventMetricsV120(events,'a',null).exposures,1);
});
test('empty page and incomplete product stock remain safe',()=>{
 const x=pageAnalyticsV120([],{mode:'actual'});
 assert.equal(x.totals.slots,0);
 assert.equal(x.records.length,0);
 assert.equal(x.behavior.orders,null);
 const noStock=product('SKU-X');
 delete noStock.stock;
 assert.equal(actualSectionV120(section('x',[noStock,null,null]),'RU').knownStock,0);
 assert.match(VIEWABILITY_POLICY_V120,/50%/);
});
