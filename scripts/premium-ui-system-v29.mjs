import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
const cssPath = 'src/appv3.css';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'PREMIUM_UI_SYSTEM_V29';

if (!app.includes(MARKER)) {
  const anchor = 'const PRODUCT_MEDIA_RATIOS_V24 = true;';
  if (!app.includes(anchor)) throw new Error('PREMIUM_UI_SYSTEM_V29: V24 marker missing');

  const helpers = String.raw`
const MERCH_SIGNAL_THRESHOLDS_V29 = {
  stock: { good: 20, warn: 8 },
  l7d: { good: 12, warn: 6 },
  coverage: { good: 95, warn: 80 },
  sizes: { good: 4, warn: 2 },
};

function merchTrafficLevelV29(type, value) {
  const number = Number(value || 0);
  if (type === 'conflicts') return number === 0 ? 'good' : 'bad';
  const threshold = MERCH_SIGNAL_THRESHOLDS_V29[type];
  if (!threshold) return 'neutral';
  if (number >= threshold.good) return 'good';
  if (number >= threshold.warn) return 'warn';
  return 'bad';
}

function merchTrafficLabelV29(level) {
  if (level === 'good') return 'Высокий';
  if (level === 'warn') return 'Средний';
  if (level === 'bad') return 'Низкий';
  return '';
}
`;

  app = app.replace(anchor, anchor + '\nconst ' + MARKER + ' = true;\n' + helpers);

  const oldRuntime = `function RuntimeStatusLine({ metrics, page = false }) {
  return <div className={'runtime-status-line ' + (page ? 'page' : 'section')}><span><b>Покрытие</b>{metrics.coverage}%</span><span><b>Резерв</b>{metrics.reserve}</span><span><b>📌 PIN</b>{metrics.pin}</span><span className={metrics.conflicts ? 'danger' : ''}><b>Конфликты SKU</b>{metrics.conflicts}</span></div>;
}`;
  const newRuntime = `function RuntimeStatusLine({ metrics, page = false }) {
  const coverageLevel = merchTrafficLevelV29('coverage', metrics.coverage);
  const conflictLevel = merchTrafficLevelV29('conflicts', metrics.conflicts);
  return <div className={'runtime-status-line ' + (page ? 'page' : 'section')}>
    <span className={'runtime-metric signal-' + coverageLevel}><i className="traffic-dot"/><b>Покрытие</b><strong>{metrics.coverage}%</strong></span>
    <span className="runtime-metric signal-neutral"><i className="traffic-dot"/><b>Резерв</b><strong>{metrics.reserve}</strong></span>
    <span className="runtime-metric signal-neutral"><i className="traffic-dot"/><b>📌 PIN</b><strong>{metrics.pin}</strong></span>
    <span className={'runtime-metric signal-' + conflictLevel}><i className="traffic-dot"/><b>Конфликты SKU</b><strong>{metrics.conflicts}</strong></span>
  </div>;
}`;
  if (!app.includes(oldRuntime)) throw new Error('PREMIUM_UI_SYSTEM_V29: RuntimeStatusLine not found');
  app = app.replace(oldRuntime, newRuntime);

  const oldProductSignal = `function ProductSignal({ type, value }) {
  const number = Number(value || 0);
  const level = type === 'stock' ? (number >= 10 ? 'good' : number >= 3 ? 'warn' : 'bad') : (number >= 50 ? 'good' : number >= 20 ? 'warn' : 'bad');
  return <span className={'product-signal ' + level} title={type === 'stock' ? 'Демо-пороги остатка; требуют финального подтверждения' : 'Демо-пороги L7D; требуют финального подтверждения'}><b>{type === 'stock' ? 'Остаток' : 'Продажи L7D'}</b><em>{number}</em></span>;
}`;
  const newProductSignal = `function ProductSignal({ type, value }) {
  const number = Number(value || 0);
  const level = merchTrafficLevelV29(type, number);
  return <span className={'product-signal premium-signal signal-' + level} title="Единые демонстрационные пороги прототипа">
    <i className="traffic-dot"/>
    <span><b>{type === 'stock' ? 'Остаток' : 'Продажи L7D'}</b><small>{merchTrafficLabelV29(level)}</small></span>
    <em>{number}</em>
  </span>;
}`;
  if (!app.includes(oldProductSignal)) throw new Error('PREMIUM_UI_SYSTEM_V29: ProductSignal not found');
  app = app.replace(oldProductSignal, newProductSignal);

  const oldStatusDot = `function StatusDot({ value, kind, withLabel = false }) {
  const status = productStatus(value, kind);
  return <span className={'master-status master-status-' + status.key}><i/>{withLabel && <em>{status.label}</em>}</span>;
}`;
  const newStatusDot = `function StatusDot({ value, kind, withLabel = false }) {
  const level = merchTrafficLevelV29(kind, value);
  return <span className={'master-status signal-' + level}><i className="traffic-dot"/>{withLabel && <em>{merchTrafficLabelV29(level)}</em>}</span>;
}`;
  if (!app.includes(oldStatusDot)) throw new Error('PREMIUM_UI_SYSTEM_V29: StatusDot not found');
  app = app.replace(oldStatusDot, newStatusDot);

  app = app.replace(`kind={{ value: availableSizes, type: 'stock' }}`, `kind={{ value: availableSizes, type: 'sizes' }}`);

  const stackStart = app.indexOf('<div className="reference-commerce-stack">');
  if (stackStart >= 0) {
    const productStart = app.indexOf('{isProduct && <>', stackStart);
    const productEnd = app.indexOf('</>}', productStart);
    if (productStart >= 0 && productEnd > productStart) {
      let chunk = app.slice(productStart, productEnd + 4);
      chunk = chunk.replace('className="metric l7d"', `className={'metric l7d signal-' + merchTrafficLevelV29('l7d', l7dValue)}`);
      chunk = chunk.replace('className="metric stock"', `className={'metric stock signal-' + merchTrafficLevelV29('stock', stockValue)}`);
      app = app.slice(0, productStart) + chunk + app.slice(productEnd + 4);
    }
  }

  writeFileSync(appPath, app);
}

let css = readFileSync(cssPath, 'utf8');
if (!css.includes('/* premium-ui-system-v29 */')) {
  css += String.raw`
/* premium-ui-system-v29 */
:root{
  --premium-bg:#f3f2ee;
  --premium-surface:#ffffff;
  --premium-soft:#f8f7f4;
  --premium-line:#e7e4de;
  --premium-line-strong:#d8d4cc;
  --premium-ink:#171714;
  --premium-muted:#77756f;
  --premium-good:#1f7a59;
  --premium-good-bg:#edf7f2;
  --premium-warn:#9a6813;
  --premium-warn-bg:#fbf4e5;
  --premium-bad:#a9473f;
  --premium-bad-bg:#fbefed;
  --premium-neutral:#626762;
  --premium-neutral-bg:#f1f2ef;
  --premium-radius:16px;
  --premium-shadow:0 8px 28px rgba(39,35,28,.055);
}

html,body,#root{background:var(--premium-bg)!important;color:var(--premium-ink)}
button,input,select,textarea{font-family:inherit}
button{transition:border-color .16s ease,background .16s ease,box-shadow .16s ease,transform .16s ease}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid rgba(23,23,20,.22)!important;outline-offset:2px}

/* Workspace: more breathing room and clearer hierarchy */
.builder-workspace{grid-template-columns:228px minmax(0,1fr) 500px!important;background:var(--premium-bg)!important}
.page-section-navigator{top:156px!important;height:calc(100vh - 156px)!important;background:rgba(250,249,246,.97)!important;border-right:1px solid var(--premium-line)!important;padding-bottom:18px}
.settings-panel,.wide-settings-panel{background:#fff!important;border-left:1px solid var(--premium-line)!important}
.page-merch-top-status{top:100px!important;min-height:56px!important;padding:9px 18px!important;background:rgba(255,255,255,.96)!important;border-bottom:1px solid var(--premium-line)!important;box-shadow:0 5px 20px rgba(34,31,25,.035)!important;backdrop-filter:blur(14px)}
.page-merch-top-status>button{height:38px!important;border:1px solid var(--premium-line-strong)!important;border-radius:12px!important;padding:0 12px!important;gap:8px!important;background:#fff!important;box-shadow:none!important}
.page-merch-top-status>button.active{background:var(--premium-ink)!important;color:#fff!important;border-color:var(--premium-ink)!important}
.page-merch-top-status>button strong{font-size:10px!important;letter-spacing:-.01em}.page-merch-top-status>button small{font-size:8px!important}

/* One status language everywhere */
.runtime-status-line{gap:7px!important;align-items:center!important}
.runtime-status-line>span.runtime-metric{min-height:36px!important;padding:7px 10px!important;border:1px solid transparent!important;border-radius:11px!important;display:grid!important;grid-template-columns:7px auto auto!important;align-items:center!important;column-gap:7px!important;background:var(--premium-neutral-bg)!important;color:var(--premium-ink)!important;box-shadow:none!important}
.runtime-status-line .traffic-dot,.product-signal .traffic-dot,.master-status .traffic-dot{display:block!important;width:7px!important;height:7px!important;border-radius:50%!important;background:currentColor!important;box-shadow:0 0 0 3px rgba(255,255,255,.7)}
.runtime-status-line>span b{font-size:8px!important;font-weight:700!important;color:var(--premium-muted)!important;white-space:nowrap}
.runtime-status-line>span strong{font-size:11px!important;font-weight:800!important;color:var(--premium-ink)!important;white-space:nowrap}
.signal-good{color:var(--premium-good)!important;background:var(--premium-good-bg)!important;border-color:rgba(31,122,89,.16)!important}
.signal-warn{color:var(--premium-warn)!important;background:var(--premium-warn-bg)!important;border-color:rgba(154,104,19,.18)!important}
.signal-bad{color:var(--premium-bad)!important;background:var(--premium-bad-bg)!important;border-color:rgba(169,71,63,.17)!important}
.signal-neutral{color:var(--premium-neutral)!important;background:var(--premium-neutral-bg)!important;border-color:rgba(98,103,98,.11)!important}
.runtime-status-line>span.signal-good b,.runtime-status-line>span.signal-warn b,.runtime-status-line>span.signal-bad b{color:currentColor!important;opacity:.74}

/* Larger premium rule blocks */
.unified-rule-block{border:1px solid var(--premium-line)!important;border-radius:17px!important;background:#fff!important;margin-bottom:14px!important;padding:18px!important;box-shadow:var(--premium-shadow)!important}
.unified-rule-title{grid-template-columns:34px 1fr auto!important;gap:11px!important;margin-bottom:15px!important}
.unified-rule-title>b{width:32px!important;height:32px!important;font-size:10px!important;background:var(--premium-ink)!important}
.unified-rule-title strong{font-size:13px!important;letter-spacing:-.015em}.unified-rule-title small{font-size:9px!important;line-height:1.35!important;color:var(--premium-muted)!important;margin-top:2px}
.unified-rule-title em{font-size:7.5px!important;padding:5px 8px!important;background:var(--premium-neutral-bg)!important;color:var(--premium-muted)!important}
.unified-rule-title em.override{background:var(--premium-warn-bg)!important;color:var(--premium-warn)!important}
.unified-condition-list{gap:8px!important;margin-top:11px!important}.unified-condition{grid-template-columns:26px minmax(112px,1.2fr) 100px minmax(105px,1fr) 32px!important;gap:7px!important}
.unified-condition select,.unified-condition input,.shared-sort-row select{height:40px!important;border:1px solid var(--premium-line-strong)!important;border-radius:10px!important;padding:0 10px!important;font-size:9px!important;background:#fff!important}
.unified-condition>button,.shared-sort-row button{width:32px!important;height:32px!important;border-radius:9px!important;background:var(--premium-soft)!important}
.unified-add-rule,.shared-sort-actions button{height:38px!important;border-radius:10px!important;font-size:9px!important;padding:0 11px!important;background:#fff!important;border-color:var(--premium-line-strong)!important}
.shared-sort-row{grid-template-columns:30px 1fr 34px!important;gap:8px!important}.shared-sort-row>b{width:28px!important;height:28px!important;font-size:9px!important;background:var(--premium-soft)!important}.shared-sort-actions span,.shared-sort-empty{font-size:8px!important;color:var(--premium-muted)!important}
.layout-mode-card,.inherit-page-toggle,.section-scenario-badge,.pin-priority-banner{border:1px solid var(--premium-line)!important;border-radius:14px!important;padding:13px!important;background:var(--premium-soft)!important}
.layout-mode-card strong,.inherit-page-toggle strong,.section-scenario-badge strong,.pin-priority-banner strong{font-size:10px!important}.layout-mode-card small,.inherit-page-toggle small,.section-scenario-badge small,.pin-priority-banner small{font-size:8px!important;line-height:1.4!important}
.page-radio-group.prominent,.color-mode-grid,.fallback-mode-grid{gap:9px!important;margin:10px 0!important}.page-radio-group.prominent label,.color-mode-grid label,.fallback-mode-grid label{border:1px solid var(--premium-line)!important;border-radius:13px!important;padding:12px!important;min-height:66px!important}.page-radio-group.prominent label.selected,.color-mode-grid label.selected,.fallback-mode-grid label.selected{border-color:#aaa59b!important;background:var(--premium-soft)!important;box-shadow:inset 0 0 0 1px rgba(23,23,20,.03)}
.page-radio-group.prominent strong,.color-mode-grid strong,.fallback-mode-grid strong{font-size:9px!important}.page-radio-group.prominent small,.color-mode-grid small,.fallback-mode-grid small{font-size:8px!important}.unified-helper{margin-top:10px!important;padding:10px 12px!important;border-left:0!important;border-radius:10px!important;background:var(--premium-soft)!important;color:var(--premium-muted)!important;font-size:8px!important}
.fallback-flow-v18{border-radius:13px!important;padding:12px!important;background:#24241f!important}.fallback-flow-v18 span{font-size:8px!important}.fallback-flow-v18 span b{width:22px!important;height:22px!important}

/* Section settings */
.settings-v18-head{padding:18px 18px 15px!important;border-bottom:1px solid var(--premium-line)!important}.settings-v18-head span{font-size:8px!important}.settings-v18-head strong{font-size:16px!important;letter-spacing:-.02em}.settings-v18-head small{font-size:9px!important}.settings-v18-head button{width:36px!important;height:36px!important;border-radius:11px!important;border-color:var(--premium-line)!important}
.pin-priority-banner,.inherit-page-toggle,.section-scenario-badge{margin-left:16px!important;margin-right:16px!important}.pin-priority-banner{margin-top:15px!important;background:#fbf6e9!important}.inherit-page-toggle{margin-top:10px!important}.section-scenario-badge{margin-top:10px!important;margin-bottom:14px!important;background:#fff!important}
.section-settings-v18>.unified-rule-block,.section-settings-v18>.explicit-zero-state,.section-settings-v18>.settings-v11-alert{margin-left:16px!important;margin-right:16px!important}
.explicit-zero-state,.settings-v11-alert{border-radius:13px!important;padding:12px!important;font-size:9px!important}

/* Page rules drawer */
.page-rules-slide-over{width:min(650px,52vw)!important;background:#fbfaf8!important;border-left:1px solid var(--premium-line)!important;box-shadow:-24px 0 70px rgba(28,25,20,.11)!important}
.page-slide-head{min-height:88px!important;padding:19px 20px!important;border-bottom:1px solid var(--premium-line)!important;background:#fff!important}.page-slide-head span{font-size:8px!important}.page-slide-head strong{font-size:22px!important;letter-spacing:-.025em}.page-slide-head small{font-size:9px!important}.page-slide-head>button{width:38px!important;height:38px!important;border-radius:11px!important;background:var(--premium-soft)!important}.page-slide-summary{padding:14px 18px!important;background:#fff!important;border-bottom:1px solid var(--premium-line)!important}.page-slide-summary>label strong{font-size:11px!important}.page-slide-summary>label small{font-size:9px!important}.page-slide-scroll{padding:16px 18px 36px!important}.page-slide-footer{min-height:68px!important;padding:12px 18px!important;background:#fff!important;border-top-color:var(--premium-line)!important}.page-slide-footer span{font-size:9px!important}.page-slide-footer button{height:40px!important;border-radius:11px!important;padding:0 22px!important;font-size:10px!important;background:var(--premium-ink)!important}

/* Left navigator */
.section-nav-head{padding:17px 15px!important;border-bottom-color:var(--premium-line)!important}.section-nav-head span{font-size:8px!important}.section-nav-head strong{font-size:15px!important;letter-spacing:-.02em}.section-nav-head small{font-size:9px!important}.page-section-navigator>.runtime-status-line{padding:12px 10px!important;border-bottom-color:var(--premium-line)!important;gap:5px!important}.page-section-navigator>.runtime-status-line>span{min-height:31px!important;padding:5px 7px!important;grid-template-columns:6px auto!important}.page-section-navigator>.runtime-status-line>span b{display:none!important}.page-section-navigator>.runtime-status-line>span strong{font-size:9px!important}.section-nav-list{padding:10px!important}.section-nav-list>button{border-radius:13px!important;padding:11px 10px!important;margin-bottom:6px!important;border:1px solid transparent!important}.section-nav-list>button:hover{background:#f4f3ef!important}.section-nav-list>button.active{border-color:var(--premium-line-strong)!important;background:#fff!important;box-shadow:0 5px 18px rgba(37,33,27,.045)!important}.section-nav-list>button>b{width:24px!important;height:24px!important;font-size:8px!important;background:#eceae5!important}.section-nav-list strong{font-size:10px!important}.section-nav-list small{font-size:8px!important;margin-top:2px}.section-nav-list em{font-size:6.5px!important;padding:4px 6px!important}.section-nav-list>button>i{font-size:8px!important}

/* Canvas sections and contextual add */
.builder-section{border-radius:18px!important;background:#fff!important;box-shadow:0 5px 24px rgba(34,31,25,.045)!important;border-color:var(--premium-line)!important;overflow:hidden!important}
.builder-section .runtime-status-line.section{padding:10px 12px!important;background:#fbfaf8!important;border-color:var(--premium-line)!important;gap:6px!important}.builder-section .runtime-status-line.section>span{min-height:32px!important;padding:6px 8px!important}
.section-insert-point{margin:13px 22px!important}.section-insert-point:before{top:20px!important;border-color:#d3d0c8!important}.section-insert-trigger{height:40px!important;border:1px solid var(--premium-line-strong)!important;border-radius:999px!important;padding:0 15px!important;font-size:9px!important;background:#fff!important;box-shadow:0 4px 16px rgba(34,31,25,.06)!important}.section-insert-trigger:hover,.section-insert-point.open .section-insert-trigger{border-color:#8f8a80!important;color:var(--premium-ink)!important;background:var(--premium-soft)!important}.section-inline-layout-library{margin-top:10px!important;border:1px solid var(--premium-line)!important;border-radius:18px!important;box-shadow:0 18px 46px rgba(34,31,25,.09)!important}.section-inline-layout-head{min-height:72px!important;padding:14px 16px!important;background:#fbfaf8!important;border-color:var(--premium-line)!important}.section-inline-layout-head span{font-size:8px!important}.section-inline-layout-head strong{font-size:13px!important}.section-inline-layout-head small{font-size:9px!important}.section-inline-layout-grid{gap:11px!important;padding:13px!important}.section-inline-layout-card{border:1px solid var(--premium-line)!important;border-radius:13px!important;padding:8px!important;background:#fff!important}.section-inline-layout-card:hover{border-color:#aaa59b!important;background:#fbfaf8!important;box-shadow:0 5px 16px rgba(34,31,25,.045)!important}.section-inline-layout-preview{height:84px!important;border-radius:9px!important}.section-inline-layout-card strong{font-size:8.5px!important}.section-inline-layout-card small{font-size:7.5px!important}

/* Library cards: calmer, larger, no arcade colors */
.reference-library-grid{gap:14px!important;padding:2px!important}.wide-settings-panel .reference-merch-card{min-height:382px!important;border:1px solid var(--premium-line)!important;border-radius:16px!important;background:#f5f4f1!important;box-shadow:0 5px 20px rgba(34,31,25,.045)!important}.wide-settings-panel .reference-merch-card:hover{border-color:#b6b1a8!important;box-shadow:0 10px 30px rgba(34,31,25,.075)!important;transform:translateY(-1px)!important}.reference-card-body{bottom:39px!important;background:#f5f4f1!important}.reference-card-body .merch-card-media{background:#f5f4f1!important}.reference-card-body .merch-card-media img,.reference-card-body .merch-card-media video{object-fit:contain!important}.reference-card-id{right:9px!important;bottom:142px!important;padding:5px 7px!important;border-radius:7px!important;background:rgba(24,24,21,.84)!important;font-size:7.5px!important}.reference-commerce-stack{right:9px!important;bottom:48px!important;gap:4px!important;min-width:104px!important}.reference-commerce-stack .metric{height:27px!important;padding:0 8px!important;border:1px solid var(--premium-line)!important;border-radius:8px!important;background:rgba(255,255,255,.94)!important;color:var(--premium-ink)!important;backdrop-filter:blur(8px)}.reference-commerce-stack .metric:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--premium-neutral);margin-right:2px}.reference-commerce-stack .metric b{font-size:7px!important;color:var(--premium-muted)!important}.reference-commerce-stack .metric em{font-size:10px!important;color:var(--premium-ink)!important}.reference-commerce-stack .metric.signal-good:before{background:var(--premium-good)}.reference-commerce-stack .metric.signal-warn:before{background:var(--premium-warn)}.reference-commerce-stack .metric.signal-bad:before{background:var(--premium-bad)}.reference-commerce-stack .l7d,.reference-commerce-stack .stock,.reference-commerce-stack .looks{background:rgba(255,255,255,.94)!important;color:var(--premium-ink)!important}.reference-card-footer{height:39px!important;padding:0 11px!important;background:rgba(255,255,255,.9)!important;border-color:var(--premium-line)!important}.reference-card-footer span{font-size:9px!important;color:var(--premium-muted)!important}.reference-card-body .entity-details-trigger{top:10px!important;right:10px!important;width:31px!important;height:31px!important;border-radius:10px!important;background:rgba(24,24,21,.9)!important}.reference-merch-card.clickable:after{top:10px!important;right:47px!important;width:31px!important;height:31px!important;border-radius:10px!important;background:rgba(24,24,21,.9)!important}

/* Product signals and master-data */
.product-signal.premium-signal{min-width:158px!important;min-height:58px!important;border:1px solid transparent!important;border-radius:14px!important;padding:10px 12px!important;display:grid!important;grid-template-columns:8px 1fr auto!important;gap:9px!important;align-items:center!important}.product-signal.premium-signal>span{display:grid!important;gap:2px!important}.product-signal.premium-signal b{font-size:8px!important;color:currentColor!important}.product-signal.premium-signal small{font-size:7.5px!important;color:currentColor!important;opacity:.72}.product-signal.premium-signal em{font-size:21px!important;color:var(--premium-ink)!important}.editor-status-signals{gap:9px!important;margin-bottom:13px!important}
.master-status{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:4px 7px!important;border-radius:999px!important;border:1px solid transparent!important;background:var(--premium-neutral-bg)!important}.master-status i.traffic-dot{width:7px!important;height:7px!important}.master-status em{font-size:8px!important;font-style:normal!important;font-weight:700!important;color:currentColor!important}
.product-master-backdrop{background:rgba(24,23,20,.38)!important;backdrop-filter:blur(8px)!important}.product-master-modal{width:min(1500px,97vw)!important;height:min(1040px,96vh)!important;border-radius:24px!important;box-shadow:0 32px 100px rgba(24,22,18,.24)!important}.product-master-head{min-height:106px!important;padding:20px 28px!important;border-color:var(--premium-line)!important}.product-master-head>div:first-child>span{font-size:9px!important;color:var(--premium-muted)!important}.product-master-head>div:first-child>strong{font-size:30px!important}.product-master-head>div:first-child>small{font-size:10px!important;color:var(--premium-muted)!important}.product-master-close{width:42px!important;height:42px!important;border-radius:12px!important}.product-master-scroll{background:#faf9f6!important}.product-master-overview{gap:24px!important;padding:24px 28px!important}.master-identity-grid{gap:12px!important}.master-kpi-grid{gap:12px!important}.master-kpi{min-height:126px!important;padding:17px!important;border:1px solid var(--premium-line)!important;border-radius:17px!important;background:#fff!important;box-shadow:0 5px 18px rgba(34,31,25,.035)!important}.master-kpi-label>span{font-size:9px!important;color:var(--premium-muted)!important}.master-kpi>strong{font-size:27px!important;line-height:1.05!important;letter-spacing:-.025em!important}.master-kpi>small{font-size:9px!important;color:var(--premium-muted)!important}.master-kpi-hint{font-size:8px!important}.master-attribute{padding:13px 14px!important;border-radius:12px!important;background:var(--premium-soft)!important;border:1px solid transparent!important}.master-attribute>div span{font-size:8px!important;color:var(--premium-muted)!important}.master-attribute>strong{font-size:11px!important}.master-attribute>div em{font-size:7px!important}.master-attributes-card,.master-size-card{border:1px solid var(--premium-line)!important;border-radius:18px!important;background:#fff!important;box-shadow:0 5px 18px rgba(34,31,25,.035)!important}.master-section-title,.master-size-head{padding:17px 18px!important;border-color:var(--premium-line)!important}.master-section-title strong,.master-size-head strong{font-size:14px!important}.master-section-title span,.master-size-head small{font-size:9px!important;color:var(--premium-muted)!important}.master-attributes-grid{gap:9px!important;padding:14px 16px 18px!important}.master-size-table th{font-size:8px!important;color:var(--premium-muted)!important;letter-spacing:.03em!important}.master-size-table td{font-size:10px!important}.master-size-table tbody tr:hover{background:#faf9f6!important}.master-legend{gap:11px!important}.master-legend span{font-size:8px!important}.master-legend i.high{background:var(--premium-good)!important}.master-legend i.medium{background:var(--premium-warn)!important}.master-legend i.low{background:var(--premium-bad)!important}.master-bottom-grid{gap:12px!important}.master-bottom-grid>div{border:1px solid var(--premium-line)!important;border-radius:16px!important;background:#fff!important;padding:17px!important}.master-bottom-grid strong{font-size:11px!important}.master-bottom-grid span{font-size:9px!important;color:var(--premium-muted)!important}.product-master-footer{min-height:72px!important;padding:12px 24px!important;border-color:var(--premium-line)!important}.product-master-footer span{font-size:9px!important}.product-master-footer button{height:42px!important;border-radius:11px!important;padding:0 22px!important;font-size:10px!important}

@media(max-width:1320px){.builder-workspace{grid-template-columns:205px minmax(0,1fr) 450px!important}.reference-library-grid{grid-template-columns:1fr!important}.wide-settings-panel .reference-merch-card{min-height:430px!important}}
@media(max-width:1050px){.builder-workspace{grid-template-columns:185px minmax(0,1fr) 405px!important}.page-rules-slide-over{width:min(610px,64vw)!important}}
@media(max-width:900px){.builder-workspace{grid-template-columns:1fr!important}.page-rules-slide-over{width:min(100vw,610px)!important}.page-merch-top-status{padding-inline:12px!important}.product-master-overview{padding:18px!important}}
`;
  writeFileSync(cssPath, css);
}

console.log('Premium UI system v29 applied: larger blocks, calmer surfaces, unified traffic lights');
