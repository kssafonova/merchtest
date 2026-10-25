import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Link2, FileJson2, Layers3, Check, X, Image as Picture, AlertTriangle } from 'lucide-react';
import { convertFigmaFile, makeFigmaSection, updateImportedText, parseFigmaUrl } from './figma-bridge.mjs';
import {FIGMA_SESSION_KEY, FIGMA_PENDING_KEY, figmaBridgeUrl, rememberFigmaLink, extractFigmaSessionFromHash, importFigmaFromUrl} from './figma-hosted-client.mjs';
import {makeFigmaSlotSection,inspectFigmaSlots,isCompactVectorDiagram} from './figma-slot-import.mjs';

const bounded=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const alignMain={MIN:'flex-start',CENTER:'center',MAX:'flex-end',SPACE_BETWEEN:'space-between'};
const alignCross={MIN:'flex-start',CENTER:'center',MAX:'flex-end',BASELINE:'baseline'};
const safeFont=(v)=>/^[\w \-.,]+$/.test(v||'')?v:'Inter';
function boxStyle(node,parent,root){
  const style={boxSizing:'border-box',opacity:bounded(node.opacity??1,0,1)};
  if(node.background)style.backgroundColor=node.background;
  if(node.stroke&&node.strokeWeight>0)style.border=bounded(node.strokeWeight,0,16)+'px solid '+node.stroke;
  if(node.radius)style.borderRadius=bounded(node.radius,0,160);
  if(node.image){style.backgroundImage='url("'+node.image.replace(/"/g,'')+'")';style.backgroundSize='cover';style.backgroundPosition='center';}
  const b=node.box||{x:0,y:0,w:200,h:100};
  if(root){
    style.width='100%';
    style.maxWidth='100%';
    style.minHeight=Math.min(1800,Math.max(24,b.h||100));
  }else if(parent?.layout==='absolute'){
    const pb=parent.box||{x:0,y:0,w:375,h:100};
    style.position='absolute';
    style.left=(100*bounded((b.x-pb.x)/Math.max(1,pb.w),-2,3))+'%';
    style.top=(100*bounded((b.y-pb.y)/Math.max(1,pb.h),-2,3))+'%';
    style.width=(100*bounded(b.w/Math.max(1,pb.w),0,4))+'%';
    style.height=(100*bounded(b.h/Math.max(1,pb.h),0,4))+'%';
  }else{
    style.flex='0 1 auto';
    style.minWidth=0;
    if(parent?.layout==='row'&&b.w>0)style.flexBasis=Math.min(b.w,1400)+'px';
    if(parent?.layout==='column')style.width='100%';
    if(node.kind==='shape'||node.kind==='ellipse')style.minHeight=Math.min(1000,Math.max(b.h,16));
  }
  if(node.layout==='row'||node.layout==='column'){
    style.display='flex';
    style.flexDirection=node.layout;
    style.alignItems=alignCross[node.cross]||'stretch';
    style.justifyContent=alignMain[node.primary]||'flex-start';
    style.gap=bounded(node.gap,0,200)+'px';
    style.padding=(node.padding||[0,0,0,0]).map(n=>bounded(n,0,350)+'px').join(' ');
    style.minHeight='max-content';
  }else if(node.children?.length){
    style.position=style.position||'relative';
    if(!root)style.minHeight=Math.max(16,b.h);
    style.overflow='hidden';
  }
  if(node.kind==='ellipse')style.borderRadius='50%';
  return style;
}
function FigmaLayer({node,parent,root=false,editable,onChange,depth=0}){
  if(!node||depth>22)return null;
  const style=boxStyle(node,parent,root);
  if(node.kind==='text'){
    const f=node.font||{};
    Object.assign(style,{
      whiteSpace:'pre-wrap',overflowWrap:'anywhere',color:f.color||'#111',
      fontFamily:safeFont(f.family)+', Inter, sans-serif',fontSize:bounded(f.size||16,7,120),
      fontWeight:bounded(f.weight||400,100,900),lineHeight:f.line?bounded(f.line,8,240)+'px':1.3,
      letterSpacing:bounded(f.letter||0,-5,20),textAlign:(f.align||'LEFT').toLowerCase(),
    });
    return <span className={'figma-layer-v97 figma-text-v97 '+(editable?'editable':'')} style={style}
      contentEditable={editable} suppressContentEditableWarning spellCheck={false}
      title={editable?'Нажмите и измените текст':''}
      onClick={e=>editable&&e.stopPropagation()}
      onBlur={e=>{if(editable){const next=e.currentTarget.innerText;if(next!==node.text)onChange?.(node.id,next);}}}
    >{node.text||''}</span>;
  }
  const Tag=node.kind==='container'?'div':'div';
  return <Tag className={'figma-layer-v97 figma-kind-'+node.kind+' figma-layout-'+node.layout+(root?' figma-root-v97':'')}
    data-figma-layer={node.id} style={style}>
    {node.children?.map((c,i)=><FigmaLayer key={c.id+'-'+i} node={c} parent={node} editable={editable} onChange={onChange} depth={depth+1}/>)}
  </Tag>;
}
export function FigmaRenderedLayout({section,editable=false,onTextChange}){
  if(!section?.figmaNode)return null;
  return <div className="figma-imported-block-v97" onClick={e=>e.stopPropagation()}>
    {!editable?null:<div className="figma-edit-hint-v97"><Layers3 size={14}/> Figma · текст редактируется нажатием · секцию можно переместить и дублировать</div>}
    <div className="figma-render-v97" aria-label={'Импортированный дизайн: '+(section.figmaNode.name||'Figma')}>
      <FigmaLayer node={section.figmaNode} root editable={editable} onChange={(nodeId,text)=>onTextChange?.(section.id,nodeId,text)}/>
    </div>
  </div>;
}
export function FigmaImportDialog({open,onClose,onImport,initialFile=null}){
  const [doc,setDoc]=useState(null);
  const [chosen,setChosen]=useState([]);
  const [mode,setMode]=useState('append');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [drag,setDrag]=useState(false);
  const [link,setLink]=useState('');
  const [jsonText,setJsonText]=useState('');
  const [mobileJsonText,setMobileJsonText]=useState('');
  const [mobileDoc,setMobileDoc]=useState(null);
  const [sectionNames,setSectionNames]=useState({});
  const [interpretMiniature,setInterpretMiniature]=useState(false);
  const [connected,setConnected]=useState(()=>typeof sessionStorage!=='undefined' && Boolean(sessionStorage.getItem(FIGMA_SESSION_KEY)));
  const [linkBusy,setLinkBusy]=useState(false);
  const bridge=figmaBridgeUrl();
  const ref=useRef(null);
  function loadMobileJson(){
    if(!mobileJsonText.trim()){setMobileDoc(null);setError('');return;}
    try{
      const parsed=convertFigmaFile(JSON.parse(mobileJsonText));
      if(doc && parsed.blocks.length!==doc.blocks.length)throw Error('Число мобильных фреймов должно совпадать с Desktop ('+doc.blocks.length+').');
      setMobileDoc(parsed);setError('');
    }catch(e){setError('Mobile JSON: '+(e.message||'ошибка формата'));}
  }
  const mobileFor=(block,i)=>mobileDoc?.blocks?.length===doc?.blocks?.length?mobileDoc.blocks[i]:null;
  function loadPastedJson(){
    setError('');setDoc(null);setChosen([]);
    try{
      if(jsonText.length>10*1024*1024)throw Error('Слишком большой JSON. Используйте импорт из файла.');
      const source=JSON.parse(jsonText);
      const next=convertFigmaFile(source);
      setDoc(next);setChosen(next.blocks.map((_,i)=>i));setMobileDoc(null);setMobileJsonText('');setSectionNames({});
    }catch(e){setError('Ошибка JSON: '+(e?.message||'Не удалось распознать макет.'));}
  }
  async function load(file){
    if(!file)return;
    setError('');setBusy(true);
    try{
      if(file.size>30*1024*1024)throw Error('Файл больше 30 МБ. Экспортируйте меньше фреймов или оптимизируйте изображения.');
      const parsed=JSON.parse(await file.text());
      const next=convertFigmaFile(parsed);
      setDoc(next);setChosen(next.blocks.map((_,i)=>i));
    }catch(e){setError(e.message||'Не удалось прочитать экспорт Figma.');setDoc(null);setChosen([]);}
    finally{setBusy(false);}
  }
  useEffect(()=>{if(open&&initialFile)load(initialFile);},[open,initialFile]);
  useEffect(()=>{
    try{
      const token=extractFigmaSessionFromHash(window.location.hash);
      if(!token)return;
      window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
      setConnected(true);
      const pending=sessionStorage.getItem(FIGMA_PENDING_KEY);
      if(pending){sessionStorage.removeItem(FIGMA_PENDING_KEY);setLink(pending);loadLink(pending,token);}
    }catch(e){setError(e.message||'Не удалось подключить Figma.');}
  },[]);
  async function loadLink(value,token=sessionStorage.getItem(FIGMA_SESSION_KEY)){
    setError('');setLinkBusy(true);
    try{
      const next=await importFigmaFromUrl(value,{endpoint:bridge,session:token});
      setDoc(next);setChosen(next.blocks.map((_,i)=>i));
      if(next.warning)setError(next.warning);
    }catch(e){
      if(e.status===401){sessionStorage.removeItem(FIGMA_SESSION_KEY);setConnected(false);}
      setError(e.message||'Не удалось импортировать макет по ссылке.');
      setDoc(null);setChosen([]);
    }finally{setLinkBusy(false);}
  }
  function submitLink(){
    try{
      parseFigmaUrl(link);
      if(!bridge)throw Error('Для прямого импорта администратор должен один раз подключить облачный Figma OAuth. Пока можно использовать JSON-экспорт.');
      const token=sessionStorage.getItem(FIGMA_SESSION_KEY);
      if(token){loadLink(link,token);return;}
      rememberFigmaLink(link);
      window.location.assign(bridge+'/auth/start');
    }catch(e){setError(e.message||'Не удалось обработать ссылку.');}
  }
  useEffect(()=>{if(!open){setDoc(null);setChosen([]);setError('');setLink('');setJsonText('');setMobileJsonText('');setMobileDoc(null);setSectionNames({});setMode('append');setInterpretMiniature(false);}},[open]);
  if(!open)return null;
  const previews=doc?.blocks.map((block,i)=>{try{return {result:inspectFigmaSlots(block,{interpretMiniature,mobileBlock:mobileFor(block,i),name:sectionNames[i]||block.name}),error:null};}catch(e){return {result:null,error:e.message||'Не удалось определить слоты.'};}})||[];
  const hasMiniature=Boolean(doc?.blocks.some(isCompactVectorDiagram));
  const selected=doc?.blocks.filter((_,i)=>chosen.includes(i))||[];
  const selectedInvalid=chosen.filter(i=>previews[i]?.error);
  const validCount=chosen.length-selectedInvalid.length;
  function drop(e){
    e.preventDefault();e.stopPropagation();setDrag(false);
    const f=[...(e.dataTransfer?.files||[])].find(f=>f.name.toLowerCase().endsWith('.json'));
    if(f)load(f);else setError('Перетащите JSON, экспортированный из Figma.');
  }
  return <div className="figma-import-backdrop-v97" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="figma-import-dialog-v97" role="dialog" aria-modal="true" aria-labelledby="figma-import-title" onMouseDown={e=>e.stopPropagation()}>
      <header><div><span>DESIGN TO EDITOR</span><h2 id="figma-import-title">Создать секции по макету Figma</h2><p>Figma задаёт расположение и размер слотов. Сами слоты останутся пустыми: добавьте товары, образы, изображения или настройте автонаполнение в редакторе.</p></div><button aria-label="Закрыть" onClick={onClose}><X size={20}/></button></header>
      <div className="figma-import-body-v97">
        <section className="figma-json-main-v103" aria-labelledby="figma-json-title-v103">
          <div className="figma-json-main-heading-v103">
            <FileJson2 size={19}/>
            <div>
              <strong id="figma-json-title-v103">Вставить JSON макета</strong>
              <small>Скопируйте JSON из Figma и вставьте прямо сюда. Никаких файлов и OAuth не требуется.</small>
            </div>
          </div>
          <label htmlFor="figma-json-paste-v101">JSON структуры секции</label>
          <textarea id="figma-json-paste-v101" rows={12} spellCheck={false} autoCapitalize="off" autoCorrect="off"
            placeholder={'{\n  "type": "FRAME",\n  "name": "Секция",\n  "x": 0, "y": 0,\n  "width": 1200, "height": 600,\n  "children": []\n}'}
            value={jsonText} onChange={e=>{setJsonText(e.target.value);setError('');setDoc(null);setChosen([]);}}
            onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();loadPastedJson();}}}/>
          <div className="figma-json-main-actions-v103">
            <span>{jsonText.trim()?jsonText.length.toLocaleString('ru-RU')+' символов':'Поддерживается объект FRAME, массив фреймов и Figma API JSON'}</span>
            <div>
              {jsonText.trim()&&<button type="button" className="figma-json-clear-v103" onClick={()=>{setJsonText('');setDoc(null);setChosen([]);setError('');}}>Очистить</button>}
              <button type="button" className="figma-json-check-v103" onClick={loadPastedJson} disabled={!jsonText.trim()||busy||linkBusy}>Проверить JSON и слоты</button>
            </div>
          </div>
        </section>
        <details className="figma-import-alternatives-v103">
          <summary>Другие способы импорта: ссылка Figma или файл .json</summary>
        <div className="figma-link-primary-v99">
          <div className="figma-link-header-v99"><Link2 size={18}/><div><strong>Импорт по ссылке</strong><small>Вставьте ссылку на файл или конкретный Frame из Figma.</small></div></div>
          <div className="figma-link-controls-v99"><input type="url" aria-label="Ссылка на Figma" value={link} onChange={e=>{setLink(e.target.value);setError('');}} onKeyDown={e=>{if(e.key==='Enter')submitLink();}} placeholder="https://www.figma.com/design/…" />
            <button type="button" className="primary" disabled={!link.trim()||linkBusy} onClick={submitLink}>{linkBusy?'Загружаю…':connected?'Загрузить макет':'Импортировать'}</button>
          </div>
          <p className="figma-link-status-v99">{!bridge?'Для импорта без файлов нужно подключить сервер OAuth — пока он не настроен.':connected?'Figma подключена. Можно вставлять ссылки на доступные макеты.':'Если макет требует доступа, откроется безопасный вход в Figma. Вводить токен не нужно.'}</p>
        </div>
        <div className="figma-import-separator-v99"><span>ИЛИ ЗАГРУЗИТЕ JSON-ФАЙЛ</span></div>
        <div className={'figma-import-zone-v97'+(drag?' dragging':'')} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={drop}>
          <UploadCloud size={28}/>
          <strong>Перетащите экспорт Figma (.json)</strong>
          <span>Или выберите файл с компьютера</span>
          <input ref={ref} type="file" accept=".json,application/json" hidden onChange={e=>load(e.target.files?.[0])}/>
          <button type="button" onClick={()=>ref.current?.click()}>Выбрать JSON</button>
          <small>Поддерживаются Figma API JSON и экспорт плагина. Максимум 30 МБ.</small>
        </div>
        </details>
        {doc&&<section className="figma-mobile-input-v106" aria-label="Мобильный макет">
          <div><strong>Mobile — отдельный JSON (необязательно)</strong><small>Те же слоты, но другая раскладка. Без мобильного JSON редактор построит 4-колоночную сетку автоматически.</small></div>
          <textarea rows={5} value={mobileJsonText} placeholder='{"type":"FRAME","name":"Mobile","width":375,"height":720,"children":[...]}' spellCheck={false} onChange={e=>{setMobileJsonText(e.target.value);setMobileDoc(null);setError('');}}/>
          <div className="figma-mobile-actions-v106"><button type="button" disabled={!mobileJsonText.trim()} onClick={loadMobileJson}>Применить Mobile JSON</button>{mobileDoc&&<span>Мобильный макет подключён</span>}</div>
        </section>}
        {error&&<div className="figma-import-warning-v97" role="status"><AlertTriangle size={16}/><span>{error}</span></div>}
        {busy&&<div className="figma-import-busy-v97">Чтение слоёв Figma…</div>}
        {doc&&<div className="figma-import-review-v97">
          <div className="figma-review-title-v97"><div><strong>Найдено макетов: {doc.blocks.length}</strong><small>{doc.source} · каждый фрейм создаст отдельный тайп со слотами</small></div><button onClick={()=>setChosen(chosen.length===doc.blocks.length?[]:doc.blocks.map((_,i)=>i))}>{chosen.length===doc.blocks.length?'Снять выбор':'Выбрать все'}</button></div>
          <div className="figma-review-list-v97">{doc.blocks.map((block,i)=><label key={block.id+'-'+i} className={chosen.includes(i)?'picked':''}>
            <input type="checkbox" checked={chosen.includes(i)} onChange={e=>setChosen(s=>e.target.checked?[...s,i]:s.filter(n=>n!==i))}/>
            <span className="figma-frame-icon-v97"><Layers3 size={20}/></span><span><strong>{block.name}</strong><small>{previews[i]?.error?'Нужно исправить Figma: '+previews[i].error:previews[i]?.result.count+' пустых слотов · адаптивная сетка 12/4'} · {Math.round(block.box?.w||0)} × {Math.round(block.box?.h||0)} px</small></span>
            {chosen.includes(i)&&<Check size={16}/>}
          </label>)}</div>
          <div className="figma-section-properties-v106">
            {doc.blocks.map((block,i)=><div className="figma-section-prop-v106" key={'figma-section-prop-'+i}>
              <label>Компонент «Секция» · название
                <input value={sectionNames[i]??block.name??''} maxLength={100} onChange={e=>setSectionNames(prev=>({...prev,[i]:e.target.value}))} placeholder="Например, Editorial · 5 слотов"/>
              </label>
              {previews[i]?.result&&<div className="figma-section-device-previews-v106">
                {['desktop','mobile'].map(device=>{
                  const slots=previews[i].result[device];
                  const cols=device==='desktop'?12:4;
                  const rows=Math.max(1,...slots.map(x=>x.rowStart+x.rows-1));
                  return <div className={'figma-section-device-v106 '+device} key={device}>
                    <strong>{device==='desktop'?'Desktop · 12 колонок':'Mobile · 4 колонки'} {device==='mobile'&&<small>{previews[i].result.mobileMode==='imported'?'из Figma':'автоматически'}</small>}</strong>
                    <div className="figma-section-mini-grid-v106" style={{gridTemplateColumns:'repeat('+cols+',minmax(0,1fr))',gridTemplateRows:'repeat('+rows+',minmax(18px,1fr))'}}>
                      {slots.map((slot,k)=><span key={k} style={{gridColumn:slot.start+' / span '+slot.span,gridRow:slot.rowStart+' / span '+slot.rows}} title={slot.name}>{Number.isInteger(slot.slotIndex)?slot.slotIndex+1:k+1}</span>)}
                    </div>
                  </div>;
                })}
              </div>}
            </div>)}
          </div>
          {hasMiniature&&<label className="figma-miniature-option-v102">
            <input type="checkbox" checked={interpretMiniature} onChange={e=>setInterpretMiniature(e.target.checked)}/>
            <span><strong>Считать миниатюру схемой слотов</strong><small>Для небольших схем из FRAME или VECTOR: каждый конечный прямоугольник станет пустым слотом. Включайте только если это схема раскладки, а не иконка.</small></span>
          </label>}
          <div className="figma-slot-explanation-v100"><strong>Что произойдёт после импорта</strong><p>Создадим тайп с геометрией из Figma. Слоты останутся пустыми и будут работать как обычные слоты редактора: можно перетащить контент, закрепить PIN или включить автонаполнение. Макет появится в библиотеке секций для повторного использования.</p>{selectedInvalid.length>0&&<p className="figma-slot-error-v100">Проверьте выделенные макеты: {selectedInvalid.length} не удалось перевести в сетку без пересечений.</p>}</div>
          <div className="figma-import-mode-v97"><strong>Куда добавить?</strong><label><input type="radio" name="figma-import-mode" checked={mode==='append'} onChange={()=>setMode('append')}/><span><b>В конец текущей страницы</b><small>Существующие секции останутся без изменений.</small></span></label><label><input type="radio" name="figma-import-mode" checked={mode==='replace'} onChange={()=>setMode('replace')}/><span><b>Заменить секции страницы</b><small>Можно отменить через Undo до перезагрузки.</small></span></label></div>
        </div>}
      </div>
      <footer><span>{doc?validCount+' макетов · '+selected.reduce((sum,block)=>sum+(previews[doc.blocks.indexOf(block)]?.result?.count||0),0)+' пустых слотов':'Контент импортирован не будет — только структура слотов'}</span><button onClick={onClose}>Отмена</button><button className="primary" disabled={!selected.length||selectedInvalid.length>0||busy||linkBusy} onClick={()=>{if(mode==='replace'&&!window.confirm('Заменить все секции текущей страницы макетами из Figma?'))return;try{onImport(selected.map((x,i)=>makeFigmaSlotSection(x,i,{interpretMiniature,mobileBlock:mobileFor(x,doc.blocks.indexOf(x)),name:sectionNames[doc.blocks.indexOf(x)]?.trim()||x.name||'Секция из Figma'})),mode);}catch(e){setError(e.message||'Не удалось создать секции из Figma.');}}}>Создать {selected.length||''} {selected.length===1?'секцию':'секции'}</button></footer>
    </div>
  </div>;
}
