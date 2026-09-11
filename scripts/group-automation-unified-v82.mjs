import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
let app=readFileSync(appPath,'utf8');
const MARKER='GROUP_AUTOMATION_UNIFIED_V82';

function functionChunk(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0) throw new Error(MARKER+': function '+name+' missing');
  const end=source.indexOf('\nfunction ',start+name.length+10);
  if(end<0) throw new Error(MARKER+': end of '+name+' missing');
  return {start,end,chunk:source.slice(start,end)};
}

if(!app.includes(MARKER)){
  const anchor='const RUNTIME_LOOKS_V81 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V81 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // One automation editor for both scopes. The group wrapper only supplies
  // scope/membership; every visual block, scenario and control is the same V77
  // UnifiedAutomationDrawer used by a single section.
  const groupPart=functionChunk(app,'GroupSectionRulesDrawerV60');
  const unified=String.raw`function GroupSectionRulesDrawerV60({ sections=[], allSections=[], region, pageId='', currentPage=null, onApply, onClose }) {
  const sourceSections=(sections||[]).filter((section)=>section&&!section.generatedByAutomationGroupV64);
  const targetSection=sourceSections.find((section)=>section?.automationGroup?.groupId) || sourceSections[0] || null;
  if(!targetSection) return null;
  const selectedIds=sourceSections.map((section)=>section.id);
  return <UnifiedAutomationDrawerV69
    targetSection={targetSection}
    allSections={allSections?.length?allSections:sourceSections}
    selectedIds={selectedIds}
    region={region}
    pageId={pageId}
    currentPage={currentPage}
    onApplySingle={(rule,sectionId)=>onApply?.(rule,[sectionId],{mode:'incremental',groupId:null})}
    onApplyGroup={(rule,memberIds,options)=>onApply?.(rule,memberIds,options)}
    onClose={onClose}
  />;
}`;
  app=app.slice(0,groupPart.start)+unified+app.slice(groupPart.end);

  // Pass the same page context that the single-section entry receives. This
  // keeps the default Department/section filter and scenario context identical.
  app=app.replaceAll(
    'allSections={sections} region={region} onApply={applyGroupRulesV64}',
    'allSections={sections} region={region} pageId={pageId} currentPage={currentPage} onApply={applyGroupRulesV64}'
  );

  writeFileSync(appPath,app);
}

console.log('V82 applied: group automation uses the exact same V77 editor, page context and scenarios as a single section');
