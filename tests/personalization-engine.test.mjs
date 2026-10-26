import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseTypeV115,layoutFeaturesV115,normalizedContextV115,scoreTypeV115,personalizeSectionV115,recordFeedbackV115,safeCandidatesV115,slotCountV115,PERSONALIZATION_CONTEXT_PRESETS_V117} from '../src/personalization-engine.mjs';

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


test('research-informed scenarios normalize only supported intent and page types',()=>{
  const c=normalizedContextV115({intent:'search',pageType:'pdp',viewDepth:18,device:'mobile'});
  assert.equal(c.intent,'search');
  assert.equal(c.pageType,'pdp');
  assert.equal(c.viewDepth,18);
  const invalid=normalizedContextV115({intent:'private-attribute',pageType:'unknown',viewDepth:-500});
  assert.equal(invalid.intent,'browse');
  assert.equal(invalid.pageType,'main');
  assert.equal(invalid.viewDepth,0);
});
test('search intent prioritizes denser product geometry relative to editorial than browsing does',()=>{
  const dense=type('density',6),editorial=type('hero',2,true);
  editorial.containers[0].slots[0].span=10;
  editorial.containers[0].slots[0].rows=2;
  const base={device:'desktop',segment:'new',dwell:0,scroll:0,click:0,wishlist:0,content:'product',pageType:'plp'};
  const browseDelta=scoreTypeV115(dense,normalizedContextV115({...base,intent:'browse'})).score-
    scoreTypeV115(editorial,normalizedContextV115({...base,intent:'browse'})).score;
  const searchDelta=scoreTypeV115(dense,normalizedContextV115({...base,intent:'search'})).score-
    scoreTypeV115(editorial,normalizedContextV115({...base,intent:'search'})).score;
  assert.ok(searchDelta>browseDelta,'search should shift a ranking toward dense product layouts');
});
test('observed search cohort is not implemented as a claimed purchase probability',()=>{
  const d=chooseTypeV115({section,types:[a,b],candidateIds:['compact','editorial'],
    context:{intent:'search',pageType:'plp'},exploration:0});
  assert.ok(d.ranked.every(x=>x.score>=0&&x.score<=1));
  assert.ok(d.ranked.every(x=>x.reason.includes('есть поиск')));
});

test('every synthetic research journey produces a valid, deterministic demo recommendation',()=>{
  const names=new Set();
  for(const preset of PERSONALIZATION_CONTEXT_PRESETS_V117){
    assert.ok(preset.id&&preset.label);
    assert.ok(!names.has(preset.id));
    names.add(preset.id);
    const args={section,types:[a,b,c],candidateIds:['compact','editorial','narrow'],context:preset.context,exploration:0};
    const output=chooseTypeV115(args);
    assert.ok(output.selected?.id);
    assert.equal(output.mode,'exploitation');
    assert.equal(chooseTypeV115(args).selected.id,output.selected.id);
    assert.ok(['browse','search','wishlist','look'].includes(output.context.intent));
    assert.ok(['main','plp','pdp','cart'].includes(output.context.pageType));
  }
  assert.equal(names.size,5);
});
