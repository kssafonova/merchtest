import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'MASTER_TABS_DND_STABILITY_V59';

function functionChunk(source, name) {
  const start = source.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(MARKER + ': function ' + name + ' missing');
  const end = source.indexOf('\nfunction ', start + name.length + 10);
  if (end < 0) throw new Error(MARKER + ': end of ' + name + ' missing');
  return { start, end, chunk: source.slice(start, end) };
}

if (!app.includes(MARKER)) {
  const anchor = 'const SECTION_CANVAS_TOOLBAR_V58 = true;';
  if (!app.includes(anchor)) throw new Error(MARKER + ': V58 marker missing');
  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;');

  // Real move/swap semantics for any resolved slot, including AUTO -> empty.
  const unpinMatch = app.match(/\n\s*const unpin = \(sectionId, slotIndex\) =>[^\n]+\n/);
  if (!unpinMatch) throw new Error(MARKER + ': unpin runtime anchor missing');
  const moveHandler = String.raw`
  const moveSlotEntityV59 = ({ sourceSectionId, sourceSlotIndex, sourceEntityId, targetSectionId, targetSlotIndex, targetEntityId }) => {
    if (!sourceSectionId || !targetSectionId || !sourceEntityId) return;
    const sourceIndex = Number(sourceSlotIndex);
    const targetIndex = Number(targetSlotIndex);
    if (sourceSectionId === targetSectionId && sourceIndex === targetIndex) return;
    mutateSections((previous) => previous.map((section) => {
      if (section.id !== sourceSectionId && section.id !== targetSectionId) return section;
      const pins = { ...(section.pins || {}) };
      if (section.id === targetSectionId) pins[targetIndex] = sourceEntityId;
      if (section.id === sourceSectionId) pins[sourceIndex] = targetEntityId || '__EMPTY_SLOT_V59__';
      return { ...section, pins };
    }));
    setSelectedId(targetSectionId);
    setSelectedSlot({ sectionId: targetSectionId, slotIndex: targetIndex });
    setToast(targetEntityId ? 'Содержимое слотов поменялось местами' : 'Контент перемещён');
    setTimeout(() => setToast(''), 1200);
  };
`;
  app = app.replace(unpinMatch[0], unpinMatch[0] + moveHandler);

  const part = functionChunk(app, 'SectionCanvas');
  let chunk = part.chunk;
  chunk = chunk.replace(/function SectionCanvas\(\{([^}]*)\}\) \{/, (match, args) => {
    if (args.includes('onMoveV59')) return match;
    return 'function SectionCanvas({' + args + ', onMoveV59}) {';
  });

  const dropPattern = /  const onDrop = \(event, slotIndex\) => \{[\s\S]*?\n  \};/;
  if (!dropPattern.test(chunk)) throw new Error(MARKER + ': SectionCanvas onDrop missing');
  const nextDrop = String.raw`  const onDrop = (event, slotIndex) => {
    event.preventDefault();
    event.stopPropagation();
    const storefrontPayload = event.dataTransfer.getData('application/x-storefront-slot-v55');
    if (storefrontPayload) {
      try {
        const source = JSON.parse(storefrontPayload);
        if (source.sectionId === section.id && Number(source.slotIndex) === Number(slotIndex)) return;
        const targetSlot = (section.resolvedSlots || []).find((item) => Number(item.index) === Number(slotIndex));
        onMoveV59?.({
          sourceSectionId: source.sectionId,
          sourceSlotIndex: Number(source.slotIndex),
          sourceEntityId: source.entityId,
          targetSectionId: section.id,
          targetSlotIndex: Number(slotIndex),
          targetEntityId: targetSlot?.entity?.id || null,
        });
        return;
      } catch (error) { console.warn('Не удалось переместить слот', error); }
    }
    const id = event.dataTransfer.getData('text/plain');
    if (id) onPin(section.id, slotIndex, id);
  };`;
  chunk = chunk.replace(dropPattern, nextDrop);
  app = app.slice(0, part.start) + chunk + app.slice(part.end);

  // Wire the move handler into every page section render.
  app = app.replace(/onUnpin=\{unpin\}(?![^>]*onMoveV59)/g, 'onUnpin={unpin} onMoveV59={moveSlotEntityV59}');

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* master-tabs-dnd-stability-v59 */')) {
  css += String.raw`
/* master-tabs-dnd-stability-v59 */
/* Product modal remains vertically scrollable after every later UI layer. */
.product-master-modal-v52{display:flex!important;flex-direction:column!important;height:min(94vh,980px)!important;max-height:94vh!important;min-height:0!important;overflow:hidden!important}
.product-master-scroll-v52{flex:1 1 auto!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}

/* All three master modals use the same tab/content scrolling model. */
.look-master-modal-v53,.media-master-modal-v54{min-height:0!important;overflow:hidden!important}
.look-master-scroll-v53,.media-master-scroll-v54{min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:thin!important}

/* Clear move intent on storefront slots. */
.lego-slot.slot-drag-over-v55{outline:1px solid #111!important;outline-offset:-1px!important;background:#fafafa!important}

@media(max-width:640px){
  .product-master-modal-v52,.look-master-modal-v53,.media-master-modal-v54{height:100vh!important;max-height:none!important}
  .product-master-scroll-v52,.look-master-scroll-v53,.media-master-scroll-v54{overflow-y:auto!important}
}
`;
  writeFileSync(cssPath, css);
}

console.log('V59 applied: stable master modal scroll and true slot move/swap semantics');
