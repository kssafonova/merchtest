import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'SEMANTIC_PRODUCT_STOCK_V27';

if (!app.includes(MARKER)) {
  const anchor = 'const MEDIA_QUALITY_STOCK_V26 = true;';
  if (!app.includes(anchor)) throw new Error('SEMANTIC_PRODUCT_STOCK_V27: V26 media layer missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  const start = app.indexOf('function stockPrimaryForProduct(product) {');
  const end = app.indexOf('\nfunction RatioMediaImage(', start);
  if (start < 0 || end < 0) throw new Error('SEMANTIC_PRODUCT_STOCK_V27: product media anchors not found');

  const replacement = String.raw`
const PRODUCT_COLOR_STOCK_TAGS = {
  'бежевый': 'beige', 'светло-бежевый': 'light-beige', 'песочный': 'sand', 'кэмел': 'camel',
  'черный': 'black', 'чёрный': 'black', 'молочный': 'ivory', 'кремовый': 'cream', 'белый': 'white',
  'серый': 'grey', 'светло-серый': 'light-grey', 'темно-серый': 'dark-grey', 'тёмно-серый': 'dark-grey', 'графитовый': 'charcoal',
  'голубой': 'light-blue', 'светло-голубой': 'light-blue', 'синий': 'blue', 'темно-синий': 'navy', 'тёмно-синий': 'navy',
  'розовый': 'pink', 'пыльно-розовый': 'dusty-pink', 'пудровый': 'powder-pink', 'пастельно-розовый': 'pastel-pink',
  'лавандовый': 'lavender', 'бордовый': 'burgundy', 'красный': 'red', 'изумрудный': 'emerald-green',
  'оливковый': 'olive-green', 'хаки': 'khaki', 'темно-зеленый': 'dark-green', 'тёмно-зеленый': 'dark-green',
  'шоколадный': 'chocolate-brown', 'шампань': 'champagne',
  'черно-бежевый': 'black-beige', 'темно-сине-серый': 'navy-grey', 'зелено-молочный': 'green-ivory',
  'кремовый с цветочным принтом': 'cream-floral', 'розовый с цветочным принтом': 'pink-floral', 'голубой с цветочным принтом': 'blue-floral'
};

function normalizedStockText(value) {
  return String(value || '').trim().toLowerCase().replace(/ё/g, 'е');
}

function stockGenderTag(product) {
  const department = normalizedStockText(product?.department);
  const gender = normalizedStockText(product?.gender);
  if (department.includes('дет') || gender.includes('девоч')) return gender.includes('мальч') ? 'boy' : 'girl';
  if (gender.includes('мальч')) return 'boy';
  if (department.includes('муж') || gender.includes('муж')) return 'man';
  return 'woman';
}

function stockGarmentTags(product) {
  const name = normalizedStockText(product?.name);
  const category = normalizedStockText(product?.category);
  const sub = normalizedStockText(product?.subcategory);
  const text = [name, category, sub].join(' ');
  if (text.includes('платье-комбинац')) return ['slip-dress', 'satin'];
  if (text.includes('платье-рубаш')) return ['shirt-dress'];
  if (text.includes('плать')) return ['dress'];
  if (text.includes('джинсов') && text.includes('куртк')) return ['denim-jacket'];
  if (text.includes('кожан') && text.includes('куртк')) return ['leather-jacket'];
  if (text.includes('пальто')) return ['coat'];
  if (text.includes('тренч')) return ['trench-coat'];
  if (text.includes('плащ')) return ['raincoat', 'trench'];
  if (text.includes('бомбер')) return ['bomber-jacket'];
  if (text.includes('куртк')) return ['jacket'];
  if (text.includes('жакет') || text.includes('пиджак')) return ['blazer'];
  if (text.includes('жилет')) return ['vest'];
  if (text.includes('свитер')) return ['sweater', 'knitwear'];
  if (text.includes('кардиган')) return ['cardigan', 'knitwear'];
  if (text.includes('водолаз')) return ['turtleneck'];
  if (text.includes('худи')) return ['hoodie'];
  if (text.includes('свитшот')) return ['sweatshirt'];
  if (text.includes('лонгслив')) return ['long-sleeve-top'];
  if (text.includes('футбол')) return ['t-shirt'];
  if (text.includes('поло')) return ['polo-shirt'];
  if (text.includes('рубаш')) return ['shirt'];
  if (text.includes('блуз')) return ['blouse'];
  if (text.includes('топ')) return ['top'];
  if (text.includes('джинс')) return ['jeans', 'denim'];
  if (text.includes('палаццо')) return ['palazzo-pants'];
  if (text.includes('брюк') || text.includes('брюки')) return ['trousers'];
  if (text.includes('леггин')) return ['leggings'];
  if (text.includes('юбк') && text.includes('плис')) return ['pleated-skirt'];
  if (text.includes('юбк') && text.includes('макси')) return ['maxi-skirt'];
  if (text.includes('юбк') && text.includes('мини')) return ['mini-skirt'];
  if (text.includes('юбк')) return ['skirt'];
  if (text.includes('шорт')) return ['shorts'];
  if (text.includes('костюм')) return ['suit'];
  return ['fashion-clothing'];
}

function stockMaterialTag(product) {
  const value = normalizedStockText(product?.material);
  if (value.includes('шерст')) return 'wool';
  if (value.includes('хлоп')) return 'cotton';
  if (value.includes('сатин')) return 'satin';
  if (value.includes('деним')) return 'denim';
  if (value.includes('лен') || value.includes('лён')) return 'linen';
  if (value.includes('вискоз')) return 'viscose';
  if (value.includes('шелк') || value.includes('шёлк')) return 'silk';
  if (value.includes('кож')) return 'leather';
  if (value.includes('трикот')) return 'knitwear';
  return '';
}

function stockShapeTags(product) {
  const silhouette = normalizedStockText(product?.silhouette);
  const details = normalizedStockText(product?.details);
  const sub = normalizedStockText(product?.subcategory);
  const tags = [];
  if (silhouette.includes('оверсайз')) tags.push('oversized');
  else if (silhouette.includes('притал')) tags.push('fitted');
  else if (silhouette.includes('широк')) tags.push('wide-leg');
  else if (silhouette.includes('прям')) tags.push('straight-fit');
  if (details.includes('цветоч')) tags.push('floral');
  if (details.includes('полоск')) tags.push('striped');
  if (details.includes('плис')) tags.push('pleated');
  if (details.includes('стег')) tags.push('quilted');
  if (details.includes('колор-блок')) tags.push('color-block');
  if (sub.includes('карго')) tags.push('cargo');
  return tags;
}

function productStockSearchTags(product) {
  const rawColor = normalizedStockText(product?.color);
  const color = PRODUCT_COLOR_STOCK_TAGS[rawColor] || rawColor.replace(/\s+/g, '-');
  const tags = [stockGenderTag(product), color, ...stockGarmentTags(product), stockMaterialTag(product), ...stockShapeTags(product), 'fashion', 'model'];
  return [...new Set(tags.filter(Boolean))].slice(0, 8);
}

function semanticStockUrl(product, index, orientation = 'portrait') {
  const tags = productStockSearchTags(product).join(',');
  const seed = stableMediaSeed([product?.id, product?.modelId, product?.color, index].join('|')) + index * 97;
  const size = orientation === 'landscape' ? '1350/900' : '900/1350';
  return 'https://loremflickr.com/' + size + '/' + tags + '/all?lock=' + (seed % 100000);
}

const CURATED_PRIMARY_STOCK = {
  'LIM001|бежевый': 'https://images.pexels.com/photos/20578707/pexels-photo-20578707.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM002|черный': 'https://images.pexels.com/photos/19663784/pexels-photo-19663784.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM006|голубой': 'https://images.pexels.com/photos/17781171/pexels-photo-17781171.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM017|темно-синий': 'https://images.pexels.com/photos/19079456/pexels-photo-19079456.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM041|бежевый': 'https://images.pexels.com/photos/20578707/pexels-photo-20578707.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM042|черный': 'https://images.pexels.com/photos/19663784/pexels-photo-19663784.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM046|голубой': 'https://images.pexels.com/photos/17781171/pexels-photo-17781171.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop',
  'LIM077|темно-синий': 'https://images.pexels.com/photos/19079456/pexels-photo-19079456.jpeg?auto=compress&cs=tinysrgb&w=900&h=1350&fit=crop'
};

function curatedPrimaryStock(product) {
  const modelId = String(product?.modelId || product?.baseSku || product?.id || '').replace(/-C\d+$/, '');
  const key = modelId + '|' + normalizedStockText(product?.color);
  return CURATED_PRIMARY_STOCK[key] || '';
}

function productMediaItems(product) {
  // V27 deliberately replaces generated/local product imagery with semantic stock imagery.
  // Every URL is derived from the actual SKU name/category/color/material/fit.
  const curated = curatedPrimaryStock(product);
  const result = [];
  if (curated) result.push({ kind: 'stock', src: curated, source: 'Pexels · exact semantic match', orientation: 'portrait', primary: true });
  else result.push({ kind: 'stock', src: semanticStockUrl(product, 0, 'portrait'), source: 'Semantic stock search', orientation: 'portrait', primary: true });

  for (let index = 1; index < 4; index += 1) {
    result.push({ kind: 'stock', src: semanticStockUrl(product, index, 'portrait'), source: 'Semantic stock search', orientation: 'portrait' });
  }
  for (let index = 4; index < 6; index += 1) {
    result.push({ kind: 'stock', src: semanticStockUrl(product, index, 'landscape'), source: 'Semantic stock search', orientation: 'landscape' });
  }
  return result;
}
`;

  app = app.slice(0, start) + replacement + app.slice(end);

  // Include color in alt text so any browser-level fallback keeps product context.
  app = app.replace(/alt=\{product\.name\}/g, "alt={product.name + (product.color ? ' · ' + product.color : '')}");
  app = app.replace(/alt=\{entity\.name\}/g, "alt={entity.name + (entity.color ? ' · ' + entity.color : '')}");
  writeFileSync(appPath, app);
}

console.log('Semantic product stock v27 applied: all product photos matched by name, color and attributes');
