import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RUNTIME_HOTFIX_V12';

if (!app.includes(MARKER)) {
  const anchor = 'function TypePreview(';
  const anchorIndex = app.indexOf(anchor);
  if (anchorIndex < 0) throw new Error('TypePreview anchor not found');

  const helpers = `const RUNTIME_HOTFIX_V12 = true;\n\nfunction previewContainerStyle(container) {\n  if (!container) return {};\n  const style = {};\n  if (container.mode === 'boxed') { style.width = '88%'; style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.mode === 'inset' || container.mode === 'custom') { style.width = container.width || '75%'; }\n  if (container.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.align === 'right') { style.marginLeft = 'auto'; style.marginRight = 0; }\n  if (container.align === 'left') { style.marginLeft = 0; style.marginRight = 'auto'; }\n  return style;\n}\n\nfunction canvasContainerStyle(container) {\n  if (!container) return {};\n  const px = (value) => typeof value === 'number' && value !== 0 ? value + 'px' : value;\n  const style = {\n    width: container.width || '100%',\n    maxWidth: container.maxWidth ? container.maxWidth + 'px' : undefined,\n    paddingLeft: px(container.paddingLeft),\n    paddingRight: px(container.paddingRight),\n  };\n  if (container.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  else if (container.align === 'right') { style.marginLeft = container.marginLeft === 'auto' ? 'auto' : px(container.marginLeft); style.marginRight = px(container.marginRight); }\n  else { style.marginLeft = px(container.marginLeft); style.marginRight = container.marginRight === 'auto' ? 'auto' : px(container.marginRight); }\n  return style;\n}\n\n`;

  if (!app.includes('function previewContainerStyle(') || !app.includes('function canvasContainerStyle(')) {
    app = app.slice(0, anchorIndex) + helpers + app.slice(anchorIndex);
  } else {
    app = app.slice(0, anchorIndex) + `const ${MARKER} = true;\n\n` + app.slice(anchorIndex);
  }

  writeFileSync(appPath, app);
}

console.log('Runtime hotfix v12 applied');
