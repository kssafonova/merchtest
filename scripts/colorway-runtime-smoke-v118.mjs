import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {existsSync} from 'node:fs';
const server=await createServer({
  plugins:[{
    name:'sku-specific-colorway-runtime-v118',
    enforce:'pre',
    transform(code,id){
      if(!id.replaceAll('\\','/').endsWith('/src/AppV3.jsx'))return null;
      return code+'\nexport {PRODUCTS as __ColorwayProductsV118,productMediaItems as __ColorwayMediaV118,ProductMediaVisual as __ColorwayVisualV118};';
    }
  }],
  server:{middlewareMode:true},appType:'custom',logLevel:'silent'
});
try{
  const app=await server.ssrLoadModule('/src/AppV3.jsx');
  const products=app.__ColorwayProductsV118;
  const byId=new Map(products.map(product=>[product.id,product]));
  const bases=new Set();
  let total=0;
  for(const product of products.filter(p=>p.syntheticColorPreviewV118)){
    const expected='products/variants/'+product.id+'.jpg';
    const media=app.__ColorwayMediaV118(product);
    if(media.length!==1||typeof media[0]!=='string'||!media[0].endsWith('/'+expected))throw Error('Wrong photo for '+product.id+': '+JSON.stringify(media));
    if(!existsSync('public/'+expected))throw Error('Missing generated photo '+expected);
    const base=byId.get(product.baseSku);
    if(!base)throw Error('Missing original product '+product.baseSku);
    if(app.__ColorwayMediaV118(base)[0]===media[0])throw Error('Variant reused original image '+product.id);
    bases.add(product.baseSku);
    total++;
  }
  if(total!==160||bases.size!==80)throw Error('Expected 160 unique variants, found '+total+' from '+bases.size+' original items');
  const sample=byId.get('LIM001-C2');
  const html=renderToStaticMarkup(React.createElement(app.__ColorwayVisualV118,{media:app.__ColorwayMediaV118(sample)[0],alt:sample.name}));
  if(!html.includes('synthetic-color-preview-v118')||!html.includes('Цвет · демо')||!html.includes('LIM001-C2.jpg'))throw Error('SKU renderer does not show its own labelled image');
  console.log('V118 runtime smoke passed: 160 unique SKU photos, 80 source models, labelled card renderer');
}catch(error){
  console.error('V118 COLORWAY RUNTIME FAILED',error?.stack||error);
  process.exitCode=1;
}finally{await server.close();}
