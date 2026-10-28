import React,{useMemo,useState} from 'react';
import {Plus,Layers3,GripVertical,LayoutGrid,ChevronDown,ChevronRight,MoreHorizontal,ArrowUp,ArrowDown,Copy,Trash2,Pin,Search,PackageOpen,CheckCircle2} from 'lucide-react';

const slotsFor=section=>Array.isArray(section?.resolvedSlots)?section.resolvedSlots:[];
const textOf=(section,locale)=>String(section?.titles?.[locale]||section?.titles?.ru||section?.template?.label||'Без названия');
const countPins=section=>slotsFor(section).filter(slot=>slot?.status==='pin').length;
const countAuto=section=>slotsFor(section).filter(slot=>slot?.status==='auto').length;
const counts=section=>{const slots=slotsFor(section);return {filled:slots.filter(slot=>Boolean(slot?.entity)).length,total:slots.length};};
const normalized=s=>String(s||'').toLocaleLowerCase('ru-RU').trim();
export function findLeftSectionsV124(sections,term='',filter='all',locale='ru'){
  const query=normalized(term);
  return (sections||[]).map((section,index)=>({section,index})).filter(({section})=>{
    const slotList=slotsFor(section);
    const filled=slotList.filter(x=>x?.entity).length;
    if(filter==='empty'&&filled===slotList.length&&slotList.length>0)return false;
    if(filter==='pinned'&&countPins(section)===0&&!Object.keys(section?.pins||{}).length)return false;
    if(!query)return true;
    const haystack=[textOf(section,locale),section?.id,section?.typeId,section?.template?.label,
      ...slotList.map(x=>x?.entity?.name||x?.entity?.sku||x?.entity?.id||'')].join(' ');
    return normalized(haystack).includes(query);
  });
}
export function LeftStructureV124({sections=[],selectedId,query='',locale='ru',onSelect,onAdd,onMove,onDuplicate,onDelete}){
  const [filter,setFilter]=useState('all');
  const [menuId,setMenuId]=useState(null);
  const matching=findLeftSectionsV124(sections,query,filter,locale);
  const pinnedCount=sections.filter(section=>countPins(section)||Object.keys(section?.pins||{}).length).length;
  const emptyCount=sections.filter(section=>{const c=counts(section);return c.filled<c.total;}).length;
  const select=(section,event)=>{setMenuId(null);onSelect?.(section.id,event);};
  const action=(fn)=>{fn?.();setMenuId(null);};
  return <div className="studio-left-tree-v124" aria-label="Структура текущей страницы">
    <div className="studio-left-summary-v124">
      <div><span>СЕКЦИИ СТРАНИЦЫ</span><strong>{sections.length}</strong></div>
      <small>Выбирайте, упорядочивайте и наполняйте блоки</small>
    </div>
    <div className="studio-left-quickfilters-v124" role="group" aria-label="Фильтр секций">
      {[['all','Все',sections.length],['empty','Незаполненные',emptyCount],['pinned','PIN',pinnedCount]].map(([id,label,n])=>
        <button type="button" key={id} className={filter===id?'active':''} aria-pressed={filter===id} onClick={()=>{setFilter(id);setMenuId(null);}}>{label}<span>{n}</span></button>)}
    </div>
    <div className="studio-left-list-head-v124">
      <span>{query||filter!=='all'?'Найдено '+matching.length:'Порядок на странице'}</span>
      <small>Выберите секцию для настройки</small>
    </div>
    <div className="studio-left-section-list-v124">
      {matching.map(({section,index})=>{
        const c=counts(section),isSelected=section.id===selectedId;
        const pin=countPins(section)||Object.keys(section?.pins||{}).length;
        const auto=countAuto(section);
        const display=textOf(section,locale);
        return <div key={section.id} className={'studio-left-row-v124'+(isSelected?' selected':'')}>
          <button type="button" className="studio-left-row-main-v124" title={'Перейти к секции '+display}
            aria-current={isSelected?'true':undefined} onClick={event=>select(section,event)}>
            <span className="studio-left-row-number-v124">{String(index+1).padStart(2,'0')}</span>
            <span className="studio-left-row-text-v124"><strong>{display}</strong>
              <small>{section.template?.label||section.typeId||'Макет'} · {c.filled}/{c.total} слотов</small></span>
            {c.filled===c.total&&c.total>0?<CheckCircle2 size={14} className="studio-left-row-good-v124"/>:
              <span className="studio-left-row-empty-v124" title={c.total-c.filled+' незаполненных слотов'}>{c.total-c.filled}</span>}
          </button>
          <div className="studio-left-row-detail-v124">
            <span>{pin>0&&<span className="studio-left-tag-v124"><Pin size={10}/> {pin} PIN</span>}
              {auto>0&&<span className="studio-left-tag-v124">{auto} AUTO</span>}</span>
            <div className="studio-left-row-tools-v124">
              <button type="button" aria-label={'Сдвинуть вверх: '+display} disabled={index===0} onClick={()=>action(()=>onMove?.(section.id,-1))}><ArrowUp size={13}/></button>
              <button type="button" aria-label={'Сдвинуть вниз: '+display} disabled={index>=sections.length-1} onClick={()=>action(()=>onMove?.(section.id,1))}><ArrowDown size={13}/></button>
              <button type="button" aria-label={'Другие действия: '+display} aria-expanded={menuId===section.id}
                onClick={()=>setMenuId(previous=>previous===section.id?null:section.id)}><MoreHorizontal size={15}/></button>
            </div>
          </div>
          {menuId===section.id&&<div className="studio-left-row-menu-v124" role="group" aria-label={'Действия с секцией '+display}>
            <button type="button" onClick={()=>action(()=>onDuplicate?.([section.id]))}><Copy size={13}/>Дублировать секцию</button>
            <button type="button" className="danger" onClick={()=>{if(window.confirm('Удалить секцию «'+display+'»?'))action(()=>onDelete?.([section.id]));}}><Trash2 size={13}/>Удалить секцию</button>
          </div>}
        </div>;
      })}
      {!matching.length&&<div className="studio-left-empty-v124"><Search size={20}/><strong>Нет подходящих секций</strong>
        <small>Очистите поиск или выберите другой фильтр.</small><button type="button" onClick={()=>setFilter('all')}>Все секции</button></div>}
    </div>
    <button type="button" className="studio-left-primary-v124" onClick={onAdd}><Plus size={16}/>Добавить секцию</button>
    <p className="studio-left-hint-v124">Shift — выбрать диапазон, Ctrl / Cmd — несколько секций.</p>
  </div>;
}
function typeSlots(type){return (type?.containers||[]).reduce((sum,c)=>sum+(c?.slots?.length||0),0);}
const prettyGroup=(group)=>group==='Figma'?'Из Figma':group||'Другие';
export function LeftTypesV124({types=[],query='',onAdd}){
  const [category,setCategory]=useState('all');
  const entries=types.map(type=>({...type,_group:type?.figmaImportedV100||type?.figmaOverlayV111||String(type?.id||'').startsWith('figma')?'Figma':String(type?.category||'Другие')}));
  const categories=['all',...new Set(entries.map(type=>type._group))];
  const matched=entries.filter(type=>(category==='all'||type._group===category)&&
    (!normalized(query)||normalized([type?.id,type?.label,type?.category,type?.description].join(' ')).includes(normalized(query))));
  return <div className="studio-left-library-v124">
    <div className="studio-left-summary-v124"><div><span>БИБЛИОТЕКА МАКЕТОВ</span><strong>{types.length}</strong></div>
      <small>Нажмите на тайп, чтобы добавить секцию в страницу</small></div>
    <label className="studio-left-category-v124">Категория<select value={category} onChange={e=>setCategory(e.target.value)}>
      {categories.map(group=><option value={group} key={group}>{group==='all'?'Все категории':prettyGroup(group)}</option>)}
    </select></label>
    <div className="studio-left-list-head-v124"><span>Доступные тайпы</span><small>{matched.length} найдено</small></div>
    <div className="studio-left-type-list-v124">
      {matched.map(type=><button type="button" className="studio-left-type-v124" key={type.id}
        draggable onDragStart={event=>{event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-lego-section-type',type.id);event.dataTransfer.setData('text/plain','');}}
        onClick={()=>onAdd?.(type)} aria-label={'Добавить '+(type.label||type.id)}>
        <span className="studio-left-type-icon-v124"><LayoutGrid size={17}/></span>
        <span><strong>{type.label||type.id}</strong><small>{prettyGroup(type._group)} · {typeSlots(type)} слотов</small></span>
        <Plus size={15}/>
      </button>)}
      {!matched.length&&<div className="studio-left-empty-v124"><PackageOpen size={20}/><strong>Тайпы не найдены</strong><small>Измените поисковый запрос или категорию.</small></div>}
    </div>
  </div>;
}
