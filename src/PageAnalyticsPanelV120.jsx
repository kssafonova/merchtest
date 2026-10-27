import React from 'react';
import {BarChart3,ChevronDown,ChevronRight,AlertTriangle,MousePointerClick,PackageX,Layers3,Pin,RefreshCcw,X,Info,Eye,ShoppingBag,Search} from 'lucide-react';
import {numberDisplayV120,VIEWABILITY_POLICY_V120} from './page-analytics-v120.mjs';
const fmt=(n)=>numberDisplayV120(n);
const pct=(n)=>numberDisplayV120(n,'%');
const money=(n)=>n==null?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
function Indicator({label,value,hint}){
  return <div className="merch-analytics-kpi-v120" title={hint||label}>
    <small>{label}</small><strong>{value}</strong>{hint&&<span>{hint}</span>}
  </div>;
}
function MiniKpi({label,value}){return <div className="merch-analytics-mini-v120"><span>{label}</span><strong>{value}</strong></div>;}
function Warnings({issues,onSelect}){
  if(!issues.length)return <div className="merch-analytics-quiet-v120">Критичных проблем заполнения не найдено. Проверьте результаты в режиме измерений.</div>;
  return <div className="merch-analytics-issues-v120">{issues.slice(0,12).map((issue,i)=><button type="button" key={i} onClick={()=>issue.sectionId&&onSelect(issue.sectionId)} className={'merch-analytics-issue-v120 '+issue.severity} aria-label={issue.title+': '+issue.detail}>
    <AlertTriangle size={15}/><span><strong>{issue.title}</strong><small>{issue.detail}</small><em>{issue.action}</em></span><ChevronRight size={13}/>
  </button>)}</div>;
}
function SectionInspector({record,slotIndex,onSlotSelect,mode}){
  const slot=slotIndex==null?null:record.slots.find(x=>x.index===slotIndex);
  const behavior=slot?.behavior||record.behavior;
  const title=slot?'Слот '+(slot.index+1):'Вся секция';
  const what=slot?.entity;
  return <section className="merch-analytics-detail-v120">
    <div className="merch-analytics-detail-head-v120"><div><span>РАЗБОР · {record.position.toString().padStart(2,'0')}</span><strong>{record.name}</strong><small>{record.typeId||'Геометрия секции'} · {record.actual.filled}/{record.actual.capacity} заполнено</small></div></div>
    <label className="merch-analytics-field-v120">Область анализа
      <select value={slotIndex==null?'section':String(slotIndex)} onChange={e=>onSlotSelect(e.target.value==='section'?null:Number(e.target.value))}>
        <option value="section">Вся секция</option>{record.slots.map((s)=><option key={s.index} value={s.index}>Слот {s.index+1} · {s.entity?.name||'Пустой'}</option>)}
      </select>
    </label>
    <div className="merch-analytics-detail-heading-v120">{title}{what&&<small>{what.name||what.id}</small>}</div>
    <div className="merch-analytics-metrics-v120">
      <MiniKpi label="Видимые показы" value={fmt(behavior.exposures)}/>
      <MiniKpi label="CTR от увидевших" value={pct(behavior.ctr)}/>
      <MiniKpi label="Клики по товарам" value={fmt(behavior.clicks)}/>
      <MiniKpi label="Добавления в корзину" value={fmt(behavior.carts)}/>
    </div>
    <div className="merch-analytics-facts-v120">
      <div><span>Режим заполнения</span><b>{slot?slot.pinned?'Ручной PIN':slot.status==='auto'?'Автоматически':slot.entity?'Вручную':'Не заполнен':record.actual.pinned+' PIN · '+record.actual.automated+' AUTO'}</b></div>
      <div><span>Остаток SKU</span><b>{slot?slot.stock==null?'—':slot.stock+' шт.':record.actual.oos+' без остатков'}</b></div>
      <div><span>Повторения внутри секции</span><b>{record.actual.duplicates}</b></div>
      <div><span>Заказы после клика*</span><b>{fmt(behavior.orders)}</b></div>
      <div><span>Выручка после клика*</span><b>{money(behavior.revenue)}</b></div>
    </div>
    {mode==='demo'&&<p className="merch-analytics-demo-caption-v120">* Условные заказы и выручка. Значения не являются реальными данными магазина, причинным эффектом или результатами A/B-теста.</p>}
    <div className="merch-analytics-slotrow-v120" role="group" aria-label="Слоты секции">{record.slots.map(s=><button key={s.index} type="button" onClick={()=>onSlotSelect(s.index)} className={s.index===slotIndex?'active':''} title={s.entity?.name||'Пустой слот'}>Слот {s.index+1}</button>)}</div>
  </section>;
}
export default function PageAnalyticsPanelV120({report,pageName,period,onPeriod,traffic,onTraffic,demo,onDemo,selectedId,selectedSlot,onSelect,onSlotSelect,onClose}){
  const selected=report.records.find(r=>r.id===selectedId)||report.records[0]||null;
  return <aside className="merch-analytics-inspector-v120" aria-label="Аналитика страницы">
    <div className="merch-analytics-inspector-head-v120">
      <div><span>MERCH ANALYTICS</span><strong>{pageName||'Текущая страница'}</strong><small>{report.region} · {report.device==='mobile'?'Mobile':report.device==='tablet'?'Tablet':'Desktop'}</small></div>
      <button type="button" onClick={onClose} aria-label="Вернуться к редактированию"><X size={18}/></button>
    </div>
    <div className="merch-analytics-scroll-v120">
      <div className="merch-analytics-filters-v120">
        <label>Период<select value={period} onChange={e=>onPeriod(Number(e.target.value))}><option value={7}>7 дней</option><option value={14}>14 дней</option><option value={30}>30 дней</option></select></label>
        <label>Источник<select value={traffic} onChange={e=>onTraffic(e.target.value)}><option value="all">Все</option><option value="organic">Поиск</option><option value="paid">Реклама</option><option value="direct">Прямой</option></select></label>
      </div>
      <div className="merch-analytics-source-v120">
        <span className={demo?'demo':'actual'}>{demo?'ДЕМО · СИМУЛЯЦИЯ':'ДАННЫЕ ВИТРИНЫ'}</span>
        <label><input type="checkbox" checked={demo} onChange={e=>onDemo(e.target.checked)}/> Демо-метрики</label>
      </div>
      <p className="merch-analytics-disclaimer-v120">{report.disclaimer}</p>
      <h3 className="merch-analytics-group-title-v120">Показатели страницы</h3>
      <div className="merch-analytics-kpis-v120">
        <Indicator label="Видимые показы" value={fmt(report.behavior.exposures)} hint="По секциям, не уникальные посетители"/>
        <Indicator label="CTR блока" value={pct(report.behavior.ctr)} hint="Клики / видимые показы"/>
        <Indicator label="В корзину" value={fmt(report.behavior.carts)}/>
        <Indicator label="Заказы*" value={fmt(report.behavior.orders)}/>
        <Indicator label="Выручка*" value={money(report.behavior.revenue)}/>
        <Indicator label="Нулевой остаток" value={fmt(report.totals.oos)} hint="Фактическое состояние размещённых SKU"/>
      </div>
      <h3 className="merch-analytics-group-title-v120">Качество наполнения <span>ФАКТ</span></h3>
      <div className="merch-analytics-quality-v120">
        <div><strong>{report.totals.filled}/{report.totals.slots}</strong><span>Слотов заполнено</span></div>
        <div><strong>{report.totals.uniqueSkus}</strong><span>Уникальных SKU</span></div>
        <div><strong>{report.totals.duplicatedSku}</strong><span>Повторяющихся SKU</span></div>
        <div><strong>{report.totals.pinned}</strong><span>Ручных PIN</span></div>
      </div>
      <h3 className="merch-analytics-group-title-v120">Секции <span>{report.records.length}</span></h3>
      <div className="merch-analytics-sections-v120">{report.records.map(record=><button type="button" key={record.id} className={selected?.id===record.id?'active':''} onClick={()=>{onSelect(record.id);onSlotSelect(null);}}>
        <span className="merch-analytics-section-pos-v120">{String(record.position).padStart(2,'0')}</span>
        <span><strong>{record.name}</strong><small>{record.actual.filled}/{record.actual.capacity} слотов · CTR {pct(record.behavior.ctr)} · охват {fmt(record.behavior.exposures)}</small></span>
        <ChevronRight size={15}/></button>)}</div>
      {selected&&<SectionInspector key={selected.id} record={selected} slotIndex={selectedSlot?.sectionId===selected.id?selectedSlot.slotIndex:null} onSlotSelect={slotIndex=>onSlotSelect(slotIndex==null?null:{sectionId:selected.id,slotIndex})} mode={report.mode}/>}
      <h3 className="merch-analytics-group-title-v120">Диагностика витрины</h3>
      <Warnings issues={report.issues} onSelect={onSelect}/>
      <details className="merch-analytics-method-v120"><summary>Как считаются показатели <ChevronDown size={14}/></summary>
        <p>Видимый показ: {VIEWABILITY_POLICY_V120}. Точное измерение требует событий с идентификаторами страницы, секции, слота и SKU.</p>
        <p>CTR = клики / видимые показы. Охват секции от посетителей страницы и инкрементальная выручка не вычисляются без дополнительного трекинга и эксперимента.</p>
        <p>Структура ассортимента рассчитана по текущим слотам. Данные показов не подключены к магазину. Демо-показатели синтетические и не суммируются как реальные бизнес-результаты.</p>
      </details>
    </div>
  </aside>;
}
export function AnalyticsSectionStripV120({record,onSelect}){
  if(!record)return null;
  return <div className="merch-analytics-section-strip-v120" onClick={e=>e.stopPropagation()}>
    <div><span>{String(record.position).padStart(2,'0')} · {record.name}</span><strong>{record.actual.filled}/{record.actual.capacity} слотов</strong></div>
    <div><span>Видели: {fmt(record.behavior.exposures)}</span><span>CTR: {pct(record.behavior.ctr)}</span><span>Корзина: {fmt(record.behavior.carts)}</span></div>
    <button type="button" onClick={()=>onSelect(record.id,null)} aria-label={'Детали секции '+record.name}><BarChart3 size={14}/></button>
  </div>;
}
export function AnalyticsSlotBadgeV120({record,slotIndex,onSelect}){
  const item=record?.slots?.find(s=>s.index===slotIndex);
  if(!item)return null;
  return <button type="button" className="merch-analytics-slot-badge-v120" onClick={e=>{e.stopPropagation();e.preventDefault();onSelect(record.id,slotIndex);}} aria-label={'Аналитика слота '+(slotIndex+1)}>
    <BarChart3 size={11}/><span>{item.behavior.ctr==null?'—':pct(item.behavior.ctr)}</span>
  </button>;
}
