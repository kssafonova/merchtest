import {readFileSync,existsSync,mkdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import sharp from 'sharp';
import {variantHexV118,parseHexColorV118,garmentZoneV118,colorVariantImagePathV118} from '../src/color-variant-spec-v118.mjs';

const parse=(path)=>{
  const [heading,...lines]=readFileSync(path,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  const names=heading.split(';').map(x=>x.trim());
  return lines.filter(Boolean).map(line=>Object.fromEntries(line.split(';').map((value,i)=>[names[i],value.trim()])));
};
const products=parse('public/data/catalog_products.csv');
const variants=parse('public/data/catalog_product_variants.csv');
const bySku=new Map(products.map(p=>[p['Артикул'],p]));
const destination='public/products/variants';
mkdirSync(destination,{recursive:true});
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const ease=(v)=>{const t=clamp(v);return t*t*(3-2*t)};
const ellipse=(x,y,cx,cy,rx,ry)=>{
  const dist=Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2);
  return 1-ease((dist-.76)/.25);
};
function garmentShape(x,y,zone){
  if(zone==='bottom')return Math.max(ellipse(x,y,.425,.72,.17,.35),ellipse(x,y,.58,.73,.17,.35));
  if(zone==='skirt')return ellipse(x,y,.5,.72,.35,.28);
  if(zone==='dress')return Math.max(ellipse(x,y,.5,.62,.32,.40),ellipse(x,y,.5,.73,.38,.23));
  if(zone==='footwear')return Math.max(ellipse(x,y,.38,.84,.23,.19),ellipse(x,y,.62,.84,.23,.19));
  if(zone==='outerwear')return Math.max(ellipse(x,y,.5,.56,.32,.39),ellipse(x,y,.25,.52,.14,.29),ellipse(x,y,.75,.52,.14,.29));
  return Math.max(ellipse(x,y,.5,.48,.32,.25),ellipse(x,y,.28,.47,.13,.19),ellipse(x,y,.72,.47,.13,.19));
}
function sampleCorners(data,width,height,channels){
  const refs=[];
  for(const [cx,cy] of [[.045,.065],[.955,.065],[.045,.94],[.955,.94]]){
    const x=Math.floor(cx*(width-1)),y=Math.floor(cy*(height-1)),sample=[];
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
      const xx=Math.max(0,Math.min(width-1,x+dx)),yy=Math.max(0,Math.min(height-1,y+dy));
      const i=(yy*width+xx)*channels;
      sample.push([data[i],data[i+1],data[i+2]]);
    }
    sample.sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]));
    refs.push(sample[Math.floor(sample.length/2)]);
  }
  return refs;
}
function recolor(input,width,height,target,zone){
  const channels=4,output=Buffer.from(input);
  const backgrounds=sampleCorners(input,width,height,channels);
  let edited=0;
  for(let y=0;y<height;y++){
    const ny=y/Math.max(1,height-1);
    for(let x=0;x<width;x++){
      const nx=x/Math.max(1,width-1);
      const shape=garmentShape(nx,ny,zone);
      if(shape<.035)continue;
      const i=(y*width+x)*channels;
      const r=input[i],g=input[i+1],b=input[i+2];
      const distance=Math.min(...backgrounds.map(bg=>Math.hypot(r-bg[0],g-bg[1],b-bg[2])));
      const foreground=ease((distance-12)/47);
      // Keep face, exposed arms and skin close to the neckline untouched.
      const warmSkin=r>74&&r>g*1.08&&g>b*1.045&&(r-b)>20;
      const isFace=ny<.32&&Math.abs(nx-.5)<.21;
      const isHands=warmSkin&&(nx<.32||nx>.68)&&ny>.30&&ny<.86;
      if(isFace||isHands)continue;
      const isSkin=warmSkin&&ny<.41;
      if(isSkin)continue;
      const center=ease((.49-Math.abs(nx-.5))/.2);
      const coverage=Math.max(foreground,center*.4);
      let alpha=shape*coverage*.94;
      if(zone==='bottom'&&ny<.48)alpha*=.12;
      if(alpha<.022)continue;
      const luma=.2126*r+.7152*g+.0722*b;
      const shading=.62+.69*luma/255;
      const neutralTexture=(luma-130)*.12;
      for(let k=0;k<3;k++){
        const painted=clamp(target[k]*shading+neutralTexture,0,255);
        output[i+k]=Math.round(input[i+k]*(1-alpha)+painted*alpha);
      }
      edited++;
    }
  }
  return {output,edited};
}
const groups=new Map();
for(const row of variants){
  const sku=row.base_sku;
  const color=row['Цвет'];
  const rgb=parseHexColorV118(variantHexV118(color));
  if(!rgb)throw Error('Неизвестный цвет SKU '+row.sku+': '+color);
  const outputName=colorVariantImagePathV118(sku,row.variant_index);
  if(!outputName)throw Error('Ошибочный вариант: '+row.sku);
  const parent=bySku.get(sku);
  const original=join('public/products',parent?.image_file||sku+'.jpg');
  if(!existsSync(original))throw Error('Нет базовой фотографии для '+sku+': '+original);
  if(!groups.has(sku))groups.set(sku,[]);
  groups.get(sku).push({row,rgb,outputName,zone:garmentZoneV118((parent?.['Категория ']||'')+' '+(parent?.['Подкатегория']||'')+' '+(parent?.['Название товара']||'')),original});
}
let produced=0,changedPixels=0;
for(const [baseSku,rows] of groups){
  const {data,info}=await sharp(rows[0].original).rotate().resize({width:650,withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const variant of rows){
    const path=join('public',variant.outputName);
    const {output,edited}=recolor(data,info.width,info.height,variant.rgb,variant.zone);
    if(edited<Math.max(100,info.width*info.height*.015))throw Error('Слишком мало перекрашенных пикселей для '+variant.row.sku+': '+edited);
    await sharp(output,{raw:{width:info.width,height:info.height,channels:4}})
      .flatten({background:'#f4f3f0'}).jpeg({quality:87,mozjpeg:true}).toFile(path);
    if(statSync(path).size<2000)throw Error('Пустой JPG '+path);
    produced++;changedPixels+=edited;
  }
}
if(produced!==variants.length)throw Error('Сгенерировано '+produced+' вместо '+variants.length);
console.log('V118: '+produced+' synthetic color-specific JPG previews ('+groups.size+' original product photos, '+changedPixels+' recolored pixels)');
