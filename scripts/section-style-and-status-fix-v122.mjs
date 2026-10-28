import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx',MARK='SECTION_STYLES_FIXED_V122';
let app=readFileSync(path,'utf8');
if(!app.includes(MARK)){
 const marker='const MERCH_SECTION_APPEARANCE_V121 = true;';
 if(!app.includes(marker))throw Error(MARK+': V121 missing');
 app=app.replace(marker,marker+'\nconst '+MARK+' = true;');
 app="import {sectionStyleVarsV122,applySectionAppearanceV122} from './section-appearance-v122.mjs';\n"+app;
 const renderPattern=/<SectionCanvas\b[\s\S]*?\/>/g;
 let rendered=0;
 app=app.replace(renderPattern,tag=>{
   rendered++;
   if(tag.includes('onStyleChange='))return tag;
   return tag.slice(0,-2)+"\n onStyleChange={patch=>updateSection(section.id,existing=>applySectionAppearanceV122(existing,patch))}"+' />';
 });
 if(rendered!==1)throw Error(MARK+': expected one SectionCanvas instance; got '+rendered);
 function part(name){const a=app.indexOf('function '+name+'('),b=a>=0?app.indexOf('\nfunction ',a+10):-1;if(a<0||b<0)throw Error(MARK+': missing '+name);return {a,b,s:app.slice(a,b)};}
 const c=part('SectionCanvas');let s=c.s;
 const wire='onChange={patch=>SECTION_CANVAS_RUNTIME_V58.updateStyle?.(section.id,patch)}';
 if(!s.includes(wire))throw Error(MARK+': old indirect style callback missing');
 s=s.replace(wire,'onChange={onStyleChange}');
 const signature=/function SectionCanvas\(\{([^}]*)\}\) \{/;
 const sig=s.match(signature);if(!sig)throw Error(MARK+': Canvas props missing');
 if(!sig[1].includes('onStyleChange'))s=s.replace(signature,(whole,args)=>'function SectionCanvas({'+args+',onStyleChange }) {');
 const root='data-hide-elements-v121={Boolean(section.styleV57?.hideElements)} className=';
 if(!s.includes(root))throw Error(MARK+': section root not found');
 s=s.replace(root,'data-hide-elements-v121={Boolean(section.styleV57?.hideElements)} data-section-appearance-v122="true" style={sectionStyleVarsV122(section.styleV57)} className=');
 // Remove the legacy visible section name/header from BOTH edit and preview DOM.
 const begin=s.indexOf('<div className="section-header-line">');
 if(begin<0)throw Error(MARK+': legacy section header missing');
 const suffix=s.slice(begin);
 const tags=/<\/?div\b[^>]*>/g;let depth=0,endOffset=-1,match;
 while((match=tags.exec(suffix))){
  if(match[0].startsWith('</'))depth--;else depth++;
  if(depth===0){endOffset=tags.lastIndex;break;}
 }
 if(endOffset<0)throw Error(MARK+': unbalanced section header');
 s=s.slice(0,begin)+s.slice(begin+endOffset);
 const toolbarIdentity=/<div className="section-author-identity-v57 section-author-identity-v60"[^>]*>[\s\S]*?<\/div>/;
 if(!toolbarIdentity.test(s))throw Error(MARK+': section toolbar name missing');
 s=s.replace(toolbarIdentity,'<span className="section-toolbar-count-v122">{section.resolvedSlots?.filter(slot=>slot.entity).length||0}/{section.resolvedSlots?.length||0} слотов</span>');
 const renameAction=/<button className="section-author-action-v57" onClick=\{\(\)=>\{onSelect\(section.id\);setStyleDrawerOpenV57\(true\);\}\}><LayoutGrid size=\{13\}\/><span>Название<\/span><\/button>/;
 if(!renameAction.test(s))throw Error(MARK+': canvas rename action missing');
 s=s.replace(renameAction,'');
 if(s.includes('className="section-header-line"'))throw Error(MARK+': old title still in Canvas');
 app=app.slice(0,c.a)+s+app.slice(c.b);
 const bar=part('AutomationStatusBarV63');
 app=app.slice(0,bar.a)+"function AutomationStatusBarV63({rule,status}){\n  const state=rule?.state==='published'?'Опубликовано':'Черновик';\n  const values=status||rule?.status||{};\n  const coverage=Number.isFinite(Number(values.coverage))?Math.min(100,Math.max(0,Number(values.coverage))):null;\n  const reserve=values.reserveCount!=null&&Number.isFinite(Number(values.reserveCount))?Math.max(0,Number(values.reserveCount)):null;\n  const conflicts=values.skuConflicts!=null&&Number.isFinite(Number(values.skuConflicts))?Math.max(0,Number(values.skuConflicts)):null;\n  const pins=values.pinCount!=null&&Number.isFinite(Number(values.pinCount))?Math.max(0,Number(values.pinCount)):null;\n  return <div className=\"automation-statusbar-v63 automation-status-v122\">\n    <div className=\"automation-status-head-v122\">\n      <span className={'automation-state-v63 '+(rule?.state==='published'?'published':'draft')}>{state}</span>\n      <strong>Заполнено {coverage==null?'—':coverage+'%'}</strong>\n      <span>PIN {pins??'—'}</span>\n      {conflicts>0&&<span className=\"automation-status-warning-v122\">{conflicts} повторов SKU</span>}\n    </div>\n    <details className=\"automation-status-extra-v122\">\n      <summary>Резерв и проверки <ChevronDown size={13}/></summary>\n      <div className=\"automation-status-extra-grid-v122\">\n        <div><small>Резерв</small><strong>{reserve??'—'}</strong><p>Подходящие товары, не размещённые в слотах</p></div>\n        <div><small>Конфликты SKU</small><strong>{conflicts??'—'}</strong><p>Повторное использование артикула, найденное автоматизацией</p></div>\n      </div>\n    </details>\n  </div>;\n}\n"+app.slice(bar.b);
 writeFileSync(path,app);
}
console.log('V122 fixed: direct style persistence, root CSS variables, no visible section title, compact reserve/conflict UX');
