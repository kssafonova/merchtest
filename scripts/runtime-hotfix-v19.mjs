import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/AppV3.jsx';
let app = readFileSync(appPath, 'utf8');
const MARKER = 'RUNTIME_HOTFIX_V19';

if (!app.includes(MARKER)) {
  const anchor = 'function TypePreview(';
  const at = app.indexOf(anchor);
  if (at < 0) throw new Error('RUNTIME_HOTFIX_V19: TypePreview anchor not found');

  let helpers = `const ${MARKER} = true;\n`;

  if (!app.includes('function previewContainerStyle(')) {
    helpers += `function previewContainerStyle(container) {\n  if (!container) return {};\n  const style = {};\n  if (container.mode === 'boxed') { style.width = '88%'; style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.mode === 'inset' || container.mode === 'custom') { style.width = container.width || '75%'; }\n  if (container.align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }\n  if (container.align === 'right') { style.marginLeft = 'auto'; style.marginRight = 0; }\n  if (container.align === 'left') { style.marginLeft = 0; style.marginRight = 'auto'; }\n  return style;\n}\n\n`;
  }

  if (!app.includes('function canvasContainerStyle(')) {
    helpers += `function canvasContainerStyle(container) {\n  if (!container) return {};\n  const px = (value) => typeof value === 'number' && value !== 0 ? value + 'px' : value;\n  const style = {\n    width: container.width || '100%',\n    maxWidth: container.maxWidth ? container.maxWidth + 'px' : undefined,\n    paddingLeft: px(container.paddingLeft),\n    paddingRight: px(container.paddingRight),\n  };\n  if (container.align === 'center') {\n    style.marginLeft = 'auto';\n    style.marginRight = 'auto';\n  } else if (container.align === 'right') {\n    style.marginLeft = container.marginLeft === 'auto' ? 'auto' : px(container.marginLeft);\n    style.marginRight = px(container.marginRight);\n  } else {\n    style.marginLeft = px(container.marginLeft);\n    style.marginRight = container.marginRight === 'auto' ? 'auto' : px(container.marginRight);\n  }\n  return style;\n}\n\n`;
  }

  app = app.slice(0, at) + helpers + app.slice(at);
  writeFileSync(appPath, app);
}

console.log('Runtime hotfix v19 applied');
