import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/App.jsx';
let source = readFileSync(path, 'utf8');

// Keep the checked-in prototype readable while making small deterministic source upgrades
// before dev/build. The operation is idempotent.
source = source.replace(
  "const updateRanking = (id, key, value) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: Number(value) } } : s));",
  "const updateRanking = (id, key, value) => setSections((prev) => prev.map((s) => s.id === id ? { ...s, rules: { ...s.rules, ranking: { ...s.rules.ranking, [key]: Number(value) } } } : s));",
);

source = source.replace(
  "const pinEntity = (sectionId, slotIndex, entityId) => { setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, pins: { ...s.pins, [slotIndex]: entityId }, rules: { ...s.rules, mode: s.rules.mode === 'auto' ? 'hybrid' : s.rules.mode } } : s)); setToast(`Слот ${slotIndex + 1}: ручное переопределение PIN`); setTimeout(() => setToast(''), 1800); };",
  "const pinEntity = (sectionId, slotIndex, entityId) => { const target = sections.find((s) => s.id === sectionId); const media = MEDIA.find((m) => m.id === entityId); const contentType = media?.type || (PRODUCTS.some((p) => p.id === entityId) ? 'product' : null); if (!target || !contentType || !target.allowed.includes(contentType)) { setToast(`Этот тип контента запрещён политикой секции`); setTimeout(() => setToast(''), 1800); return; } setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, pins: { ...s.pins, [slotIndex]: entityId }, rules: { ...s.rules, mode: s.rules.mode === 'auto' ? 'hybrid' : s.rules.mode } } : s)); setToast(`Слот ${slotIndex + 1}: ручное переопределение PIN`); setTimeout(() => setToast(''), 1800); };",
);

source = source.replace(
  "className={`product-layout ${section.type === 'product-row' ? 'row' : ''}`}",
  "className={`product-layout ${section.type === 'product-row' ? 'row' : ''} ${section.rules.emptyBehavior === 'center' ? 'center' : ''}`}",
);

source = source.replace(
  '<option value="collapse">Схлопнуть слот</option><option value="keep">Оставить пустой слот</option>',
  '<option value="collapse">Схлопнуть слот</option><option value="center">Центрировать оставшийся контент</option><option value="keep">Оставить пустой слот</option>',
);

writeFileSync(path, source);
console.log('Prepared src/App.jsx for dev/build');
