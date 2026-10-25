import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseTypeV115,layoutFeaturesV115,personalizeSectionV115,recordFeedbackV115,safeCandidatesV115,slotCountV115} from '../src/personalization-engine.mjs';

const type=(id,slots,overlap=false)=>({id,label:id,layoutV2:true,containers:[{
  cols:12,figmaOverlayV111:overlap,slots:Array.from({length:slots},(_,i)=>({slotIndex:i,start:1+i,span:1,rowStart:1,rows:1})),
}],mobileContainers:[{cols:4,slots:Array.from({length:slots},(_,i)=>({slotIndex:i,start:1,span:2,rowStart:1+i,rows:1}))}]});
const a=type('compact',5),b=type('editorial',3,true),c=type('narrow',1);
const section={id:'s1',template:a,typeId:a.id,pins:{},titles:{ru:'Секция'}};
test('same arm and context produce deterministic preview decision',()=>{
  const args={section,types:[a,b,c],candidateIds:['compact','editorial'],context:{segment:'new',device:'desktop',content:'media',dwell:42,scroll:20},exploration:25};
  assert.deepEqual(chooseTypeV115(args).selected.id,chooseTypeV115(args).selected.id);
  assert.equal(chooseTypeV115(args).ranked.length,2);
});
test('zero exploration always exploits leading candidate',()=>{
  const d=chooseTypeV115({section,types:[a,b,c],candidateIds:['compact','editorial'],context:{segment:'returning'},exploration:0});
  assert.equal(d.mode,'exploitation');
  assert.equal(d.selected.id,d.ranked[0].type.id);
});
test('fixed section type wins even when score differs',()=>{
  const d=chooseTypeV115({section,types:[a,b,c],candidateIds:['compact','editorial'],fixedTypeId:'compact',exploration:50,context:{content:'media'}});
  assert.equal(d.selected.id,'compact');
  assert.equal(d.mode,'fixed');
});
test('pinned slots prohibit geometry with fewer slots',()=>{
  const pinned={...section,pins:{4:{entityId:'sku1'}}};
  const eligible=safeCandidatesV115([a,b,c],['compact','editorial','narrow'],pinned,{device:'desktop'});
  assert.deepEqual(eligible.map(x=>x.id),['compact']);
});
test('missing or retired candidates fall back to the original type',()=>{
  const result=chooseTypeV115({section,types:[b,c],candidateIds:['unknown'],context:{device:'mobile'}});
  assert.equal(result.selected.id,'compact');
});
test('editorial overlap is a layout feature, not an import error',()=>{
  assert.equal(layoutFeaturesV115(b).overlay,true);
  assert.equal(slotCountV115(b,'mobile'),3);
});
test('positive feedback accumulates under contextual arm, never implies real sales',()=>{
  const ctx={segment:'new',device:'desktop'};
  const hist=recordFeedbackV115({},'editorial','s1',ctx,true);
  const after=recordFeedbackV115(hist,'editorial','s1',ctx,false);
  assert.deepEqual(after['s1|editorial|new|desktop'],{shown:2,positive:1});
});
test('disabled policy does not modify section template or pinned content',()=>{
  const src={...section,pins:{0:{entityId:'sku1'}},personalizationV115:{enabled:false}};
  assert.equal(personalizeSectionV115(src,[a,b],{content:'media'}),src);
});
test('enabled policy changes geometry without editing original section',()=>{
  const src={...section,personalizationV115:{enabled:true,candidateIds:['compact','editorial'],fixedTypeId:'editorial',exploration:0}};
  const result=personalizeSectionV115(src,[a,b],{content:'media'});
  assert.equal(result.template.id,'editorial');
  assert.equal(src.template.id,'compact');
  assert.equal(result.typeId,'editorial');
});
