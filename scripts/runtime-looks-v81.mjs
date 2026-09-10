import { readFileSync, writeFileSync } from 'node:fs';

const appPath='src/AppV3.jsx';
let app=readFileSync(appPath,'utf8');
const MARKER='RUNTIME_LOOKS_V81';

if(!app.includes(MARKER)){
  const anchor='const UX_AUDIT_FIXES_V80 = true;';
  if(!app.includes(anchor)) throw new Error(MARKER+': V80 marker missing');
  app=app.replace(anchor,anchor+'\nconst '+MARKER+' = true;');

  // Session-local editorial entities created in the prototype live in a dedicated store.
  const contentAnchor='const CONTENT = [...CATALOG_LOOKS, ...CATALOG_MEDIA];';
  if(!app.includes(contentAnchor)) throw new Error(MARKER+': CONTENT anchor missing');
  app=app.replace(contentAnchor,contentAnchor+'\nconst RUNTIME_LOOKS_V81 = [];');

  const stateAnchor='  const [newLookEntityV80,setNewLookEntityV80]=useState(null);';
  if(!app.includes(stateAnchor)) throw new Error(MARKER+': V80 look state missing');
  app=app.replace(stateAnchor,stateAnchor+'\n  const [runtimeLooksVersionV81,setRuntimeLooksVersionV81]=useState(0);');

  // Existing look filters must see session-created Looks as well as feed-backed Looks.
  app=app.replace(
    "const lookDepartmentOptions = useMemo(() => ['Все', ...Array.from(new Set(CATALOG_LOOKS.map((look) => look.department).filter(Boolean))).sort()], []);",
    "const lookDepartmentOptions = useMemo(() => ['Все', ...Array.from(new Set([...RUNTIME_LOOKS_V81, ...CATALOG_LOOKS].map((look) => look.department).filter(Boolean))).sort()], [runtimeLooksVersionV81]);"
  );
  app=app.replace(
    "const lookCollectionOptions = useMemo(() => ['Все', ...Array.from(new Set(CATALOG_LOOKS.flatMap((look) => String(look.collection || '').split('|')).filter(Boolean))).sort()], []);",
    "const lookCollectionOptions = useMemo(() => ['Все', ...Array.from(new Set([...RUNTIME_LOOKS_V81, ...CATALOG_LOOKS].flatMap((look) => String(look.collection || '').split('|')).filter(Boolean))).sort()], [runtimeLooksVersionV81]);"
  );

  app=app.replace(
    "if (contentTab === 'look') return CATALOG_LOOKS.filter((look) => {",
    "if (contentTab === 'look') return [...RUNTIME_LOOKS_V81, ...CATALOG_LOOKS].filter((look) => {"
  );

  // Recompute the memo when a runtime Look is created.
  app=app.replace(
    '[contentTab, query, productDepartment, productCategory, productCollection, productAvailability, lookDepartment, lookCollection, mediaKind, uploadedMedia, region]);',
    '[contentTab, query, productDepartment, productCategory, productCollection, productAvailability, lookDepartment, lookCollection, mediaKind, uploadedMedia, region, runtimeLooksVersionV81]);'
  );

  // V80 writes to CONTENT so Slot/getEntity works. Keep that and also update the runtime catalog + filter options.
  const createAnchor="CONTENT.unshift(entity); setCreateLookOpenV80(false);";
  if(!app.includes(createAnchor)) throw new Error(MARKER+': V80 create callback missing');
  app=app.replace(createAnchor,"RUNTIME_LOOKS_V81.unshift(entity); CONTENT.unshift(entity); setRuntimeLooksVersionV81((value)=>value+1); setCreateLookOpenV80(false);");

  writeFileSync(appPath,app);
}

console.log('V81 applied: newly created Looks persist in the session editorial library and facet options');
