import React, {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {Sparkles,X,Layers3,MousePointerClick,Image as ImageIcon,Lock,RotateCcw,Plus,CheckCircle2} from 'lucide-react';
import {chooseTypeV115,layoutFeaturesV115,normalizedContextV115,recordFeedbackV115,safeCandidatesV115,slotCountV115,PERSONALIZATION_DEFAULT_V115} from './personalization-engine.mjs';

const formats={new:'Новый посетитель',returning:'Вернувшийся',product:'Товары',look:'Образы',media:'Медиа'};
const percent=v=>Math.round(v*100)+'%';
function MiniType({type,device='desktop'}){
  const containers=device==='mobile'&&type?.mobileContainers?.length?type.mobileContainers:type?.containers;
  const c=containers?.[0];
  if(!c)return <div className="recsy-empty-preview-v115">Нет слотов</div>;
  const frame=c.figmaFrameV111||{width:1200,height:600};
  const sourceSlots=c.slots||[];
  const maxRows=Math.max(1,...sourceSlots.map(s=>Number(s.rowStart||1)+Number(s.rows||1)-1));
  const overlay=Boolean(c.figmaOverlayV111);
  return <div className={'recsy-mini-grid-v115'+(overlay?' is-overlay':'')} style={overlay?{aspectRatio:frame.width+'/'+frame.height}:{gridTemplateColumns:'repeat('+c.cols+',minmax(0,1fr))',gridTemplateRows:'repeat('+maxRows+',minmax(12px,1fr))'}}>
    {sourceSlots.map((slot,i)=>{
      const b=slot.sourceBox;
      const pos=overlay&&b?{position:'absolute',left:(b.x/frame.width*100)+'%',top:(b.y/frame.height*100)+'%',width:(b.w/frame.width*100)+'%',height:(b.h/frame.height*100)+'%',zIndex:(slot.figmaLayerOrderV111??i)+1}:{
        gridColumn:(slot.start||1)+' / span '+(slot.span||1),gridRow:(slot.rowStart||1)+' / span '+(slot.rows||1),
      };
      return <span key={slot.slotIndex??i} style={pos}>{(slot.slotIndex??i)+1}</span>;
    })}
  </div>;
}
export default function PersonalizationPanelV115({open,onClose,sections=[],types=[],activeId,context={},onContext,history={},onHistory,onSave,onRemove,device='desktop'}){
  const [sectionId,setSectionId]=useState(activeId||sections[0]?.id||'');
  const [candidateIds,setCandidateIds]=useState([]);
  const [exploration,setExploration]=useState(15);
  const [fixedTypeId,setFixedTypeId]=useState('');
  const [search,setSearch]=useState('');
  const [cycle,setCycle]=useState(0);
  const [message,setMessage]=useState('');
  const current=sections.find(s=>s.id===sectionId)||sections[0];
  const ctx=normalizedContextV115({...context,device});
  useEffect(()=>{if(!open)return;setSectionId(activeId||sections[0]?.id||'');},[open,activeId]);
  useEffect(()=>{
    if(!open||!current)return;
    const p=current.personalizationV115;
    const fallback=[current.template?.id,...(types||[]).filter(t=>t.id!==current.template?.id&&slotCountV115(t,ctx.device)>0).slice(0,4).map(t=>t.id)].filter(Boolean);
    setCandidateIds(p?.candidateIds?.length?p.candidateIds:fallback);
    setExploration(p?.exploration??15);
    setFixedTypeId(p?.fixedTypeId||'');
    setCycle(0);setMessage('');
  },[open,current?.id,types.length]);
  useEffect(()=>{
    if(!open||typeof document==='undefined')return;
    const before=document.activeElement;
    const onKey=e=>{if(e.key==='Escape'){e.stopPropagation();onClose?.();}};
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);before?.focus?.();};
  },[open,onClose]);
  const eligible=useMemo(()=>{
    if(!current)return[];
    const minSlots=Math.max(1,...Object.keys(current.pins||{}).map(v=>Number(v)+1).filter(Number.isFinite));
    const unique=new Map(types.filter(t=>slotCountV115(t,ctx.device)>=minSlots).map(t=>[t.id,t]));
    if(current.template?.id&&!unique.has(current.template.id))unique.set(current.template.id,current.template);
    return [...unique.values()];
  },[current,types,ctx.device]);
  const decision=useMemo(()=>current?chooseTypeV115({types,candidateIds,section:current,context:ctx,history,
    exploration,fixedTypeId:fixedTypeId||null,seed:'recsy-demo-'+cycle}):null,
    [types,candidateIds,current,ctx,history,exploration,fixedTypeId,cycle]);
  const matched=eligible.filter(t=>!search.trim()||String(t.label||t.id).toLowerCase().includes(search.toLowerCase())).slice(0,36);
  const changeContext=patch=>onContext?.({...context,...patch});
  const toggleCandidate=id=>{
    setCandidateIds(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
    if(fixedTypeId===id)setFixedTypeId('');
  };
  const save=()=>{
    if(!current||!candidateIds.length){setMessage('Выберите хотя бы один тайп');return;}
    const valid=safeCandidatesV115(types,candidateIds,current,ctx);
    if(!valid.length){setMessage('Для этой секции нет подходящих тайпов');return;}
    onSave?.(current.id,{...PERSONALIZATION_DEFAULT_V115,enabled:true,candidateIds:valid.map(x=>x.id),
      exploration,fixedTypeId:fixedTypeId||null,seed:'merchtest-v115'});
    setMessage('Персонализация включена для секции');
  };
  const feedback=positive=>{
    if(!current||!decision?.selected)return;
    onHistory?.(recordFeedbackV115(history,decision.selected.id,current.id,ctx,positive));
    setCycle(n=>n+1);
    setMessage('Демо-сигнал сохранён локально; оценки пересчитаны');
  };
  if(!open||typeof document==='undefined')return null;
  return createPortal(<div className="recsy-backdrop-v115" onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.();}}>
    <aside className="recsy-panel-v115" role="dialog" aria-modal="true" aria-label="Персонализация геометрии витрины">
      <header className="recsy-head-v115"><div><span>REC SYS · ДЕМО</span><h2>Персонализация витрины</h2><p>Выбор геометрии секции по контексту, а не только товаров.</p></div><button type="button" aria-label="Закрыть" onClick={onClose}><X size={18}/></button></header>
      <div className="recsy-scroll-v115">
        <div className="recsy-note-v115"><strong>Симулятор contextual bandit</strong><span>Эвристический MVP: без реального ML, трекинга посетителей и доказанного влияния на продажи. Контекст задаётся вручную.</span></div>
        <section className="recsy-step-v115"><div className="recsy-step-head-v115"><span>01</span><div><strong>Секция и варианты</strong><small>Реальные тайпы редактора, включая импорт Figma</small></div></div>
          <label className="recsy-field-v115">Секция<select value={current?.id||''} onChange={e=>setSectionId(e.target.value)}>{sections.map(s=><option key={s.id} value={s.id}>{s.titles?.ru||s.template?.label||s.id}</option>)}</select></label>
          <div className="recsy-row-v115"><span>Кандидаты · {candidateIds.length} выбрано</span><label><input type="checkbox" checked={Boolean(fixedTypeId)} onChange={e=>setFixedTypeId(e.target.checked?(decision?.selected?.id||current?.template?.id||''):'')}/> Зафиксировать тайп</label></div>
          <input className="recsy-type-search-v115" placeholder="Поиск по библиотеке тайпов" aria-label="Поиск по тайпам" value={search} onChange={e=>setSearch(e.target.value)}/>
          <div className="recsy-type-list-v115">
            {matched.map(t=><label key={t.id} className={'recsy-type-v115'+(candidateIds.includes(t.id)?' active':'')}>
              <input type="checkbox" checked={candidateIds.includes(t.id)} onChange={()=>toggleCandidate(t.id)}/>
              <MiniType type={t} device={ctx.device}/>
              <span><strong>{t.label||t.id}</strong><small>{slotCountV115(t,ctx.device)} слотов · {t.figmaImportedV100?'Figma':'Библиотека'}</small></span>
              {fixedTypeId===t.id&&<Lock size={13}/>}
            </label>)}
            {!matched.length&&<small>Тайпы не найдены</small>}
          </div>
        </section>
        <section className="recsy-step-v115"><div className="recsy-step-head-v115"><span>02</span><div><strong>Контекст посещения</strong><small>Изменяйте сигналы — тайп может поменяться</small></div></div>
          <div className="recsy-two-v115">
            <label className="recsy-field-v115">Посетитель<select value={ctx.segment} onChange={e=>changeContext({segment:e.target.value})}><option value="new">Новый</option><option value="returning">Вернувшийся</option></select></label>
            <label className="recsy-field-v115">Контент<select value={ctx.content} onChange={e=>changeContext({content:e.target.value})}><option value="product">Товары</option><option value="look">Образы</option><option value="media">Видео / медиа</option></select></label>
          </div>
          <div className="recsy-slider-v115"><div><span>Время просмотра</span><b>{ctx.dwell} сек</b></div><input type="range" min="0" max="90" value={ctx.dwell} onChange={e=>changeContext({dwell:+e.target.value})}/></div>
          <div className="recsy-slider-v115"><div><span>Глубина скролла</span><b>{ctx.scroll}%</b></div><input type="range" min="0" max="100" value={ctx.scroll} onChange={e=>changeContext({scroll:+e.target.value})}/></div>
          <div className="recsy-two-v115">
            <label className="recsy-field-v115">Клики<select value={ctx.click} onChange={e=>changeContext({click:+e.target.value})}>{[0,1,2,3,5,10].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
            <label className="recsy-field-v115">Добавлено в избранное<select value={ctx.wishlist} onChange={e=>changeContext({wishlist:+e.target.value})}>{[0,1,2,3,5].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
          </div>
          <div className="recsy-slider-v115"><div><span>Exploration — новые геометрии</span><b>{exploration}%</b></div><input type="range" min="0" max="50" step="5" disabled={Boolean(fixedTypeId)} value={exploration} onChange={e=>setExploration(+e.target.value)}/><small>Остальные показы выбирают лучший вариант по текущим оценкам.</small></div>
        </section>
        <section className="recsy-step-v115"><div className="recsy-step-head-v115"><span>03</span><div><strong>Решение и объяснение</strong><small>Layout · Interaction · Content</small></div></div>
          {decision?.selected?<div className="recsy-result-v115">
            <div className="recsy-result-title-v115"><span>{decision.mode==='exploration'?'EXPLORATION':decision.mode==='exploitation'?'EXPLOITATION':decision.mode==='fixed'?'ЗАКРЕПЛЕНО':'FALLBACK'}</span><strong>{decision.selected.label}</strong></div>
            <MiniType type={decision.selected} device={ctx.device}/>
            <p>{decision.reason}. {decision.ranked.find(x=>x.type.id===decision.selected.id)?.reason.join(' · ')}.</p>
            <div className="recsy-layers-v115"><span><Layers3 size={13}/> Layout</span><span><MousePointerClick size={13}/> Interaction</span><span><ImageIcon size={13}/> Content</span></div>
            <div className="recsy-ranked-v115">{decision.ranked.slice(0,5).map(item=><div key={item.type.id}><span>{item.type.label}</span><meter min="0" max="1" value={item.score}/><strong>{percent(item.score)}</strong></div>)}</div>
          </div>:<div className="recsy-note-v115">Выберите допустимые тайпы секции.</div>}
          <div className="recsy-feedback-v115"><button type="button" onClick={()=>setCycle(x=>x+1)}><RotateCcw size={14}/> Следующий показ</button><button type="button" onClick={()=>feedback(true)}>Положительный сигнал</button><button type="button" onClick={()=>feedback(false)}>Без вовлечения</button></div>
          <small className="recsy-disclaimer-v115">Показатели — демонстрационные баллы, не вероятность покупки и не A/B-результаты. История сигналов не отправляется на сервер.</small>
        </section>
      </div>
      <footer className="recsy-foot-v115">
        <div>{message?<strong>{message}</strong>:<small>{current?.personalizationV115?.enabled?'Для секции уже настроена персонализация':'Исходный тайп сохраняется как fallback'}</small>}</div>
        {current?.personalizationV115?.enabled&&<button type="button" className="quiet" onClick={()=>{onRemove?.(current.id);setMessage('Правило выключено')}}>Отключить</button>}
        <button type="button" onClick={save} disabled={!current||!candidateIds.length} className="primary"><CheckCircle2 size={15}/> Применить к секции</button>
      </footer>
    </aside>
  </div>,document.body);
}
