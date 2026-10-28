import {readFileSync,writeFileSync} from 'node:fs';
const path='src/AppV3.jsx', MARK='MERCH_STUDIO_EXPERIENCE_V123';
let app=readFileSync(path,'utf8');
if(!app.includes(MARK)){
 const anchor='const SECTION_STYLES_FIXED_V122 = true;';
 if(!app.includes(anchor))throw Error(MARK+': V122 not installed');
 app=app.replace(anchor,anchor+'\nconst '+MARK+' = true;');
 const left=/<button className=\{'editor-layers-v43 '[\s\S]*?<\/button>/;
 if(!left.test(app))throw Error(MARK+': page header layer action not found');
 app=app.replace(left,whole=>whole+\`<div className="studio-current-page-v123" title={currentPageName}><span>ВИТРИНА · {region}</span><strong>{currentPageName}</strong></div>\`);
 const buttons=/<button className=\{'editor-preview-v43 '[\s\S]*?<\/button>\s*<button type="button" className=\{"editor-analytics-v43 "[\s\S]*?<\/button>/;
 if(!buttons.test(app))throw Error(MARK+': preview/analytics controls not found');
 const modes=\`<div className="studio-view-switch-v123" role="group" aria-label="Режим работы со страницей">
          <button type="button" className={'studio-view-item-v123 '+(!previewMode&&!analyticsModeV120?'active':'')}
            aria-pressed={!previewMode&&!analyticsModeV120} onClick={()=>{setPreviewMode(false);setAnalyticsModeV120(false);setAemAuthorModeV40('edit');setShowCoverage(false);}}>Редактор</button>
          <button type="button" className={'studio-view-item-v123 '+(previewMode?'active':'')}
            aria-pressed={previewMode} onClick={()=>{setAnalyticsModeV120(false);setPreviewMode(true);setAemAuthorModeV40('preview');setShowCoverage(false);}}><Eye size={15}/><span>Просмотр</span></button>
          <button type="button" className={'studio-view-item-v123 '+(analyticsModeV120?'active':'')}
            aria-pressed={analyticsModeV120} onClick={()=>{setAnalyticsModeV120(true);setPreviewMode(false);setAemAuthorModeV40('edit');setShowCoverage(false);}}><BarChart3 size={15}/><span>Аналитика</span></button>
        </div>\`;
 app=app.replace(buttons,modes);
 const canvas='<section className="canvas-shell">';
 if(!app.includes(canvas))throw Error(MARK+': canvas root not found');
 app=app.replace(canvas,canvas+\`{!previewMode&&!analyticsModeV120&&<div className="studio-workspace-context-v123"><div><span className="studio-workspace-kicker-v123">РЕДАКТИРОВАНИЕ СТРАНИЦЫ</span><strong>{currentPageName}</strong><small>{region} · {device==='mobile'?'Мобильная версия':device==='tablet'?'Планшет':'Компьютер'}</small></div><span className="studio-workspace-guidance-v123">Выберите секцию для настройки или перетащите контент в слот</span></div>}\`);
 writeFileSync(path,app);
}
console.log('V123 applied: unified mode switch, current page orientation, and editor-only canvas context');
