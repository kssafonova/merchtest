import React from 'react';
import {AlertCircle,CheckCircle2,Info,ShoppingBag,CalendarClock,PackageCheck} from 'lucide-react';
import {MERCH_OBJECTIVES_V125,merchPolicyV125,auditMerchSectionV125} from './merch-lifecycle-v125.mjs';
import './merch-lifecycle-v125.css';
const icons={sales:ShoppingBag,teaser:CalendarClock,sell_through:PackageCheck};
export default function MerchLifecyclePolicyV125({section,region,onChange}){
  const policy=merchPolicyV125(section),audit=auditMerchSectionV125(section,region);
  return <div className="merch-lifecycle-v125" onClick={event=>event.stopPropagation()} aria-label="Коммерческая цель секции">
    <div className="merch-lifecycle-heading-v125">
      <div><strong>Коммерческая цель размещения</strong><span>Правила доступности зависят от задачи секции</span></div>
      <span className="merch-lifecycle-region-v125">{region}</span>
    </div>
    <div className="merch-lifecycle-objectives-v125" role="group" aria-label="Назначение секции">
      {MERCH_OBJECTIVES_V125.map(option=>{
        const Icon=icons[option.id];
        return <button type="button" key={option.id} className={policy.objective===option.id?'active':''} aria-pressed={policy.objective===option.id}
          title={option.hint} onClick={()=>onChange({objective:option.id,includeComingSoon:option.id==='teaser'})}>
          <Icon size={15}/><span>{option.label}</span>
        </button>;
      })}
    </div>
    <div className="merch-lifecycle-status-v125">
      <label className="merch-lifecycle-toggle-v125">
        <input type="checkbox" checked={policy.objective==='teaser'&&policy.includeComingSoon}
          disabled={policy.objective!=='teaser'} onChange={event=>onChange({includeComingSoon:event.target.checked})}/>
        <span>Допускать Coming Soon</span>
      </label>
      <span className="merch-lifecycle-audit-v125">
        <CheckCircle2 size={13}/> {audit.available} в продаже
        <span className="merch-lifecycle-dot-v125">·</span>{audit.comingSoon} Coming Soon
        {audit.commercialOos>0&&<span className="merch-lifecycle-risk-v125"><AlertCircle size={13}/>{audit.commercialOos} нежелательный OOS</span>}
      </span>
    </div>
    <p className="merch-lifecycle-help-v125"><Info size={13}/>
      {policy.objective==='teaser'?'Анонсы с нулевым остатком остаются в секции при явном статусе Coming Soon. Обычный OOS заменяется по цепочке.':
       policy.objective==='sell_through'?'Продвигаются товары, доступные к покупке. STR рассчитывается отдельно по продажам и запасам за период.':
       'Coming Soon не занимает продающие слоты: для них используется замена или стандартный fallback.'}
    </p>
    <small className="merch-lifecycle-demo-v125">Coming Soon в каталоге прототипа — тестовые статусы, не реальные данные магазина.</small>
  </div>;
}
