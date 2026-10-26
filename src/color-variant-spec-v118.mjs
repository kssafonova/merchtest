// Controlled palette for the merchandising demo color variants.
// Labels are the product-feed source of truth. These are visual simulations,
// not manufacturer-approved color samples or genuine variant photographs.
export const VARIANT_COLOR_RGB_V118 = Object.freeze({
  'черный':'#202024','кэмел':'#B98B5B','молочный':'#EEE9DD',
  'серый':'#8B8E91','бордовый':'#742336','шампань':'#D8C6A4',
  'светло-голубой':'#B7D5E7','темно-синий':'#23375B',
  'оливковый':'#696E43','белый':'#F5F4EE','красный':'#C53F43',
  'графитовый':'#444B52','бежевый':'#C9B79F','голубой':'#81B6D8',
  'розовый с цветочным принтом':'#D5A1AC',
  'голубой с цветочным принтом':'#8CBBD7',
  'лавандовый':'#B5A3D8','светло-серый':'#BDC0C2',
  'розовый':'#E1A6BD','кремовый':'#E7D7B9',
  'пыльно-розовый':'#C6929F','темно-зеленый':'#344D3E',
  'темно-сине-серый':'#46566B','зелено-молочный':'#A6B9A2',
  'синий':'#335D9C','шоколадный':'#684535'
});
export function normalizeVariantColorV118(name=''){
  return String(name).trim().toLowerCase().replace(/ё/g,'е').replace(/[–—]/g,'-').replace(/\s+/g,' ');
}
export function variantHexV118(name){
  return VARIANT_COLOR_RGB_V118[normalizeVariantColorV118(name)]||null;
}
export function parseHexColorV118(hex){
  if(!/^#[0-9a-f]{6}$/i.test(hex||''))return null;
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
}
export function colorVariantImagePathV118(baseSku,variantIndex){
  if(!/^LIM\d{3}$/.test(String(baseSku))||!Number.isInteger(Number(variantIndex))||Number(variantIndex)<2||Number(variantIndex)>3)return null;
  return 'products/variants/'+baseSku+'-C'+variantIndex+'.jpg';
}
export function garmentZoneV118(label=''){
  const s=normalizeVariantColorV118(label);
  if(/брюк|джинс|леггин|шорт|карго/.test(s))return 'bottom';
  if(/юбк/.test(s))return 'skirt';
  if(/плать|комбинац|сарафан/.test(s))return 'dress';
  if(/обув|кроссов|ботин|туфл/.test(s))return 'footwear';
  if(/пальто|тренч|плащ|куртк|жакет|пидж|бомбер/.test(s))return 'outerwear';
  return 'top';
}
