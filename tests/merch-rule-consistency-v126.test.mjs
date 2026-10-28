import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibleForPlacementV126,eligibleCandidatesV126,commercialFieldV126,
  explicitStockRuleV126,requestsComingSoonV126,merchRuleIssuesV126,merchScopeIssuesV126} from '../src/merch-rule-consistency-v126.mjs';
const p=(id,ru,kz,st=null)=>({id,price:1000,stock:{RU:ru,KZ:kz},...(st?{lifecycleByRegion:{RU:st}}:{})});
const available=p('BUY',9,0),coming=p('SOON',0,4,'coming_soon'),unavailable=p('OOS',0,0);
const sales={id:'sales',titles:{ru:'Продажи'},merchPolicyV125:{objective:'sales',includeComingSoon:false}};
const teaser={id:'teaser',titles:{ru:'Анонс'},merchPolicyV125:{objective:'teaser',includeComingSoon:true}};
const turnover={id:'turnover',titles:{ru:'Остатки'},merchPolicyV125:{objective:'sell_through',includeComingSoon:false}};
const conditions=(...values)=>({enabled:true,rootOperator:'AND',conditions:values});
const stockGt0={type:'condition',field:'stock',operator:'gt',value:0};
const csMatch={type:'condition',field:'commercialState',operator:'eq',value:'coming_soon'};
test('a zero stock SKU requires explicit lifecycle status and a teaser objective',()=>{
 assert.deepEqual(eligibleCandidatesV126([coming,available,unavailable],'RU',sales).map(x=>x.id),['BUY']);
 assert.deepEqual(eligibleCandidatesV126([coming,available,unavailable],'RU',turnover).map(x=>x.id),['BUY']);
 assert.deepEqual(eligibleCandidatesV126([coming,available,unavailable],'RU',teaser).map(x=>x.id),['SOON','BUY']);
 assert.equal(eligibleForPlacementV126(coming,'KZ',teaser),true);
 assert.equal(commercialFieldV126(coming,'RU'),'coming_soon');
 assert.equal(commercialFieldV126(coming,'KZ'),'available');
 assert.equal(commercialFieldV126(unavailable,'RU'),'out_of_stock');
});
test('candidate gate NEVER reinserts merchandise excluded by the explicit stock predicate',()=>{
 const matchedAfterRule=[available]; // selected by the existing stock > 0 condition
 assert.deepEqual(eligibleCandidatesV126(matchedAfterRule,'RU',teaser).map(x=>x.id),['BUY']);
 assert.equal(explicitStockRuleV126(conditions(stockGt0)),true);
 assert.equal(explicitStockRuleV126(conditions({...stockGt0,operator:'gte',value:0})),false);
});
test('eligible candidate gate preserves the exact ranking it receives from automation',()=>{
 const sorted=[available,coming,unavailable];
 assert.deepEqual(eligibleCandidatesV126(sorted,'RU',teaser).map(x=>x.id),['BUY','SOON']);
 assert.deepEqual(eligibleCandidatesV126([coming,available],'RU',teaser).map(x=>x.id),['SOON','BUY']);
});
test('Coming Soon scenario is incompatible with a selling or STR objective',()=>{
 const rule={selection:conditions(csMatch),uiV77:{scenario:'coming_soon'},fallback:{replacementChain:[]}};
 assert.equal(requestsComingSoonV126(rule),true);
 assert.ok(merchRuleIssuesV126(sales,'RU',rule).some(x=>x.code==='coming_soon_not_allowed'&&x.severity==='error'));
 assert.ok(merchRuleIssuesV126(turnover,'RU',rule).some(x=>x.code==='coming_soon_not_allowed'));
 assert.equal(merchRuleIssuesV126(teaser,'RU',rule).length,0);
});
test('an explicit positive stock predicate is warned about but never deleted or bypassed',()=>{
 const rule={selection:conditions(stockGt0),fallback:{replacementChain:[]}};
 const issues=merchRuleIssuesV126(teaser,'RU',rule);
 assert.ok(issues.some(x=>x.code==='stock_filters_teaser'&&x.severity==='warning'));
 assert.deepEqual(rule.selection.conditions,[stockGt0]);
 assert.equal(merchRuleIssuesV126(sales,'RU',rule).length,0);
});
test('unsafe keep-OOS fallback is blocked even without automatic selection',()=>{
 const rule={selection:{enabled:false,conditions:[]},fallback:{replacementChain:[{step:'keep_oos',enabled:true}]}};
 assert.ok(merchRuleIssuesV126(sales,'RU',rule).some(x=>x.code==='keep_oos'&&x.severity==='error'));
 assert.ok(merchRuleIssuesV126(teaser,'RU',rule).some(x=>x.code==='keep_oos'));
});
test('a shared rule validates EVERY member section, not just the selected section',()=>{
 const rule={selection:conditions(csMatch),uiV77:{scenario:'coming_soon'},fallback:{replacementChain:[]}};
 const issues=merchScopeIssuesV126([teaser,sales],rule,'RU');
 assert.deepEqual(issues.filter(x=>x.severity==='error').map(x=>x.sectionId),['sales']);
 assert.equal(merchScopeIssuesV126([teaser],rule,'RU').length,0);
});
test('nested group stock restrictions are visible in compatibility diagnostics',()=>{
 const sel=conditions({type:'group',operator:'AND',conditions:[stockGt0,csMatch]});
 assert.equal(explicitStockRuleV126(sel),true);
 assert.equal(requestsComingSoonV126({selection:sel}),true);
 const issues=merchRuleIssuesV126(teaser,'RU',{selection:sel,fallback:{replacementChain:[]}});
 assert.ok(issues.some(x=>x.code==='stock_filters_teaser'));
});

test('mixed grouped goals are rejected only when shared matching pool includes a Coming Soon SKU',()=>{
 const broad={selection:conditions({type:'condition',field:'category',operator:'eq',value:'Платья'}),fallback:{replacementChain:[]}};
 assert.equal(merchScopeIssuesV126([teaser,sales],broad,'RU',[available]).length,0);
 const issues=merchScopeIssuesV126([teaser,sales],broad,'RU',[coming,available]);
 assert.ok(issues.some(x=>x.code==='mixed_commercial_scope'&&x.severity==='error'));
 assert.equal(merchScopeIssuesV126([teaser,{...teaser,id:'other'}],broad,'RU',[coming]).length,0);
});
