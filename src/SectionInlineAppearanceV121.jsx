import React from 'react';
import {Palette,ArrowUpFromLine,ArrowDownToLine,EyeOff,RotateCcw} from 'lucide-react';

export const normalHexV121=(hex,otherwise)=>/^#[0-9A-Fa-f]{6}$/.test(String(hex||''))?String(hex).toUpperCase():otherwise;
export const sectionPaddingV121=(style={},side='top')=>{
  const key=side==='bottom'?'paddingBottom':'paddingTop';
  const raw=style[key]??style.padding??0;
  return Math.max(0,Math.min(240,Number(raw)||0));
};
function ColorSetting({label,value,onChange}){
  return <label className="inline-section-color-v121"><span>{label}</span><span className="inline-section-color-value-v121">
    <input type="color" aria-label={label} value={value} onChange={event=>onChange(event.target.value.toUpperCase())}/>
    <code>{value}</code>
  </span></label>;
}
function PaddingSetting({label,icon:Icon,value,onChange}){
  return <label className="inline-section-padding-v121"><span><Icon size={13}/>{label}</span>
    <span className="inline-section-padding-entry-v121">
      <button type="button" disabled={value<=0} aria-label={'Уменьшить '+label.toLowerCase()} onClick={()=>onChange(Math.max(0,value-8))}>−</button>
      <input aria-label={label+' в пикселях'} type="number" inputMode="numeric" min="0" max="240" step="8" value={value} onChange={event=>onChange(Math.min(240,Math.max(0,Number(event.target.value)||0)))}/>
      <span>px</span>
      <button type="button" disabled={value>=240} aria-label={'Увеличить '+label.toLowerCase()} onClick={()=>onChange(Math.min(240,value+8))}>+</button>
    </span>
  </label>;
}
export default function SectionInlineAppearanceV121({section,onChange}){
  const style=section?.styleV57||{};
  const background=normalHexV121(style.background,'#FFFFFF');
  const textColor=normalHexV121(style.textColor,'#111111');
  const top=sectionPaddingV121(style,'top');
  const bottom=sectionPaddingV121(style,'bottom');
  const hidden=Boolean(style.hideElements);
  const patch=next=>onChange?.(next);
  return <div className="inline-section-appearance-v121" role="group" aria-label={'Оформление секции '+(section?.titles?.ru||'')}>
    <div className="inline-section-appearance-title-v121"><Palette size={15}/><strong>Оформление</strong></div>
    <div className="inline-section-appearance-fields-v121">
      <ColorSetting label="Фон" value={background} onChange={v=>patch({background:v})}/>
      <ColorSetting label="Текст" value={textColor} onChange={v=>patch({textColor:v})}/>
      <PaddingSetting label="Сверху" icon={ArrowUpFromLine} value={top} onChange={v=>patch({paddingTop:v})}/>
      <PaddingSetting label="Снизу" icon={ArrowDownToLine} value={bottom} onChange={v=>patch({paddingBottom:v})}/>
      <label className="inline-section-hide-v121"><span><EyeOff size={14}/> Скрыть элементы</span>
        <input type="checkbox" checked={hidden} onChange={event=>patch({hideElements:event.target.checked})}/>
      </label>
      <button type="button" className="inline-section-reset-v121" title="Вернуть оформление секции по умолчанию" onClick={()=>patch({background:'#FFFFFF',textColor:'#111111',padding:0,paddingTop:0,paddingBottom:0,hideElements:false})}><RotateCcw size={13}/><span>Сбросить</span></button>
    </div>
  </div>;
}
