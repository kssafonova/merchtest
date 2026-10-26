import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {variantHexV118,colorVariantImagePathV118,garmentZoneV118,parseHexColorV118} from '../src/color-variant-spec-v118.mjs';

const values=readFileSync('public/data/catalog_product_variants.csv','utf8').trim().split(/\r?\n/).slice(1).map(s=>{
  const [baseSku,sku,variantIndex,color]=s.split(';');
  return {baseSku,sku,variantIndex,color};
});
test('every declared color-model SKU has an explicit, valid and non-shared photo path',()=>{
  assert.equal(values.length,160);
  const paths=new Set();
  for(const row of values){
    const color=variantHexV118(row.color);
    assert.ok(color,'Unknown color for '+row.sku+': '+row.color);
    assert.equal(parseHexColorV118(color)?.length,3);
    const path=colorVariantImagePathV118(row.baseSku,row.variantIndex);
    assert.equal(path,'products/variants/'+row.sku+'.jpg');
    assert.ok(!paths.has(path),'Duplicate SKU photo path: '+path);
    paths.add(path);
  }
  assert.equal(paths.size,160);
});
test('all three colorways of a base model use distinguishable color descriptions',()=>{
  const base=readFileSync('public/data/catalog_products.csv','utf8').split(/\r?\n/);
  const byBase=new Map(base.slice(1).map(line=>line.split(';')).filter(parts=>parts.length>10).map(row=>[row[0],row[9]]));
  for(const row of values){
    const candidates=[byBase.get(row.baseSku),...values.filter(v=>v.baseSku===row.baseSku).map(v=>v.color)];
    assert.equal(new Set(candidates.filter(Boolean).map(variantHexV118)).size,3,row.baseSku+' has repeated target palette colors');
  }
});
test('color parser handles shade names, pattern names and sensible garment regions',()=>{
  assert.equal(variantHexV118('ТЁМНО-СИНИЙ'),'#23375B');
  assert.ok(variantHexV118('Розовый с цветочным принтом'));
  assert.equal(garmentZoneV118('Джинсы женские'),'bottom');
  assert.equal(garmentZoneV118('Пальто мужское'),'outerwear');
  assert.equal(garmentZoneV118('Платье вечернее'),'dress');
  assert.equal(colorVariantImagePathV118('bad name',2),null);
});
