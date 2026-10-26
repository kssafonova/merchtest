import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {X,Layers3,MousePointerClick,Image as ImageIcon,RotateCcw,CheckCircle2,ChevronDown,Eye,ShieldCheck,SlidersHorizontal,Play,Lock} from 'lucide-react';
import {chooseTypeV115,normalizedContextV115,recordFeedbackV115,slotCountV115,safeCandidatesV115,PERSONALIZATION_DEFAULT_V115} from './personalization-engine.mjs';

function MiniType({type,device='desktop',large=false}){
  const container=(device==='mobile'&&type?.mobileContainers?.length?type.mobileContainers:type?.containers)?.[0];
  if(!container)return <div className="recsy-empty-preview-v115">Нет слотов</div>;
  const slots=container.slots||[],frame=container.figmaFrameV111||{width:1200,height:600},overlap=Boolean(container.figmaOverlayV111);
  const rows=Math.max(1,...slots.map(slot=>(slot.rowStart||1)+(slot.rows||1)-1));
  return <div className={'recsy-mini-grid-v115'+(overlap?' is-overlay':'')+(large?' is-large-v116':'')} style={overlap?{}:{gridTemplateColumns:'repeat('+(container.cols||12)+',minmax(0,1fr))',gridTemplateRows:'repeat('+rows+',minmax(0,1fr))'}}>
    {slots.map((slot,index)=>{
      const b=slot.sourceBox;
      const style=overlap&&b?{position:'absolute',left:100*b.x/Math.max(1,frame.width)+'%',top:100*b.y/Math.max(1,frame.height)+'%',width:100*b.w/Math.max(1,frame.width)+'%',height:100*b.h/Math.max(1,frame.height)+'%',zIndex:(slot.figmaLayerOrderV111??index)+1}
        :{gridColumn:(slot.start||1)+' / span '+(slot.span||1),gridRow:(slot.rowStart||1)+' / span '+(slot.rows||1)};
      return <span key={slot.figmaNodeId||slot.slotIndex||index} style={style}>{(slot.slotIndex??index)+1}</span>;
    })}
  </div>;
}
const fields={new:'Новый посетитель',returning:'Вернувшийся',product:'Товары',look:'Образы',media:'Медиа'};
const pct=v=>Math.round(v*100)+'%';
export default function PersonalizationPanelV115({open,onClose,sections=[],types=[],activeId,context={},onContext,history={},onHistory,onSave,onRemove,device='desktop'}){
  const [sectionId,setSectionId]=useState(activeId||sections[0]?.id||'');
  const [candidateIds,setCandidateIds]=useState([]);
  const [fixedTypeId,setFixedTypeId]=useState('');
  const [exploration,setExploration]=useState(15);
  const [draftContext,setDraftContext]=useState(context);
  const [tab,setTab]=useState('setup');
  const [showAll,setShowAll]=useState(false);
  const [filter,setFilter]=useState('');
  const [simulateIndex,setSimulateIndex]=useState(0);
  const [notice,setNotice]=useState('');
  const panelRef=useRef(null);
  const active=sections.find(s=>s.id===sectionId)||sections[0];
  const ctx=normalizedContextV115({...draftContext,device});
  useEffect(()=>{
    if(!open)return;
    setSectionId(activeId||sections[0]?.id||'');
    setDraftContext({...context});
    setTab('setup');setSimulateIndex(0);setNotice('');
  },[open,activeId]);
  useEffect(()=>{
    if(!open||!active)return;
    const old=active.personalizationV115||{};
    const available=(types||[]).filter(t=>slotCountV115(t,device)>0);
    const defaults=[active.template?.id,...available.filter(t=>t.id!==active.template?.id).slice(0,3).map(t=>t.id)].filter(Boolean);
    setCandidateIds(old.candidateIds?.length?old.candidateIds:defaults);
    setFixedTypeId(old.fixedTypeId||'');
    setExploration(old.exploration??15);
    setNotice('');setSimulateIndex(0);
  },[open,active?.id]);
  useEffect(()=>{
    if(!open||typeof document==='undefined')return;
    const last=document.activeElement;
    panelRef.current?.focus();
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose?.();return;}
      if(e.key!=='Tab')return;
      const elements=[...panelRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')]
        .filter(el=>el.getClientRects().length&&el.getAttribute('aria-hidden')!=='true');
      if(!elements.length)return;
      const first=elements[0],lastElement=elements[elements.length-1];
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===panelRef.current)){e.preventDefault();lastElement.focus();}
      else if(!e.shiftKey&&document.activeElement===lastElement){e.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);last?.focus?.();};
  },[open,onClose]);
  const minSlots=Math.max(1,...Object.keys(active?.pins||{}).filter(k=>active.pins[k]!=null).map(v=>Number(v)+1).filter(Number.isFinite));
  const eligible=useMemo(()=>{
    const items=new Map(types.filter(t=>slotCountV115(t,device)>=minSlots).map(t=>[t.id,t]));
    if(active?.template?.id&&!items.has(active.template.id))items.set(active.template.id,active.template);
    return [...items.values()];
  },[types,active?.id,device,minSlots]);
  const validCandidates=safeCandidatesV115(types,candidateIds,active,ctx);
  const saveDecision=useMemo(()=>active?chooseTypeV115({section:active,types,candidateIds,context:ctx,history,exploration,fixedTypeId,seed:'merchtest-v115'}):null,[active,types,candidateIds,ctx,history,exploration,fixedTypeId]);
  const demoDecision=useMemo(()=>active?chooseTypeV115({section:active,types,candidateIds,context:ctx,history,exploration,fixedTypeId,seed:'merchtest-v115-'+simulateIndex}):null,[active,types,candidateIds,ctx,history,exploration,fixedTypeId,simulateIndex]);
  const currentDecision=tab==='simulate'&&simulateIndex>0?demoDecision:saveDecision;
  const selectedRecord=currentDecision?.ranked?.find(item=>item.type.id===currentDecision.selected?.id);
  const candidates=eligible.filter(t=>!filter.trim()||String(t.label||t.id).toLowerCase().includes(filter.trim().toLowerCase()));
  const visibleCandidates=showAll?candidates:candidates.slice(0,6);
  const enabled=Boolean(active?.personalizationV115?.enabled);
  const changeDraft=patch=>{setDraftContext(prev=>({...prev,...patch}));setNotice('');};
  const toggle=id=>{setCandidateIds(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id]);if(id===fixedTypeId)setFixedTypeId('');setNotice('');};
  const save=()=>{
    if(!active||!candidateIds.length){setNotice('Выберите минимум один тайп');return;}
    const matches=validCandidates.filter(t=>candidateIds.includes(t.id));
    if(!matches.length){setNotice('Выбранные тайпы недоступны для этих слотов');return;}
    onContext?.({...ctx});
    onSave?.(active.id,{...PERSONALIZATION_DEFAULT_V115,enabled:true,candidateIds:matches.map(t=>t.id),fixedTypeId:fixedTypeId||null,exploration,seed:'merchtest-v115'});
    setNotice('Настройки применены. Предпросмотр витрины обновлён.');
  };
  const signal=positive=>{
    if(!active||!currentDecision?.selected)return;
    onHistory?.(recordFeedbackV115(history,currentDecision.selected.id,active.id,ctx,positive));
    setSimulateIndex(v=>v+1);
    setNotice('Демо-сигнал учтён в локальном прогнозе.');
  };
  if(!open||typeof document==='undefined')return null;
  return createPortal(<div className="recsy-backdrop-v115 recsy-backdrop-v116" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.();}}>
    <aside className="recsy-panel-v115 recsy-panel-v116" ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="recsy-v116-title">
      <header className="recsy-head-v115 recsy-head-v116">
        <div><span>ПЕРСОНАЛИЗАЦИЯ · ДЕМО</span><h2 id="recsy-v116-title">Варианты витрины</h2><p>Настройте, какая геометрия секции подходит разным посетителям.</p></div>
        <button type="button" aria-label="Закрыть настройки" onClick={onClose}><X size={18}/></button>
      </header>
      <nav className="recsy-tabs-v116" aria-label="Режимы персонализации">
        <button type="button" className={tab==='setup'?'active':''} aria-current={tab==='setup'?'page':undefined} onClick={()=>setTab('setup')}><Layers3 size={15}/> Настройка</button>
        <button type="button" className={tab==='simulate'?'active':''} aria-current={tab==='simulate'?'page':undefined} onClick={()=>setTab('simulate')}><Play size={14}/> Проверка сценариев</button>
      </nav>
      <div className="recsy-scroll-v115 recsy-scroll-v116">
        <section className="recsy-summary-v116" aria-live="polite">
          <div className="recsy-summary-top-v116"><div><span>ТЕКУЩЕЕ РЕШЕНИЕ</span><strong>{saveDecision?.selected?.label||active?.template?.label||'Секция без тайпа'}</strong><small>{saveDecision?.mode==='exploration'?'Проверяется альтернатива':saveDecision?.mode==='fixed'?'Тайп закреплён':'Лучший по демо-оценке'}</small></div>
            {saveDecision?.selected&&<MiniType type={saveDecision.selected} device={ctx.device} large/>}
          </div>
          <div className="recsy-summary-meta-v116"><span>{candidateIds.length} вариантов</span><span>{fields[ctx.segment]}</span><span>{fields[ctx.content]}</span><span>{ctx.device==='mobile'?'Mobile':'Desktop'}</span></div>
        </section>
        {tab==='setup'?<>
          <section className="recsy-step-v115 recsy-step-v116">
            <div className="recsy-step-head-v115"><span>1</span><div><strong>Где персонализируем?</strong><small>Секция остаётся частью текущей страницы.</small></div></div>
            <label className="recsy-field-v115">Секция<select value={active?.id||''} onChange={e=>{setSectionId(e.target.value);setFilter('');setShowAll(false);}}>
              {sections.map(s=><option key={s.id} value={s.id}>{s.titles?.ru||s.template?.label||s.id}</option>)}
            </select></label>
          </section>
          <section className="recsy-step-v115 recsy-step-v116">
            <div className="recsy-step-head-v115"><span>2</span><div><strong>Между какими тайпами выбираем?</strong><small>Можно использовать библиотеку и макеты Figma.</small></div></div>
            <div className="recsy-row-v115"><strong>{candidateIds.length} выбрано</strong><button type="button" className="recsy-link-v116" onClick={()=>{setCandidateIds([active?.template?.id].filter(Boolean));setFixedTypeId('');}}>Оставить исходный</button></div>
            {eligible.length>6&&<input className="recsy-type-search-v115" placeholder="Найти тайп по названию" aria-label="Найти тайп" value={filter} onChange={e=>{setFilter(e.target.value);setShowAll(true);}}/>}
            <div className="recsy-type-list-v115 recsy-type-list-v116">
              {visibleCandidates.map(type=><label key={type.id} className={'recsy-type-v115 recsy-type-v116'+(candidateIds.includes(type.id)?' active':'')}>
                <input type="checkbox" checked={candidateIds.includes(type.id)} onChange={()=>toggle(type.id)}/>
                <MiniType type={type} device={ctx.device}/>
                <span><strong>{type.label||type.id}</strong><small>{slotCountV115(type,ctx.device)} слотов · {type.figmaImportedV100?'Из Figma':'Библиотека'}</small></span>
              </label>)}
              {!candidates.length&&<p className="recsy-empty-v116">Тайпы не найдены. Измените поиск.</p>}
            </div>
            {!showAll&&candidates.length>6&&<button className="recsy-more-v116" type="button" onClick={()=>setShowAll(true)}>Показать ещё {candidates.length-6} <ChevronDown size={14}/></button>}
          </section>
          <section className="recsy-step-v115 recsy-step-v116">
            <div className="recsy-step-head-v115"><span>3</span><div><strong>Как выбирать геометрию?</strong><small>Можно сравнивать варианты или закрепить один.</small></div></div>
            <div className="recsy-mode-v116">
              <label className={!fixedTypeId?'active':''}><input type="radio" name="recsy-mode-v116" checked={!fixedTypeId} onChange={()=>setFixedTypeId('')}/><span><strong>Подбирать автоматически</strong><small>С учётом контекста посещения</small></span></label>
              <label className={fixedTypeId?'active':''}><input type="radio" name="recsy-mode-v116" checked={!!fixedTypeId} onChange={()=>setFixedTypeId(saveDecision?.selected?.id||candidateIds[0]||'')}/><span><strong>Закрепить тайп</strong><small>Одинаковая геометрия для всех</small></span></label>
            </div>
            {fixedTypeId&&<label className="recsy-field-v115">Закреплённый тайп<select value={fixedTypeId} onChange={e=>setFixedTypeId(e.target.value)}>{validCandidates.filter(t=>candidateIds.includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.label||t.id}</option>)}</select></label>}
          </section>
          <details className="recsy-advanced-v116"><summary><SlidersHorizontal size={15}/><span><strong>Эксперименты и сигналы</strong><small>Необязательно для первого запуска</small></span><ChevronDown size={15}/></summary>
            <div className="recsy-advanced-body-v116">
              <div className="recsy-slider-v115"><div><span>Доля exploration</span><b>{exploration}%</b></div><input type="range" min="0" max="50" step="5" disabled={!!fixedTypeId} value={exploration} onChange={e=>setExploration(Number(e.target.value))}/><small>Доля альтернативных геометрий в демо-модели</small></div>
              <label className="recsy-field-v115">Сегмент<select value={ctx.segment} onChange={e=>changeDraft({segment:e.target.value})}><option value="new">Новый посетитель</option><option value="returning">Вернувшийся</option></select></label>
              <label className="recsy-field-v115">Тип контента<select value={ctx.content} onChange={e=>changeDraft({content:e.target.value})}><option value="product">Товары</option><option value="look">Образы</option><option value="media">Медиа</option></select></label>
            </div>
          </details>
          <div className="recsy-note-v115 recsy-note-v116"><ShieldCheck size={17}/><span>Ручные PIN защищены. Если выбранный тайп не поддерживает закреплённые слоты, он исключается. Исходный тайп остаётся резервным.</span></div>
        </>:<>
          <section className="recsy-step-v115 recsy-step-v116">
            <div className="recsy-step-head-v115"><span><Eye size={14}/></span><div><strong>Проверьте контекст</strong><small>Симуляция не меняет настройки до нажатия «Применить».</small></div></div>
            <div className="recsy-two-v115">
              <label className="recsy-field-v115">Посетитель<select value={ctx.segment} onChange={e=>changeDraft({segment:e.target.value})}><option value="new">Новый</option><option value="returning">Вернувшийся</option></select></label>
              <label className="recsy-field-v115">Контент<select value={ctx.content} onChange={e=>changeDraft({content:e.target.value})}><option value="product">Товары</option><option value="look">Образы</option><option value="media">Медиа</option></select></label>
            </div>
            <div className="recsy-slider-v115"><div><span>Время просмотра</span><b>{ctx.dwell} сек</b></div><input type="range" min="0" max="90" value={ctx.dwell} onChange={e=>changeDraft({dwell:Number(e.target.value)})}/></div>
            <div className="recsy-slider-v115"><div><span>Глубина скролла</span><b>{ctx.scroll}%</b></div><input type="range" min="0" max="100" value={ctx.scroll} onChange={e=>changeDraft({scroll:Number(e.target.value)})}/></div>
            <div className="recsy-two-v115"><label className="recsy-field-v115">Клики<select value={ctx.click} onChange={e=>changeDraft({click:Number(e.target.value)})}>{[0,1,2,3,5,10].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
              <label className="recsy-field-v115">Избранное<select value={ctx.wishlist} onChange={e=>changeDraft({wishlist:Number(e.target.value)})}>{[0,1,2,3,5].map(v=><option key={v} value={v}>{v}</option>)}</select></label></div>
          </section>
          {currentDecision?.selected&&<section className="recsy-result-v115 recsy-result-v116">
            <div className="recsy-result-title-v115"><span>{currentDecision.mode==='exploration'?'ИССЛЕДОВАНИЕ':currentDecision.mode==='fixed'?'ЗАКРЕПЛЕНО':'ОСНОВНОЙ ВАРИАНТ'}</span><strong>{currentDecision.selected.label}</strong></div>
            <MiniType type={currentDecision.selected} device={ctx.device} large/>
            <p>{currentDecision.reason}. {selectedRecord?.reason.join(' · ')}.</p>
            <div className="recsy-layers-v115"><span><Layers3 size={13}/> Layout</span><span><MousePointerClick size={13}/> Interaction</span><span><ImageIcon size={13}/> Content</span></div>
            <div className="recsy-ranked-v115">{currentDecision.ranked.slice(0,5).map(item=><div key={item.type.id}><span>{item.type.label}</span><meter min="0" max="1" value={item.score}/><strong>{pct(item.score)}</strong></div>)}</div>
          </section>}
          <div className="recsy-feedback-v115 recsy-feedback-v116"><button type="button" onClick={()=>setSimulateIndex(n=>n+1)}><RotateCcw size={14}/> Другой демонстрационный показ</button><button type="button" onClick={()=>signal(true)}>Была вовлечённость</button><button type="button" onClick={()=>signal(false)}>Не было вовлечения</button></div>
          {simulateIndex>0&&<p className="recsy-simulation-note-v116">Сейчас показан отдельный демонстрационный прогон. После сохранения витрина использует стандартное правило.</p>}
          <small className="recsy-disclaimer-v115">Демо-баллы не являются вероятностью покупки, A/B-результатом или прогнозом GOV. События задаются вручную и не собираются с посетителей.</small>
        </>}
      </div>
      <footer className="recsy-foot-v115 recsy-foot-v116">
        <div>{notice?<strong aria-live="polite">{notice}</strong>:<small>{enabled?'Персонализация включена':'Настройки пока не применены'}</small>}</div>
        {enabled&&<button type="button" onClick={()=>{onRemove?.(active.id);setNotice('Персонализация отключена');}}>Отключить</button>}
        <button type="button" className="primary" disabled={!active||!candidateIds.length} onClick={save}><CheckCircle2 size={15}/> Применить к секции</button>
      </footer>
    </aside>
  </div>,document.body);
}
