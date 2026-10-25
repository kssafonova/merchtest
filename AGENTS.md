# Agent playbook — Figma to merchtest

Read `docs/figma-agent.md` before working on a Figma import or page layout.

## Goal
Turn Figma Design frames into editable React page sections in this repository, not screenshots or an unrelated HTML site. Keep the existing merchandising editor, auto-fill, drag-and-drop and independent three-pane scrolling working.

## Tools
- Figma MCP for high-fidelity source frame metadata, screenshot, variables and assets when the user provides a Figma file and has authorized access.
- Local `merchtest-figma` MCP tool `figma_to_merchtest` to export a private frame from its URL using a securely supplied `FIGMA_TOKEN`.
- `merchtest_editor_contract` for the native section schema.
- The in-app Figma importer to preview selected frames before adding them to a page.

## Workflow
1. Read the actual Figma frame first. Do not fabricate layer structure from a link. Respect private file permissions.
2. Inspect existing React components, styles and authored section schemas before adding new code.
3. Convert Auto Layout to native flex/grid, not flattened screenshots. Preserve text as text. Prefer existing components and theme tokens.
4. Persist images locally or in portable data payloads; do not commit short-lived Figma URLs or tokens.
5. Stage the result for review. Let the user choose append or replace; avoid deleting existing sections automatically.
6. Use source `src/figma-bridge.mjs` and `src/FigmaBridge.jsx` for generic layered imports. More complex designs may require dedicated React components, with explicit registration and editable fields.
7. Test desktop and narrow viewport behavior, focus states, text editing, images, layout, section reorder, Undo/Redo and persistence.
8. Run `npm run test:figma` and `npm run build` before publishing.

## Constraints
- GitHub Pages is static. Never embed a Figma access token in browser JavaScript, config committed to GitHub, or public client bundles.
- No promise of pixel-perfect responsive conversion for absolute-positioned Figma frames. Call out missing assets or unsupported node types.
- Keep the resulting page editable; do not replace real interactive components with screenshots.
