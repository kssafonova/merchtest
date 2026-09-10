import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'AUTOMATION_MASTER_V63';

function functionChunk(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(MARKER + ': function ' + name + ' missing');
  const end = source.indexOf('\nfunction ', start + name.length + 10);
  if (end < 0) throw new Error(MARKER + ': end of function ' + name + ' missing');
  return { start, end, chunk: source.slice(start, end) };
}

if (!app.includes(MARKER)) {
  const anchor = 'const SECTION_TOOLBAR_VISIBILITY_HINT_V62 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V62 marker missing');

  app = app.replace(/import React, \{([^}]+)\} from 'react';/, (match, imports) => {
    const names = imports.split(',').map((item) => item.trim()).filter(Boolean);
    if (!names.includes('useEffect')) names.push('useEffect');
    if (!names.includes('useRef')) names.push('useRef');
    return "import React, { " + names.join(', ') + " } from 'react';";
  });

  const helpers = String.raw`
const AUTOMATION_MASTER_V63 = true;
const AUTOMATION_MAX_GROUP_SECTIONS_V63 = 20;
const AUTOMATION_MAX_REPEAT_V63 = 3;
const AUTOMATION_STATUS_DEBOUNCE_V63 = 500;
const AUTOMATION_LIVE_DELAY_DEFAULT_V63 = 300;

const AUTOMATION_FIELDS_V63 = [
  { key:'id', label:'Артикул / SKU', type:'text' },
  { key:'department', label:'Отдел', type:'select' },
  { key:'gender', label:'Гендер', type:'select' },
  { key:'category', label:'Категория', type:'select' },
  { key:'subcategory', label:'Подкатегория', type:'select' },
  { key:'name', label:'Название товара', type:'text' },
  { key:'material', label:'Материал', type:'select' },
  { key:'price', label:'Цена', type:'number' },
  { key:'discount', label:'Скидка, %', type:'number' },
  { key:'color', label:'Цвет', type:'select' },
  { key:'collection', label:'Коллекция', type:'select' },
  { key:'silhouette', label:'Силуэт / фасон', type:'select' },
  { key:'ageGroup', label:'Возрастная группа', type:'select' },
  { key:'fit', label:'Посадка', type:'select' },
  { key:'length', label:'Длина изделия', type:'select' },
  { key:'sleeveLength', label:'Длина рукава', type:'select' },
  { key:'details', label:'Детали', type:'text' },
  { key:'stock', label:'Остаток', type:'number' },
  { key:'l7d', label:'Продажи L7D', type:'number' },
  { key:'publishedAt', label:'Дата поступления / публикации', type:'date' },
  { key:'isNew', label:'Новинка', type:'boolean' },
  { key:'tags', label:'Теги', type:'multiselect' },
];

const AUTOMATION_OPERATORS_V63 = {
  text: [['eq','Равно ='],['not_eq','Не равен !='],['contains','Содержит'],['not_contains','Не содержит']],
  select: [['eq','Равно ='],['not_eq','Не равен !='],['contains','Содержит'],['not_contains','Не содержит']],
  multiselect: [['contains','Содержит'],['not_contains','Не содержит'],['eq','Равно ='],['not_eq','Не равен !=']],
  number: [['eq','Равно ='],['not_eq','Не равен !='],['gt','Больше >'],['lt','Меньше <'],['gte','Больше или равно >='],['lte','Меньше или равно <=']],
  date: [['eq','Равно ='],['not_eq','Не равен !='],['gt','Позже >'],['lt','Раньше <'],['gte','Позже или равно >='],['lte','Раньше или равно <=']],
  boolean: [['eq','Равно ='],['not_eq','Не равен !=']],
};

const AUTOMATION_SORTS_V63 = [
  ['freshness','Новизна'],
  ['l7d','Продажи L7D'],
  ['stock','Остаток'],
  ['discount','Скидка'],
  ['price','Цена'],
  ['id','Артикул'],
];

const AUTOMATION_GROUP_COLORS_V63 = ['#1473E6','#6E56CF','#0B7A75','#B05A13','#A23B72','#3A6B35'];
const AUTOMATION_RESERVE_CACHE_V63 = new Map();
const AUTOMATION_SKU_WATCH_V63 = new Map();
const AUTOMATION_LIVE_QUEUE_V63 = new Map();

function automationCloneV63(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function defaultAutomationRuleV63(sectionId = '') {
  return {
    ruleId: 'RULE-' + (sectionId || Math.random().toString(36).slice(2,8)),
    state: 'draft',
    scope: { type:'single_section', sectionIds: sectionId ? [sectionId] : [] },
    selection: { enabled:false, rootOperator:'AND', conditions:[] },
    sorting: { enabled:false, level1:{ criterion:'freshness', direction:'desc' }, level2:{ criterion:'id', direction:'asc' } },
    dedup: { noRepeatSkuAcrossSections:true, colorLimit:{ mode:'fixed', value:1 } },
    distribution: { groupStrategy:'fill_slots_with_reserve', gridCapacity:null, fillMode:'fixed_slots', sectionUnderfillStrategy:'leave_empty', sectionUnderfillLocked:false, maxRepeatCount:3 },
    fallback: { replacementChain:[{step:'other_color',enabled:true,order:1},{step:'from_reserve',enabled:true,order:2}], emptySlotBehavior:'collapse_and_center', applyOnLiveDelaySec:300, fallbackCategoryId:'', hideSection:true },
    manualPins: [],
    status: { coverage:0, reserveCount:0, pinCount:0, skuConflicts:0, lastRecalculatedAt:null },
  };
}

function legacyConditionToMasterV63(condition) {
  if (!condition) return null;
  if (condition.type === 'group') return { type:'group', id:condition.id || 'group-' + Math.random().toString(36).slice(2,7), operator:condition.operator === 'OR' ? 'OR' : 'AND', conditions:(condition.conditions || []).filter((item) => item?.type !== 'group').map(legacyConditionToMasterV63).filter(Boolean) };
  return { type:'condition', id:condition.id || 'cond-' + Math.random().toString(36).slice(2,7), field:condition.field || condition.attribute || 'category', operator:condition.operator === 'neq' ? 'not_eq' : (condition.operator || 'eq'), value:condition.value ?? '' };
}

function normalizeAutomationRuleV63(source = {}, sectionId = '') {
  if (source?.selection && source?.distribution && source?.fallback) {
    const base = defaultAutomationRuleV63(sectionId);
    const next = {
      ...base, ...automationCloneV63(source),
      scope:{ ...base.scope, ...(source.scope || {}) },
      selection:{ ...base.selection, ...(source.selection || {}), conditions:(source.selection?.conditions || []).map(legacyConditionToMasterV63).filter(Boolean) },
      sorting:{ ...base.sorting, ...(source.sorting || {}), level1:{...base.sorting.level1,...(source.sorting?.level1 || {})}, level2:{...base.sorting.level2,...(source.sorting?.level2 || {})} },
      dedup:{ ...base.dedup, ...(source.dedup || {}), colorLimit:{...base.dedup.colorLimit,...(source.dedup?.colorLimit || {})} },
      distribution:{ ...base.distribution, ...(source.distribution || {}), maxRepeatCount:Math.max(1,Math.min(AUTOMATION_MAX_REPEAT_V63,Number(source.distribution?.maxRepeatCount || 3))) },
      fallback:{ ...base.fallback, ...(source.fallback || {}), replacementChain:(source.fallback?.replacementChain || base.fallback.replacementChain).map((step,index)=>({...step,order:index+1})) },
      status:{ ...base.status, ...(source.status || {}) },
    };
    return next;
  }
  const base = defaultAutomationRuleV63(sectionId);
  const legacyConditions = (source?.conditions || []).map(legacyConditionToMasterV63).filter(Boolean);
  const legacySorts = Array.isArray(source?.sorts) ? source.sorts.filter((item)=>item && item !== 'none') : source?.sortBy ? [source.sortBy] : [];
  const sortMap = (key) => {
    const normalized = String(key || '');
    if (normalized.includes('stock')) return {criterion:'stock',direction:normalized.includes('asc') ? 'asc' : 'desc'};
    if (normalized.includes('price')) return {criterion:'price',direction:normalized.includes('asc') ? 'asc' : 'desc'};
    if (normalized.includes('discount')) return {criterion:'discount',direction:'desc'};
    if (normalized.includes('new')) return {criterion:'freshness',direction:normalized.includes('asc') ? 'asc' : 'desc'};
    if (normalized.includes('l7d')) return {criterion:'l7d',direction:normalized.includes('asc') ? 'asc' : 'desc'};
    return {criterion:'id',direction:'asc'};
  };
  const level1 = sortMap(legacySorts[0]);
  const level2 = sortMap(legacySorts[1] || 'id');
  return {
    ...base,
    ruleId: source?.ruleId || base.ruleId,
    state: source?.state || 'draft',
    publishedSnapshot: source?.publishedSnapshot || source?.publishedRuleV63 || null,
    selection:{ enabled:source?.fillMode === 'rules' || source?.selectionEnabled === true, rootOperator:source?.conditionLogic === 'OR' ? 'OR' : 'AND', conditions:legacyConditions },
    sorting:{ enabled:legacySorts.length > 0, level1, level2 },
    dedup:{ noRepeatSkuAcrossSections:source?.dedupe !== false, colorLimit:{ mode:source?.colorMode === 'all' ? 'all_colors' : source?.colorMode === 'custom' ? 'custom' : 'fixed', value:Number(source?.maxColors || 1) } },
    distribution:{ ...base.distribution, gridCapacity:source?.gridCapacity ?? null, fillMode:source?.distributionFillMode || 'fixed_slots', sectionUnderfillStrategy:source?.underfillStrategy || 'leave_empty', maxRepeatCount:Math.max(1,Math.min(3,Number(source?.maxRepeatCount || 3))) },
    fallback:{ ...base.fallback, replacementChain:[{step:'other_color',enabled:source?.preferColorFallback !== false,order:1},{step:'from_reserve',enabled:source?.oos !== 'keep',order:2}], emptySlotBehavior:source?.oos === 'keep' ? 'leave_with_oos_badge' : 'collapse_and_center', applyOnLiveDelaySec:Number(source?.applyOnLiveDelaySec || 300) },
  };
}

function automationCompatRulesV63(master, previous = {}) {
  const normalized = normalizeAutomationRuleV63(master, master?.scope?.sectionIds?.[0] || '');
  const activeSorts = normalized.sorting.enabled ? [normalized.sorting.level1, normalized.sorting.level2].filter(Boolean).map((item)=> item.criterion === 'freshness' ? 'new_' + item.direction : item.criterion + '_' + item.direction) : [];
  return {
    ...previous,
    ...normalized,
    fillMode: normalized.selection.enabled ? 'rules' : 'manual',
    conditionLogic: normalized.selection.rootOperator,
    conditions: normalized.selection.conditions,
    sorts: activeSorts,
    sortBy: activeSorts[0] || 'none',
    dedupe: normalized.dedup.noRepeatSkuAcrossSections,
    colorMode: normalized.dedup.colorLimit.mode === 'all_colors' ? 'all' : normalized.dedup.colorLimit.mode === 'custom' ? 'custom' : 'one',
    maxColors: normalized.dedup.colorLimit.value,
    oos: normalized.fallback.emptySlotBehavior === 'leave_with_oos_badge' ? 'keep' : 'fallback',
    emptyBehavior: normalized.fallback.emptySlotBehavior === 'collapse_and_center' ? 'collapse-center' : 'keep',
    maxRepeatCount: normalized.distribution.maxRepeatCount,
    applyOnLiveDelaySec: normalized.fallback.applyOnLiveDelaySec,
  };
}

function automationFieldV63(key) { return AUTOMATION_FIELDS_V63.find((item)=>item.key===key) || AUTOMATION_FIELDS_V63[0]; }
function automationOperatorsForFieldV63(key) { return AUTOMATION_OPERATORS_V63[automationFieldV63(key).type] || AUTOMATION_OPERATORS_V63.text; }
function automationProductValueV63(product, field, region) {
  if (field === 'stock') return Number(product?.stock?.[region] ?? product?.stockValue ?? 0);
  if (field === 'publishedAt') return product?.publishedAt || product?.availableFrom || product?.createdAt || product?.releaseDate || '';
  if (field === 'tags') return product?.tags || product?.labels || [];
  return product?.[field];
}
function automationNormalizeValueV63(value, type) {
  if (type === 'number') return Number(value || 0);
  if (type === 'boolean') return value === true || String(value) === 'true';
  if (type === 'date') { const n = value ? Date.parse(value) : NaN; return Number.isFinite(n) ? n : 0; }
  if (type === 'multiselect') return Array.isArray(value) ? value.map((item)=>String(item).trim().toLowerCase()) : String(value || '').split(',').map((item)=>item.trim().toLowerCase()).filter(Boolean);
  return String(value ?? '').trim().toLowerCase();
}

function buildAutomationIndexV63() {
  const docs = new Map();
  const exact = new Map();
  PRODUCTS.forEach((product) => {
    docs.set(String(product.id), product);
    AUTOMATION_FIELDS_V63.forEach((field) => {
      if (field.type === 'number' || field.type === 'date' || field.key === 'stock') return;
      const raw = automationProductValueV63(product, field.key, 'RU');
      const values = field.type === 'multiselect' ? automationNormalizeValueV63(raw, field.type) : [automationNormalizeValueV63(raw, field.type)];
      if (!exact.has(field.key)) exact.set(field.key, new Map());
      values.forEach((value) => {
        const map = exact.get(field.key);
        const key = String(value);
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(String(product.id));
      });
    });
  });
  return { docs, exact, all:new Set(docs.keys()) };
}
const AUTOMATION_PRODUCT_INDEX_V63 = buildAutomationIndexV63();

function automationConditionMatchesV63(product, condition, region) {
  const field = automationFieldV63(condition.field || condition.attribute);
  const actual = automationNormalizeValueV63(automationProductValueV63(product, field.key, region), field.type);
  const expected = automationNormalizeValueV63(condition.value, field.type);
  const op = condition.operator === 'neq' ? 'not_eq' : (condition.operator || 'eq');
  if (field.type === 'multiselect') {
    const list = Array.isArray(actual) ? actual : [actual];
    const target = Array.isArray(expected) ? expected : [expected];
    const any = target.some((item)=>list.includes(item));
    if (op === 'not_contains' || op === 'not_eq') return !any;
    return any;
  }
  if (op === 'contains') return String(actual).includes(String(expected));
  if (op === 'not_contains') return !String(actual).includes(String(expected));
  if (op === 'not_eq') return actual !== expected;
  if (op === 'gt') return actual > expected;
  if (op === 'lt') return actual < expected;
  if (op === 'gte') return actual >= expected;
  if (op === 'lte') return actual <= expected;
  return actual === expected;
}

function automationNodeMatchesV63(product, node, region, depth = 0) {
  if (!node) return true;
  if (node.type === 'group') {
    if (depth >= 1) return true;
    const children = (node.conditions || []).filter((item)=>item?.type !== 'group');
    if (!children.length) return true;
    const values = children.map((item)=>automationNodeMatchesV63(product,item,region,depth+1));
    return node.operator === 'OR' ? values.some(Boolean) : values.every(Boolean);
  }
  if (String(node.value ?? '').trim() === '') return true;
  return automationConditionMatchesV63(product,node,region);
}

function queryAutomationIndexV63(selection, region) {
  if (!selection?.enabled) return [];
  const conditions = (selection.conditions || []).filter(Boolean);
  if (!conditions.length) return [];
  const result = [];
  for (const product of AUTOMATION_PRODUCT_INDEX_V63.docs.values()) {
    const values = conditions.map((node)=>automationNodeMatchesV63(product,node,region,0));
    const matched = selection.rootOperator === 'OR' ? values.some(Boolean) : values.every(Boolean);
    if (matched) result.push(product);
  }
  return result;
}

function automationFreshnessV63(product) {
  const raw = product?.publishedAt || product?.availableFrom || product?.createdAt || product?.releaseDate;
  const parsed = raw ? Date.parse(raw) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  const index = PRODUCTS.findIndex((item)=>item.id === product.id);
  return (product?.isNew ? 1000000000 : 0) + Math.max(0, PRODUCTS.length - index);
}
function automationCompareV63(a,b,level,region) {
  const criterion = level?.criterion || 'id';
  const direction = level?.direction === 'asc' ? 1 : -1;
  let av; let bv;
  if (criterion === 'freshness') { av=automationFreshnessV63(a); bv=automationFreshnessV63(b); }
  else if (criterion === 'stock') { av=automationProductValueV63(a,'stock',region); bv=automationProductValueV63(b,'stock',region); }
  else if (criterion === 'id') return direction * String(a.id).localeCompare(String(b.id),'ru',{numeric:true});
  else { av=Number(a?.[criterion] || 0); bv=Number(b?.[criterion] || 0); }
  return av === bv ? 0 : direction * (av > bv ? 1 : -1);
}
function automationSortV63(items, rule, region) {
  if (!rule?.sorting?.enabled) return [...items];
  return [...items].sort((a,b)=> automationCompareV63(a,b,rule.sorting.level1,region) || automationCompareV63(a,b,rule.sorting.level2,region) || String(a.id).localeCompare(String(b.id),'ru',{numeric:true}));
}
function automationModelKeyV63(product) { return String(product?.modelId || product?.model || product?.baseSku || product?.parentSku || product?.name || product?.id || ''); }
function automationColorLimitV63(items, rule) {
  const cfg = rule?.dedup?.colorLimit || {mode:'fixed',value:1};
  if (cfg.mode === 'all_colors') return [...items];
  const limit = cfg.mode === 'custom' ? Math.max(1,Number(cfg.value || 1)) : 1;
  const count = new Map();
  return items.filter((product) => {
    const key = automationModelKeyV63(product);
    const current = count.get(key) || 0;
    if (current >= limit) return false;
    count.set(key,current+1);
    return true;
  });
}
function automationOtherColorV63(product, candidates, used, region) {
  if (!product) return null;
  const model = automationModelKeyV63(product);
  return candidates.find((candidate)=> candidate.id !== product.id && automationModelKeyV63(candidate) === model && Number(automationProductValueV63(candidate,'stock',region)) > 0 && !used.has(candidate.id)) || null;
}
function automationEmptySlotV63(index, rule, original = null, warning = '') {
  if (rule?.fallback?.emptySlotBehavior === 'leave_with_oos_badge' && original) return { index, status:'pin', entity:original, warning:warning || 'Нет в наличии', origin:'manual' };
  return { index, status: rule?.fallback?.emptySlotBehavior === 'collapse_and_center' ? 'collapsed' : 'empty', entity:null, warning:warning || null };
}
function automationReserveKeyV63(rule, region) { return region + ':' + (rule?.ruleId || 'rule'); }

function resolveSectionV63(section, region, context = null, forcedRule = null) {
  const rule = normalizeAutomationRuleV63(forcedRule || section?.groupRuleV63 || section?.rules || {}, section.id);
  const slotCapacity = Math.max(0, slotCount(section.template));
  const capacity = Math.max(1, Math.min(slotCapacity || 1, Number(rule.distribution.gridCapacity || slotCapacity || 1)));
  const ctx = context || { usedAcross:new Set(), reservePool:[], conflicts:new Set() };
  const pinEntries = Object.entries(section.pins || {}).map(([position,id])=>({position:Number(position),id}));
  rule.manualPins = pinEntries.filter((item)=>entityKind(item.id)==='product').map((item)=>({sku:item.id,position:item.position}));

  let rawCandidates = queryAutomationIndexV63(rule.selection,region);
  let fallbackUsed = false;
  if (rule.selection.enabled && !rawCandidates.length && rule.fallback.fallbackCategoryId) {
    rawCandidates = PRODUCTS.filter((product)=>String(product.category || product.subcategory || '') === String(rule.fallback.fallbackCategoryId));
    fallbackUsed = true;
  }
  if (rule.selection.enabled && !rawCandidates.length && rule.fallback.hideSection) {
    const hiddenSlots = Array.from({length:slotCapacity},(_,index)=>automationEmptySlotV63(index,rule,null,'Отбор не дал товаров · секция скрыта на live'));
    const status = {coverage:0,reserveCount:0,pinCount:pinEntries.length,skuConflicts:0,lastRecalculatedAt:new Date().toISOString()};
    return {...section,rules:automationCompatRulesV63({...rule,status},section.rules),automationRuleV63:{...rule,status},resolvedSlots:hiddenSlots,candidates:[],availableCandidates:[],automationHiddenV63:true,reserveV63:[]};
  }

  const availableRaw = rawCandidates.filter((product)=>Number(automationProductValueV63(product,'stock',region))>0);
  const sorted = automationSortV63(availableRaw,rule,region);
  const colorLimited = automationColorLimitV63(sorted,rule);
  const pinsSet = new Set(pinEntries.map((item)=>String(item.id)));
  let pool = colorLimited.filter((product)=>!pinsSet.has(String(product.id)));
  if (rule.dedup.noRepeatSkuAcrossSections) pool = pool.filter((product)=>!ctx.usedAcross.has(String(product.id)));
  const usedLocal = new Set();
  const reservePool = [...pool];
  const slots = [];

  const takeFromReserve = () => {
    while (reservePool.length) {
      const next = reservePool.shift();
      if (!next || usedLocal.has(next.id)) continue;
      if (rule.dedup.noRepeatSkuAcrossSections && ctx.usedAcross.has(String(next.id))) continue;
      return next;
    }
    return null;
  };
  const remember = (product, status) => {
    if (!product || entityKind(product.id) !== 'product') return;
    usedLocal.add(product.id);
    if (status !== 'pin') ctx.usedAcross.add(String(product.id));
  };
  const replacement = (original) => {
    const chain = [...(rule.fallback.replacementChain || [])].filter((step)=>step.enabled).sort((a,b)=>a.order-b.order);
    for (const step of chain) {
      if (step.step === 'other_color') {
        const color = automationOtherColorV63(original,availableRaw,new Set([...usedLocal,...ctx.usedAcross]),region);
        if (color) return {entity:color,warning:'Другой цвет той же модели'};
      }
      if (step.step === 'from_reserve') {
        const fromReserve = takeFromReserve();
        if (fromReserve) return {entity:fromReserve,warning:'Замена из резерва'};
      }
    }
    return null;
  };

  for (let index=0; index<slotCapacity; index+=1) {
    const pinId = section.pins?.[index];
    if (pinId) {
      const entity = getEntity(pinId);
      if (!entity) { slots.push({index,status:'empty',entity:null,warning:'Контент не найден'}); continue; }
      if (entityKind(pinId) !== 'product') { slots.push({index,status:'pin',entity,origin:'manual'}); continue; }
      const inStock = Number(automationProductValueV63(entity,'stock',region))>0;
      if (inStock) { remember(entity,'pin'); slots.push({index,status:'pin',entity,origin:'manual'}); continue; }
      const next = replacement(entity);
      if (next) { remember(next.entity,'auto'); slots.push({index,status:'auto',entity:next.entity,warning:next.warning,origin:'fallback'}); continue; }
      slots.push(automationEmptySlotV63(index,rule,entity,'PIN · нет в наличии · замена не найдена'));
      continue;
    }
    if (!rule.selection.enabled) { slots.push({index,status:'empty',entity:null}); continue; }
    const next = takeFromReserve();
    if (next) { remember(next,'auto'); slots.push({index,status:'auto',entity:next,origin:'automation'}); continue; }
    if (rule.distribution.sectionUnderfillStrategy === 'repeat_within_section' && usedLocal.size && rule.distribution.maxRepeatCount > 1) {
      const source = slots.find((slot)=>slot.entity && entityKind(slot.entity.id)==='product')?.entity;
      if (source) { slots.push({index,status:'auto',entity:source,warning:'Повтор внутри секции',origin:'automation-repeat'}); continue; }
    }
    slots.push({index,status:'empty',entity:null,warning:'Кандидаты закончились'});
  }

  if (rule.distribution.sectionUnderfillStrategy === 'stretch_slot') {
    const lastFilled = [...slots].reverse().find((slot)=>slot.entity);
    if (lastFilled && slots.some((slot)=>!slot.entity)) lastFilled.stretchV63 = true;
  }

  const reserve = reservePool.filter(Boolean);
  AUTOMATION_RESERVE_CACHE_V63.set(automationReserveKeyV63(rule,region),reserve.map((product)=>product.id));
  const productIds = slots.filter((slot)=>slot.entity && entityKind(slot.entity.id)==='product').map((slot)=>String(slot.entity.id));
  const counts = productIds.reduce((map,id)=>map.set(id,(map.get(id)||0)+1),new Map());
  const conflicts = Array.from(counts.values()).filter((count)=>count>1).length;
  const filled = slots.filter((slot)=>slot.entity).length;
  const status = {
    coverage: slotCapacity ? Math.round(filled/slotCapacity*100) : 0,
    reserveCount: reserve.length,
    pinCount: pinEntries.length,
    skuConflicts: conflicts,
    lastRecalculatedAt:new Date().toISOString(),
  };
  const finalRule = {...rule,status};
  return {...section,rules:automationCompatRulesV63(finalRule,section.rules),automationRuleV63:finalRule,resolvedSlots:slots,candidates:rawCandidates,availableCandidates:availableRaw,reserveV63:reserve,fallbackUsedV63:fallbackUsed};
}

function resolveSectionsMasterV63(sections, region) {
  const result = new Map();
  const pageContext = {usedAcross:new Set(),reservePool:[],conflicts:new Set()};
  const processedGroups = new Set();
  const byId = new Map((sections || []).map((section)=>[section.id,section]));
  for (const section of sections || []) {
    const group = section.automationGroup;
    if (group?.groupId) {
      if (processedGroups.has(group.groupId)) continue;
      processedGroups.add(group.groupId);
      const memberIds = (group.memberSectionIds || []).filter((id)=>byId.has(id));
      const groupRule = normalizeAutomationRuleV63(section.groupRuleV63 || section.rules,memberIds[0] || section.id);
      groupRule.scope = {type:'section_group',sectionIds:memberIds};
      const groupContext = {usedAcross:pageContext.usedAcross,reservePool:[],conflicts:new Set()};
      memberIds.forEach((id)=>result.set(id,resolveSectionV63(byId.get(id),region,groupContext,groupRule)));
      continue;
    }
    result.set(section.id,resolveSectionV63(section,region,pageContext,null));
  }
  return (sections || []).map((section)=>result.get(section.id) || resolveSectionV63(section,region,pageContext,null));
}

function automationFieldOptionsV63(fieldKey, region) {
  const field = automationFieldV63(fieldKey);
  if (field.type === 'boolean') return [{value:'true',label:'Да'},{value:'false',label:'Нет'}];
  if (!['select','multiselect'].includes(field.type)) return [];
  const values = new Set();
  for (const product of AUTOMATION_PRODUCT_INDEX_V63.docs.values()) {
    const raw = automationProductValueV63(product,fieldKey,region);
    (Array.isArray(raw) ? raw : [raw]).forEach((value)=>{ if (value !== undefined && value !== null && String(value).trim()) values.add(String(value)); });
  }
  return Array.from(values).sort((a,b)=>a.localeCompare(b,'ru')).map((value)=>({value,label:value}));
}

function automationCountConditionsV63(conditions) {
  return (conditions || []).reduce((sum,node)=>sum + (node?.type === 'group' ? (node.conditions || []).filter((item)=>String(item?.value ?? '').trim()).length : String(node?.value ?? '').trim() ? 1 : 0),0);
}
function automationUpdateConditionTreeV63(conditions,nodeId,patch) {
  return (conditions || []).map((node)=>{
    if (node.id === nodeId) return {...node,...patch};
    if (node.type === 'group') return {...node,conditions:(node.conditions || []).map((child)=>child.id === nodeId ? {...child,...patch} : child)};
    return node;
  });
}
function automationRemoveConditionTreeV63(conditions,nodeId) {
  return (conditions || []).map((node)=> node.type === 'group' ? {...node,conditions:(node.conditions || []).filter((child)=>child.id !== nodeId)} : node).filter((node)=>node.id !== nodeId);
}

function AutomationConditionRowV63({ node, region, onChange, onDelete }) {
  const field = automationFieldV63(node.field || 'category');
  const operators = automationOperatorsForFieldV63(field.key);
  const options = automationFieldOptionsV63(field.key,region);
  const validOps = new Set(operators.map(([value])=>value));
  const operator = validOps.has(node.operator) ? node.operator : 'eq';
  return <div className={'automation-condition-row-v63 ' + (node._operatorResetV63 ? 'operator-reset' : '')}>
    <select value={field.key} onChange={(event)=>{ const nextField=event.target.value; const allowed=automationOperatorsForFieldV63(nextField); onChange({field:nextField,operator:allowed[0][0],value:'',_operatorResetV63:true}); }}>
      {AUTOMATION_FIELDS_V63.map((item)=><option key={item.key} value={item.key}>{item.label}</option>)}
    </select>
    <select value={operator} onChange={(event)=>onChange({operator:event.target.value,_operatorResetV63:false})}>{operators.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    {options.length ? <select value={String(node.value ?? '')} onChange={(event)=>onChange({value:event.target.value,_operatorResetV63:false})}><option value="">Значение</option>{options.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type==='number' ? 'number' : field.type==='date' ? 'date' : 'text'} value={node.value ?? ''} onChange={(event)=>onChange({value:event.target.value,_operatorResetV63:false})} placeholder="Значение"/>}
    <button title="Удалить условие" onClick={onDelete}><X size={13}/></button>
    {node._operatorResetV63 && <small>Оператор сброшен на допустимый для нового типа поля.</small>}
  </div>;
}

function AutomationSelectionEditorV63({ selection, region, onChange }) {
  const conditions = selection.conditions || [];
  const addCondition = () => onChange({...selection,conditions:[...conditions,{type:'condition',id:'cond-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),field:'category',operator:'eq',value:''}]});
  const addGroup = () => onChange({...selection,conditions:[...conditions,{type:'group',id:'group-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),operator:'AND',conditions:[{type:'condition',id:'cond-'+Date.now()+'-a',field:'category',operator:'eq',value:''}]}]});
  const updateNode = (id,patch) => onChange({...selection,conditions:automationUpdateConditionTreeV63(conditions,id,patch)});
  const removeNode = (id) => onChange({...selection,conditions:automationRemoveConditionTreeV63(conditions,id)});
  return <div className="automation-selection-v63">
    <div className="automation-root-logic-v63"><span>Между верхнеуровневыми условиями</span><div><button className={selection.rootOperator==='AND'?'active':''} onClick={()=>onChange({...selection,rootOperator:'AND'})}>Всем · И</button><button className={selection.rootOperator==='OR'?'active':''} onClick={()=>onChange({...selection,rootOperator:'OR'})}>Любому · ИЛИ</button></div></div>
    <div className="automation-condition-list-v63">{conditions.map((node,index)=> node.type === 'group' ? <div className="automation-condition-group-v63" key={node.id}>
      <header><span>Группа {index+1}</span><div><button className={node.operator==='AND'?'active':''} onClick={()=>updateNode(node.id,{operator:'AND'})}>И</button><button className={node.operator==='OR'?'active':''} onClick={()=>updateNode(node.id,{operator:'OR'})}>ИЛИ</button><button title="Удалить группу" onClick={()=>removeNode(node.id)}><Trash2 size={12}/></button></div></header>
      {(node.conditions || []).map((child)=><AutomationConditionRowV63 key={child.id} node={child} region={region} onChange={(patch)=>updateNode(child.id,patch)} onDelete={()=>removeNode(child.id)}/>)}
      <button className="automation-subadd-v63" disabled={(node.conditions || []).length>=8} onClick={()=>updateNode(node.id,{conditions:[...(node.conditions||[]),{type:'condition',id:'cond-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),field:'category',operator:'eq',value:''}]})}><Plus size={12}/>Условие в группу</button>
      <small>Вложенность ограничена одним уровнем.</small>
    </div> : <AutomationConditionRowV63 key={node.id} node={node} region={region} onChange={(patch)=>updateNode(node.id,patch)} onDelete={()=>removeNode(node.id)}/>)}</div>
    {!conditions.length && <div className="automation-empty-v63"><strong>Условия не заданы</strong><span>Добавьте условие или одну вложенную группу.</span></div>}
    <div className="automation-selection-actions-v63"><button onClick={addCondition}><Plus size={12}/>Добавить условие</button><button onClick={addGroup}><Plus size={12}/>Добавить группу условий</button></div>
  </div>;
}

function AutomationStatusBarV63({ rule, status }) {
  const [visibleStatus,setVisibleStatus] = useState(status || rule.status || {});
  useEffect(()=>{ const timer=window.setTimeout(()=>setVisibleStatus(status || rule.status || {}),AUTOMATION_STATUS_DEBOUNCE_V63); return ()=>window.clearTimeout(timer); },[status?.coverage,status?.reserveCount,status?.pinCount,status?.skuConflicts,status?.lastRecalculatedAt]);
  const state = rule.state === 'published' ? 'Опубликовано' : 'Черновик';
  return <div className="automation-statusbar-v63">
    <span className={'automation-state-v63 '+(rule.state==='published'?'published':'draft')}>{state}</span>
    <span><b>Покрытие</b><strong>{visibleStatus?.coverage ?? 0}%</strong></span>
    <span><b>Резерв</b><strong>{visibleStatus?.reserveCount ?? 0}</strong></span>
    <span><b>PIN</b><strong>{visibleStatus?.pinCount ?? 0}</strong></span>
    <span><b>Конфликты SKU</b><strong>{visibleStatus?.skuConflicts ?? 0}</strong></span>
    <em>пересчёт 500 мс</em>
  </div>;
}

function AutomationRuleEditorV63({ rule:sourceRule, region, capacity=0, scope='single', onChange, lockedUnderfill=false }) {
  const rule = normalizeAutomationRuleV63(sourceRule,sourceRule?.scope?.sectionIds?.[0] || '');
  const change = (patch) => onChange({...rule,...patch,state:'draft'});
  const updateSelection = (selection) => change({selection});
  const updateDistribution = (patch) => change({distribution:{...rule.distribution,...patch}});
  const updateFallback = (patch) => change({fallback:{...rule.fallback,...patch}});
  const moveFallback = (from,to) => {
    if (from===to) return;
    const chain=[...(rule.fallback.replacementChain||[])]; const [item]=chain.splice(from,1); chain.splice(to,0,item);
    updateFallback({replacementChain:chain.map((step,index)=>({...step,order:index+1}))});
  };
  const activeConditions = automationCountConditionsV63(rule.selection.conditions);
  const categories = automationFieldOptionsV63('category',region);
  return <div className="automation-master-editor-v63">
    <section className="automation-card-v63">
      <header><b>1</b><div><strong>Отбор товаров</strong><small>Группы условий · глубина 1</small></div><label className="automation-switch-v63"><input type="checkbox" checked={rule.selection.enabled} onChange={(event)=>updateSelection({...rule.selection,enabled:event.target.checked})}/><span/></label></header>
      {rule.selection.enabled && <><AutomationSelectionEditorV63 selection={rule.selection} region={region} onChange={updateSelection}/><div className="automation-match-v63"><span>Активных условий</span><strong>{activeConditions}</strong></div></>}
    </section>

    <section className="automation-card-v63">
      <header><b>2</b><div><strong>Сортировка</strong><small>Два уровня приоритета</small></div><label className="automation-switch-v63"><input type="checkbox" checked={rule.sorting.enabled} onChange={(event)=>change({sorting:{...rule.sorting,enabled:event.target.checked}})}/><span/></label></header>
      {rule.sorting.enabled && <div className="automation-sort-grid-v63">{['level1','level2'].map((level,index)=><div key={level}><span>{index+1} уровень</span><select value={rule.sorting[level].criterion} onChange={(event)=>change({sorting:{...rule.sorting,[level]:{...rule.sorting[level],criterion:event.target.value}}})}>{AUTOMATION_SORTS_V63.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select value={rule.sorting[level].direction} onChange={(event)=>change({sorting:{...rule.sorting,[level]:{...rule.sorting[level],direction:event.target.value}}})}><option value="desc">Сначала больше / новее</option><option value="asc">Сначала меньше / старее</option></select></div>)}</div>}
    </section>

    <section className="automation-card-v63">
      <header><b>3</b><div><strong>Цвет модели</strong><small>Лимит применяется только к AUTO-пулу, не к PIN</small></div></header>
      <div className="automation-choice-v63 three"><button className={rule.dedup.colorLimit.mode==='fixed'?'active':''} onClick={()=>change({dedup:{...rule.dedup,colorLimit:{mode:'fixed',value:1}}})}>1 цвет</button><button className={rule.dedup.colorLimit.mode==='custom'?'active':''} onClick={()=>change({dedup:{...rule.dedup,colorLimit:{mode:'custom',value:Math.max(2,rule.dedup.colorLimit.value||2)}}})}>Не более N</button><button className={rule.dedup.colorLimit.mode==='all_colors'?'active':''} onClick={()=>change({dedup:{...rule.dedup,colorLimit:{mode:'all_colors',value:999}}})}>Все цвета</button></div>
      {rule.dedup.colorLimit.mode==='custom' && <label className="automation-number-v63"><span>Максимум цветов одной модели</span><input type="number" min="1" max="20" value={rule.dedup.colorLimit.value} onChange={(event)=>change({dedup:{...rule.dedup,colorLimit:{mode:'custom',value:Math.max(1,Number(event.target.value||1))}}})}/></label>}
    </section>

    <section className="automation-card-v63">
      <header><b>4</b><div><strong>Резерв и распределение</strong><small>Излишек кандидатов остаётся в резерв-пуле</small></div></header>
      {scope==='group' && <div className="automation-choice-v63"><button className={rule.distribution.groupStrategy==='fill_slots_with_reserve'?'active':''} onClick={()=>updateDistribution({groupStrategy:'fill_slots_with_reserve',sectionUnderfillLocked:false})}><strong>Слоты + резерв</strong><small>Заполнить ёмкость, излишек в резерв</small></button><button className={rule.distribution.groupStrategy==='repeat_section_combo'?'active':''} onClick={()=>updateDistribution({groupStrategy:'repeat_section_combo',sectionUnderfillLocked:true})}><strong>Повтор комбинации</strong><small>До лимита повторов или конца уникальных товаров</small></button></div>}
      <div className="automation-fields-v63"><label><span>Ёмкость сетки</span><input type="number" min="1" value={rule.distribution.gridCapacity ?? capacity || 1} onChange={(event)=>updateDistribution({gridCapacity:Math.max(1,Number(event.target.value||1))})}/></label><label><span>Макс. повторов</span><input type="number" min="1" max={AUTOMATION_MAX_REPEAT_V63} value={rule.distribution.maxRepeatCount} onChange={(event)=>updateDistribution({maxRepeatCount:Math.max(1,Math.min(AUTOMATION_MAX_REPEAT_V63,Number(event.target.value||1)))})}/></label></div>
      <label className="automation-check-v63"><input type="checkbox" checked={rule.dedup.noRepeatSkuAcrossSections} onChange={(event)=>change({dedup:{...rule.dedup,noRepeatSkuAcrossSections:event.target.checked}})}/><span><strong>Не повторять SKU между секциями</strong><small>PIN-конфликты разрешены и отдельно считаются в статусе.</small></span></label>
    </section>

    <section className={'automation-card-v63 '+(lockedUnderfill || rule.distribution.sectionUnderfillLocked ? 'locked' : '')}>
      <header><b>5</b><div><strong>Логика заполнения слотов</strong><small>{lockedUnderfill || rule.distribution.sectionUnderfillLocked ? 'Управляется правилом группы' : 'Что делать при избытке и нехватке товаров'}</small></div></header>
      <div className="automation-choice-v63"><button disabled={lockedUnderfill || rule.distribution.sectionUnderfillLocked} className={rule.distribution.fillMode==='all_products'?'active':''} onClick={()=>updateDistribution({fillMode:'all_products'})}>Все товары</button><button disabled={lockedUnderfill || rule.distribution.sectionUnderfillLocked} className={rule.distribution.fillMode==='fixed_slots'?'active':''} onClick={()=>updateDistribution({fillMode:'fixed_slots'})}>По количеству слотов</button></div>
      <div className="automation-choice-v63 three underfill"><button disabled={lockedUnderfill || rule.distribution.sectionUnderfillLocked} className={rule.distribution.sectionUnderfillStrategy==='repeat_within_section'?'active':''} onClick={()=>updateDistribution({sectionUnderfillStrategy:'repeat_within_section'})}><strong>Повторить</strong><small>Повтор внутри секции</small></button><button disabled={lockedUnderfill || rule.distribution.sectionUnderfillLocked} className={rule.distribution.sectionUnderfillStrategy==='stretch_slot'?'active':''} onClick={()=>updateDistribution({sectionUnderfillStrategy:'stretch_slot'})}><strong>Растянуть</strong><small>Последний заполненный слот</small></button><button disabled={lockedUnderfill || rule.distribution.sectionUnderfillLocked} className={rule.distribution.sectionUnderfillStrategy==='leave_empty'?'active':''} onClick={()=>updateDistribution({sectionUnderfillStrategy:'leave_empty'})}><strong>Оставить пустым</strong><small>Явный placeholder</small></button></div>
    </section>

    <section className="automation-card-v63">
      <header><b>6</b><div><strong>OOS / Fallback</strong><small>Цепочка замены выполняется сверху вниз</small></div></header>
      <div className="automation-fallback-chain-v63">{(rule.fallback.replacementChain || []).map((step,index)=><div key={step.step} draggable onDragStart={(event)=>event.dataTransfer.setData('application/x-fallback-v63',String(index))} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();moveFallback(Number(event.dataTransfer.getData('application/x-fallback-v63')),index);}}><GripVertical size={13}/><span><strong>{step.step==='other_color'?'Другой цвет модели':'Следующий товар из резерва'}</strong><small>Шаг {index+1}</small></span><label className="automation-switch-v63"><input type="checkbox" checked={step.enabled} onChange={(event)=>updateFallback({replacementChain:rule.fallback.replacementChain.map((item,i)=>i===index?{...item,enabled:event.target.checked}:item)})}/><span/></label></div>)}</div>
      <div className="automation-choice-v63"><button className={rule.fallback.emptySlotBehavior==='collapse_and_center'?'active':''} onClick={()=>updateFallback({emptySlotBehavior:'collapse_and_center'})}><strong>Схлопнуть и центрировать</strong><small>Если замена не найдена</small></button><button className={rule.fallback.emptySlotBehavior==='leave_with_oos_badge'?'active':''} onClick={()=>updateFallback({emptySlotBehavior:'leave_with_oos_badge'})}><strong>Оставить OOS</strong><small>С пометкой «нет в наличии»</small></button></div>
      <div className="automation-fields-v63"><label><span>Fallback-категория</span><select value={rule.fallback.fallbackCategoryId || ''} onChange={(event)=>updateFallback({fallbackCategoryId:event.target.value})}><option value="">Не выбрана</option>{categories.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label><span>Live delay, сек</span><input type="number" min="300" step="60" value={rule.fallback.applyOnLiveDelaySec} onChange={(event)=>updateFallback({applyOnLiveDelaySec:Math.max(300,Number(event.target.value||300))})}/></label></div>
      <label className="automation-check-v63"><input type="checkbox" checked={rule.fallback.hideSection} onChange={(event)=>updateFallback({hideSection:event.target.checked})}/><span><strong>Скрыть секцию, если отбор пуст</strong><small>Используется, если fallback-категория тоже не дала товаров.</small></span></label>
    </section>
  </div>;
}

function automationRuleStatusFromSectionV63(section) {
  return section?.automationRuleV63?.status || normalizeAutomationRuleV63(section?.rules || {},section?.id).status;
}
`;
  app = app.replace(anchor, anchor + '\n' + helpers);

  const resolvePart = functionChunk(app,'resolveSection');
  app = app.slice(0,resolvePart.start) + `function resolveSection(section, region, pageContext = null) { return resolveSectionV63(section, region, pageContext, null); }\n` + app.slice(resolvePart.end);

  const panelPart = functionChunk(app,'SectionSettingsPanel');
  const panel = String.raw`function SectionSettingsPanel({ section, region, locale, onChange, onDuplicate, onDelete, device='desktop', onDeviceChange=()=>{}, onLayoutChange=()=>{} }) {
  const [layoutDrawerOpenV38,setLayoutDrawerOpenV38] = useState(false);
  if (!section) return null;
  const rule = normalizeAutomationRuleV63(section.rules || {},section.id);
  const resolvedStatus = section.automationRuleV63?.status || rule.status;
  const inGroup = Boolean(section.automationGroup?.groupId);
  const updateMaster = (next) => onChange(automationCompatRulesV63({...normalizeAutomationRuleV63(next,section.id),state:'draft',publishedSnapshot:rule.publishedSnapshot || (rule.state==='published' ? automationCloneV63(rule) : null)},section.rules));
  return <div className="section-settings-v63">
    <div className="section-settings-head-v63"><div><span>СЕКЦИЯ</span><strong>{section.titles?.[locale] || section.titles?.ru || 'Секция'}</strong><small>{layoutDisplayName(section.template)}</small></div><div><button onClick={onDuplicate} title="Дублировать"><Copy size={14}/></button><button onClick={onDelete} title="Удалить"><Trash2 size={14}/></button></div></div>
    <SectionEditLauncherV38 section={section} device={device} onEditLayout={()=>setLayoutDrawerOpenV38(true)} onAutomation={()=>{ const node=document.querySelector('.automation-master-editor-v63'); node?.scrollIntoView({behavior:'smooth',block:'start'}); }}/>
    <AutomationStatusBarV63 rule={rule} status={resolvedStatus}/>
    {inGroup ? <div className="automation-group-warning-v63"><div><span>⚡ АВТО-ГРУППА</span><strong>{section.automationGroup.groupLabel || 'Группа секций'}</strong><small>Индивидуальная автоматизация заблокирована. Правила применяются на уровне группы.</small></div><button onClick={()=>SECTION_AUTOMATION_RUNTIME_V63.detachGroup?.(section.id)}>Отключить от группы</button></div> : <AutomationRuleEditorV63 rule={rule} region={region} capacity={slotCount(section.template)} scope="single" onChange={updateMaster}/>} 
    <SectionLayoutDrawerV38 open={layoutDrawerOpenV38} section={section} device={device} onDeviceChange={onDeviceChange} onLayoutChange={onLayoutChange} onClose={()=>setLayoutDrawerOpenV38(false)}/>
  </div>;
}
`;
  app = app.slice(0,panelPart.start) + panel + app.slice(panelPart.end);

  const resolvedOld = "  const resolved = useMemo(() => sections.map((section) => resolveSection(section, region, null)), [sections, region]);";
  if (!app.includes(resolvedOld)) throw new Error(MARKER + ': V49 resolved anchor missing');
  app = app.replace(resolvedOld, "  const resolved = useMemo(() => resolveSectionsMasterV63(sections, region), [sections, region]);");

  const mutateAnchor = "  const mutateSections = (updater) => setCurrentSections(typeof updater === 'function' ? updater(sections) : updater, true);";
  if (!app.includes(mutateAnchor)) throw new Error(MARKER + ': mutateSections anchor missing');
  const runtime = String.raw`
  const publishAutomationV63 = () => {
    const publishedAt = new Date().toISOString();
    mutateSections((previous)=>previous.map((section)=>{
      const current = normalizeAutomationRuleV63(section.rules || {},section.id);
      const published = {...current,state:'published',publishedAt,publishedSnapshot:null};
      const groupRule = section.groupRuleV63 ? {...normalizeAutomationRuleV63(section.groupRuleV63,section.id),state:'published',publishedAt,publishedSnapshot:null} : null;
      return {...section,rules:automationCompatRulesV63({...published,publishedSnapshot:automationCloneV63(published)},section.rules),publishedRuleV63:automationCloneV63(published),...(groupRule?{groupRuleV63:groupRule,publishedGroupRuleV63:automationCloneV63(groupRule)}:{})};
    }));
    setToast('Опубликовано: правила и витрина · ' + region + ' · ' + LANGUAGE_LABELS[locale]);
    window.setTimeout(()=>setToast(''),2000);
  };
  SECTION_AUTOMATION_RUNTIME_V63.detachGroup = (sectionId) => updateSection(sectionId,(section)=>({...section,automationGroup:null,groupRuleV63:null,rules:automationCompatRulesV63({...normalizeAutomationRuleV63(section.rules,section.id),state:'draft',distribution:{...normalizeAutomationRuleV63(section.rules,section.id).distribution,sectionUnderfillLocked:false,sectionUnderfillStrategy:'leave_empty'}},section.rules)}));
`;
  app = app.replace(mutateAnchor, mutateAnchor + runtime);

  const exportAnchor = 'export default function AppV3() {';
  if (!app.includes(exportAnchor)) throw new Error(MARKER + ': App export missing');
  app = app.replace(exportAnchor, 'const SECTION_AUTOMATION_RUNTIME_V63 = {};\n\n' + exportAnchor);

  const dirtyAnchor = "  const selected = resolved.find((s) => s.id === selectedId) || resolved[0] || null;";
  if (!app.includes(dirtyAnchor)) throw new Error(MARKER + ': selected anchor missing');
  app = app.replace(dirtyAnchor, dirtyAnchor + String.raw`
  const hasAutomationDraftV63 = sections.some((section)=> normalizeAutomationRuleV63(section.rules || {},section.id).state === 'draft' || (section.groupRuleV63 && normalizeAutomationRuleV63(section.groupRuleV63,section.id).state === 'draft'));
  useEffect(()=>{
    const warn = (event) => { if (!hasAutomationDraftV63) return; event.preventDefault(); event.returnValue = 'Есть неопубликованные изменения автоматизации'; };
    window.addEventListener('beforeunload',warn); return ()=>window.removeEventListener('beforeunload',warn);
  },[hasAutomationDraftV63]);`);

  const publishPattern = /<button className="editor-publish-v43" onClick=\{\(\) => \{ setToast\('Опубликовано:[\s\S]*?<\/button>/;
  if (!publishPattern.test(app)) throw new Error(MARKER + ': publish button anchor missing');
  app = app.replace(publishPattern, '<button className="editor-publish-v43" onClick={publishAutomationV63}>Опубликовать</button>');

  writeFileSync(appPath,app);
}

let css = readFileSync(cssPath,'utf8');
if (!css.includes('/* automation-master-v63 */')) {
  css += String.raw`
/* automation-master-v63 */
.section-settings-v63{padding:0 14px 36px;background:#fff;color:#111}.section-settings-head-v63{min-height:68px;padding:14px 0;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.section-settings-head-v63>div:first-child{display:grid;gap:3px;min-width:0}.section-settings-head-v63 span,.section-settings-head-v63 small{font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:#777}.section-settings-head-v63 strong{font-size:15px;font-weight:500}.section-settings-head-v63>div:last-child{display:flex;gap:3px}.section-settings-head-v63>div:last-child button{width:30px;height:30px;border:1px solid #ddd;background:#fff;display:grid;place-items:center}
.automation-statusbar-v63{display:grid;grid-template-columns:auto repeat(4,1fr) auto;gap:0;margin:14px 0 18px;border:1px solid #ddd;background:#fff;align-items:stretch}.automation-statusbar-v63>span,.automation-statusbar-v63>em{min-height:45px;padding:7px 9px;border-right:1px solid #e6e6e6;display:grid;align-content:center;gap:2px;font-style:normal}.automation-statusbar-v63>span b{font-size:7px;text-transform:uppercase;letter-spacing:.05em;color:#777}.automation-statusbar-v63>span strong{font-size:13px}.automation-statusbar-v63>em{border-right:0;font-size:7px;color:#999;white-space:nowrap}.automation-state-v63{font-size:8px!important;font-weight:700!important;text-transform:uppercase}.automation-state-v63.draft{color:#9a6700}.automation-state-v63.published{color:#2e7d32}
.automation-master-editor-v63{display:grid;gap:12px}.automation-card-v63{border:1px solid #e0e0e0;background:#fff;padding:0 12px 13px}.automation-card-v63>header{min-height:53px;display:flex;align-items:center;gap:9px;border-bottom:1px solid #eee;margin-bottom:12px}.automation-card-v63>header>b{width:21px;height:21px;background:#111;color:#fff;display:grid;place-items:center;font-size:8px}.automation-card-v63>header>div{display:grid;gap:2px;flex:1}.automation-card-v63>header strong{font-size:11px;font-weight:600}.automation-card-v63>header small{font-size:8px;color:#888}.automation-card-v63.locked{opacity:.66;background:#fafafa}
.automation-switch-v63{position:relative;width:30px;height:17px;flex:none}.automation-switch-v63 input{position:absolute;opacity:0}.automation-switch-v63>span{position:absolute;inset:0;border:1px solid #bbb;background:#eee}.automation-switch-v63>span:after{content:'';position:absolute;width:11px;height:11px;left:2px;top:2px;background:#fff;border:1px solid #aaa;transition:.15s}.automation-switch-v63 input:checked+span{background:#111;border-color:#111}.automation-switch-v63 input:checked+span:after{transform:translateX(13px);border-color:#fff}
.automation-root-logic-v63{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}.automation-root-logic-v63>span{font-size:8px;color:#777}.automation-root-logic-v63>div{display:flex;border:1px solid #d8d8d8}.automation-root-logic-v63 button{height:28px;padding:0 8px;border:0;border-right:1px solid #ddd;background:#fff;font-size:8px}.automation-root-logic-v63 button:last-child{border-right:0}.automation-root-logic-v63 button.active{background:#111;color:#fff}
.automation-condition-list-v63{display:grid;gap:6px}.automation-condition-row-v63{display:grid;grid-template-columns:minmax(88px,1.1fr) minmax(82px,.9fr) minmax(92px,1.1fr) 28px;gap:5px;position:relative}.automation-condition-row-v63 select,.automation-condition-row-v63 input,.automation-fields-v63 select,.automation-fields-v63 input,.automation-sort-grid-v63 select,.automation-number-v63 input{height:32px;border:1px solid #d7d7d7;background:#fff;padding:0 6px;font-size:8px;min-width:0}.automation-condition-row-v63>button{border:0;background:#fff;color:#777}.automation-condition-row-v63>small{grid-column:1/-1;font-size:7px;color:#9a6700}.automation-condition-group-v63{padding:8px;border:1px dashed #bbb;background:#fafafa}.automation-condition-group-v63>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.automation-condition-group-v63>header>span{font-size:8px;font-weight:700}.automation-condition-group-v63>header>div{display:flex}.automation-condition-group-v63>header button{height:25px;border:1px solid #ddd;background:#fff;font-size:7px}.automation-condition-group-v63>header button.active{background:#111;color:#fff}.automation-condition-group-v63>.automation-condition-row-v63+.automation-condition-row-v63{margin-top:5px}.automation-condition-group-v63>small{display:block;margin-top:6px;font-size:7px;color:#999}.automation-subadd-v63,.automation-selection-actions-v63 button{height:29px;border:1px solid #d5d5d5;background:#fff;padding:0 8px;font-size:8px;display:flex;align-items:center;gap:4px}.automation-subadd-v63{margin-top:7px}.automation-selection-actions-v63{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}.automation-empty-v63{padding:14px;border:1px dashed #d7d7d7;text-align:center;display:grid;gap:3px}.automation-empty-v63 strong{font-size:9px}.automation-empty-v63 span{font-size:8px;color:#888}.automation-match-v63{margin-top:9px;display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #eee}.automation-match-v63 span{font-size:8px;color:#777}.automation-match-v63 strong{font-size:11px}
.automation-sort-grid-v63{display:grid;grid-template-columns:1fr 1fr;gap:7px}.automation-sort-grid-v63>div{display:grid;grid-template-columns:1fr;gap:4px}.automation-sort-grid-v63 span{font-size:7px;text-transform:uppercase;color:#777}.automation-choice-v63{display:grid;grid-template-columns:repeat(2,1fr);border:1px solid #d8d8d8}.automation-choice-v63.three{grid-template-columns:repeat(3,1fr)}.automation-choice-v63 button{min-height:39px;border:0;border-right:1px solid #ddd;background:#fff;font-size:8px;padding:7px;text-align:left}.automation-choice-v63 button:last-child{border-right:0}.automation-choice-v63 button.active{background:#111;color:#fff}.automation-choice-v63 button:disabled{opacity:.45}.automation-choice-v63 button strong,.automation-choice-v63 button small{display:block}.automation-choice-v63 button small{font-size:7px;color:#888;margin-top:2px}.automation-choice-v63 button.active small{color:#ccc}.automation-choice-v63.underfill{margin-top:7px}.automation-number-v63,.automation-fields-v63 label{display:grid;gap:4px;margin-top:8px}.automation-number-v63>span,.automation-fields-v63 span{font-size:7px;color:#777}.automation-fields-v63{display:grid;grid-template-columns:1fr 1fr;gap:7px}.automation-check-v63{display:flex;align-items:flex-start;gap:7px;margin-top:9px}.automation-check-v63 input{margin-top:2px}.automation-check-v63>span{display:grid;gap:2px}.automation-check-v63 strong{font-size:8px}.automation-check-v63 small{font-size:7px;color:#888}
.automation-fallback-chain-v63{display:grid;gap:5px;margin-bottom:8px}.automation-fallback-chain-v63>div{min-height:37px;border:1px solid #ddd;display:flex;align-items:center;gap:7px;padding:5px 7px;background:#fff;cursor:grab}.automation-fallback-chain-v63>div>span{display:grid;gap:1px;flex:1}.automation-fallback-chain-v63 strong{font-size:8px}.automation-fallback-chain-v63 small{font-size:7px;color:#888}.automation-group-warning-v63{margin:14px 0;border:1px solid #e3c98a;background:#fffaf0;padding:12px;display:flex;justify-content:space-between;gap:12px;align-items:center}.automation-group-warning-v63>div{display:grid;gap:2px}.automation-group-warning-v63 span{font-size:7px;color:#9a6700}.automation-group-warning-v63 strong{font-size:10px}.automation-group-warning-v63 small{font-size:8px;color:#777}.automation-group-warning-v63 button{height:30px;border:1px solid #c9aa61;background:#fff;padding:0 9px;font-size:8px}
@media(max-width:520px){.automation-statusbar-v63{grid-template-columns:1fr 1fr}.automation-statusbar-v63>span,.automation-statusbar-v63>em{border-bottom:1px solid #e6e6e6}.automation-sort-grid-v63,.automation-fields-v63{grid-template-columns:1fr}.automation-choice-v63.three{grid-template-columns:1fr}.automation-condition-row-v63{grid-template-columns:1fr 1fr}.automation-condition-row-v63>*:nth-child(3){grid-column:1/2}.automation-condition-row-v63>button{grid-column:2/3}}
`;
  writeFileSync(cssPath,css);
}

console.log('V63 applied: master automation v1 data model, indexed query adapter, six-card rules UI, draft/published and fallback pipeline');
