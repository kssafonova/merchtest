import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourcePath = 'scripts/master-tabs-media-dnd-v55.mjs';
const runtimePath = 'scripts/.master-tabs-media-dnd-v56-runtime.mjs';
let source = readFileSync(sourcePath, 'utf8').replaceAll('MASTER_TABS_MEDIA_DND_V55', 'MASTER_TABS_MEDIA_DND_V56');

const blockStart = source.indexOf('  // STOREFRONT: every filled slot is draggable.');
const blockEnd = source.indexOf('\n  writeFileSync(appPath, app);', blockStart);
if (blockStart < 0 || blockEnd < 0) throw new Error('MASTER_TABS_MEDIA_DND_V56: storefront patch block missing');

const fixedStorefrontPatch = [
  "  // STOREFRONT: use the stable LEGO wrapper as drag source; Slot keeps its existing selection API.",
  "  app = replaceFunction(app, 'SectionCanvas', (chunk) => {",
  "    const dropPattern = /  const onDrop = \\(event, slotIndex\\) => \\{[\\s\\S]*?\\};/;",
  "    if (!dropPattern.test(chunk)) throw new Error(MARKER + ': SectionCanvas onDrop anchor missing');",
  "    const nextDrop = [",
  "      '  const onDrop = (event, slotIndex) => {',",
  "      '    event.preventDefault();',",
  "      '    event.stopPropagation();',",
  "      \"    const storefrontPayload = event.dataTransfer.getData('application/x-storefront-slot-v55');\",",
  "      '    if (storefrontPayload) {',",
  "      '      try {',",
  "      '        const source = JSON.parse(storefrontPayload);',",
  "      '        if (source.sectionId === section.id && Number(source.slotIndex) === Number(slotIndex)) return;',",
  "      '        const targetSlot = (section.resolvedSlots || []).find((item) => Number(item.index) === Number(slotIndex));',",
  "      '        const targetEntityId = targetSlot?.entity?.id || null;',",
  "      '        if (targetEntityId) onPin(source.sectionId, Number(source.slotIndex), targetEntityId);',",
  "      '        else onUnpin(source.sectionId, Number(source.slotIndex));',",
  "      '        onPin(section.id, Number(slotIndex), source.entityId);',",
  "      '        return;',",
  "      '      } catch (error) { console.warn(\\\'Не удалось перенести слот\\\', error); }',",
  "      '    }',",
  "      \"    const id = event.dataTransfer.getData('text/plain');\",",
  "      '    if (id) onPin(section.id, slotIndex, id);',",
  "      '  };'",
  "    ].join('\\n');",
  "    chunk = chunk.replace(dropPattern, nextDrop);",
  "",
  "    const wrapperAnchor = ' key={si} style={{ gridColumn:';",
  "    if (!chunk.includes(wrapperAnchor)) throw new Error(MARKER + ': v2-slot wrapper anchor missing');",
  "    const dragProps = ' key={si} draggable={Boolean(slot?.entity)} onDragStart={(event) => { if (!slot?.entity) return; event.stopPropagation(); event.dataTransfer.effectAllowed = \\\'move\\\'; event.dataTransfer.setData(\\\'application/x-storefront-slot-v55\\\', JSON.stringify({ sectionId: section.id, slotIndex: slot.index, entityId: slot.entity.id, status: slot.status })); event.dataTransfer.setData(\\\'text/plain\\\', slot.entity.id); }} style={{ gridColumn:';",
  "    chunk = chunk.replace(wrapperAnchor, dragProps);",
  "    return chunk;",
  "  });",
  ""
].join('\n');

source = source.slice(0, blockStart) + fixedStorefrontPatch + source.slice(blockEnd);
writeFileSync(runtimePath, source);
try {
  execFileSync(process.execPath, [runtimePath], { stdio: 'inherit' });
} finally {
  try { unlinkSync(runtimePath); } catch {}
}

console.log('Master tabs + media + cross-section DnD V56 compatibility wrapper applied');
