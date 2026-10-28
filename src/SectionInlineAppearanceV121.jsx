import React from 'react';
import {Palette,EyeOff,RotateCcw} from 'lucide-react';
import {sectionAppearanceV122} from './section-appearance-v122.mjs';

function ColorField({name,value,onChange}){
  return <label className="merch-appearance-control-v122 merch-appearance-color-v122">
    <span>{name}</span>
    <input type="color" value={value} aria-label={name} onChange={event=>onChange(event.target.value.toUpperCase())}/>
    <code>{value}</code>
  </label>;
}
function SpaceField({name,value,onChange}){
  return <label className="merch-appearance-control-v122 merch-appearance-space-v122">
    <span>{name}</span>
    <input type="number" value={value} min="0" max="240" step="8"
      aria-label={name+' в пикселях'} onChange={event=>onChange(Math.min(240,Math.max(0,Number(event.target.value)||0)))}/>
    <small>px</small>
  </label>;
}
export default function SectionInlineAppearanceV121({section,onChange}){
  const values=sectionAppearanceV122(section?.styleV57);
  const patch=changes=>onChange?.(changes);
  return <div className="inline-section-appearance-v121 merch-appearance-bar-v122"
    role="group" aria-label="Оформление секции" onClick={event=>event.stopPropagation()}>
    <span className="merch-appearance-caption-v122"><Palette size={15}/><strong>Оформление</strong></span>
    <div className="merch-appearance-controls-v122">
      <ColorField name="Фон" value={values.background} onChange={background=>patch({background})}/>
      <ColorField name="Текст" value={values.textColor} onChange={textColor=>patch({textColor})}/>
      <SpaceField name="Сверху" value={values.paddingTop} onChange={paddingTop=>patch({paddingTop})}/>
      <SpaceField name="Снизу" value={values.paddingBottom} onChange={paddingBottom=>patch({paddingBottom})}/>
      <label className="merch-appearance-hide-v122" title="Скрывать служебные значки в слотах, но не товары и изображения">
        <EyeOff size={15}/><span>Служебные элементы</span>
        <input type="checkbox" checked={values.hideElements} onChange={event=>patch({hideElements:event.target.checked})}/>
      </label>
      <button type="button" className="merch-appearance-reset-v122"
        title="Вернуть оформление по умолчанию"
        onClick={()=>patch({background:'#FFFFFF',textColor:'#111111',padding:0,paddingTop:0,paddingBottom:0,hideElements:false})}>
        <RotateCcw size={14}/><span>Сброс</span>
      </button>
    </div>
  </div>;
}
