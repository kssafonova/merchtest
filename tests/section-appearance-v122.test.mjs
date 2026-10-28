import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionAppearanceV122,sectionStyleVarsV122,applySectionAppearanceV122} from '../src/section-appearance-v122.mjs';

test('legacy padding remains on top and bottom until each is independently changed',()=>{
  const current={id:'s',styleV57:{background:'#ffccd0',textColor:'#00aabb',padding:24}};
  const a=sectionAppearanceV122(current.styleV57);
  assert.deepEqual([a.paddingTop,a.paddingBottom],[24,24]);
  const b=applySectionAppearanceV122(current,{paddingTop:72});
  assert.equal(sectionAppearanceV122(b.styleV57).paddingTop,72);
  assert.equal(sectionAppearanceV122(b.styleV57).paddingBottom,24);
  assert.equal(current.styleV57.paddingTop,undefined);
});
test('style patches preserve unrelated section data and translate into real CSS variables',()=>{
  const section={id:'x',pins:{0:'ABC'},rules:{mode:'manual'},styleV57:{background:'#ffffff',padding:16}};
  const result=applySectionAppearanceV122(section,{background:'#aabbcc',textColor:'#222222',paddingBottom:8,hideElements:true});
  assert.equal(result.pins,section.pins);
  assert.equal(result.rules,section.rules);
  assert.equal(result.styleV57.padding,16);
  const css=sectionStyleVarsV122(result.styleV57);
  assert.equal(css['--merch-section-bg-v122'],'#AABBCC');
  assert.equal(css['--merch-section-ink-v122'],'#222222');
  assert.equal(css['--merch-section-top-v122'],'16px');
  assert.equal(css['--merch-section-bottom-v122'],'8px');
});
test('malformed numeric and hex styles are safely normalized',()=>{
  const v=sectionAppearanceV122({background:'foo',textColor:'#12345',paddingTop:-12,paddingBottom:9999});
  assert.equal(v.background,'#FFFFFF');
  assert.equal(v.textColor,'#111111');
  assert.equal(v.paddingTop,0);
  assert.equal(v.paddingBottom,240);
});
