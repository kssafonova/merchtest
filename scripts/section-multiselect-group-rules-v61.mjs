import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const sourcePath = 'scripts/section-multiselect-group-rules-v60.mjs';
const runtimePath = 'scripts/.section-multiselect-group-rules-v61-runtime.mjs';
let source = readFileSync(sourcePath, 'utf8');
source = source.replace("const MARKER = 'SECTION_MULTISELECT_GROUP_RULES_V60';", "const MARKER = 'SECTION_MULTISELECT_GROUP_RULES_V61';");

const start = source.indexOf('  const sectionCallPattern = /<SectionCanvas');
const end = start >= 0 ? source.indexOf('\n\n  // Current AEM Structure tree', start) : -1;
if (start < 0 || end < 0) throw new Error('V61: V60 SectionCanvas wiring block not found');

const replacement = String.raw`  const sectionWireAnchorV61 = 'onUnpin={unpin} onMoveV59={moveSlotEntityV59}';
  if (!app.includes(sectionWireAnchorV61)) throw new Error(MARKER + ': V59 SectionCanvas wiring anchor missing');
  app = app.replaceAll(sectionWireAnchorV61, sectionWireAnchorV61 + ' onMoveSectionV60={moveSectionV60} onMoveSectionDropV60={moveSectionDropV60} onDuplicateSectionV60={duplicateSectionSetV60} onDeleteSectionV60={deleteSectionSetV60} onGroupRulesV60={() => setGroupRulesOpenV60(true)} selectedCountV60={selectedSectionIdsEffectiveV60.length} sectionIndexV60={resolved.findIndex((item) => item.id === section.id)} sectionCountV60={resolved.length}');`;

source = source.slice(0, start) + replacement + source.slice(end);
writeFileSync(runtimePath, source);
try {
  execFileSync(process.execPath, [runtimePath], { stdio: 'inherit' });
} finally {
  try { unlinkSync(runtimePath); } catch {}
}

console.log('V61 applied: V60 UX with stable SectionCanvas wiring');
