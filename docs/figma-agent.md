# Figma → merchtest: editable page agent (MVP)

This integration is for the **merchtest** React/Vite page editor. It is **not** a Webiny component and does not require the Webiny CMS. It follows the same workflow: read a Figma design, translate layers to editor-native UI, inspect, edit, and save.

## Option A — from Figma, no API token

1. In Figma desktop, open **Plugins → Development → Import plugin from manifest…**.
2. Point it at `figma-plugin/manifest.json` in a local clone of this repository. Figma may request that you create/assign a development plugin ID.
3. Select one or more **Frame** objects. Auto Layout frames produce the best responsive output.
4. Run **Merchtest — Export editable frames**, then press **Экспортировать JSON**. Save the JSON.
5. Open `https://kssafonova.github.io/merchtest/`; select **Из Figma** in the editor header or drag the JSON onto the center canvas.
6. Choose the frames, then **В конец страницы** or **Заменить секции**. Press **Импортировать**.
7. Imported layers render as DOM elements and text is editable by clicking a text node. You can reorder/duplicate/delete the imported section using editor tools. Undo is available.

Images are embedded into JSON as portable data URLs where Figma permits reading the image bytes. **Export files can contain confidential design data**, so do not commit them to a public repository.

## Option B — local agent, paste Figma URL

This path reads private Figma files through the official Figma REST API (scope `file_content:read`). Set a private local **FIGMA_TOKEN** environment variable; never put it in client-side code or your GitHub repository.

```bash
npm install --legacy-peer-deps
export FIGMA_TOKEN="your-figma-personal-access-token"
npm run figma:pull -- "https://www.figma.com/design/FILE_KEY/Name?node-id=123-456" --out figma-import.json
```

On Windows PowerShell: `$env:FIGMA_TOKEN="..." ` followed by the same `npm run figma:pull` command. The agent downloads frame JSON and image fills, embeds available images, converts the result into `merchtest-figma/v1`, and writes a portable JSON file. Drag this file into the editor.

Without `node-id` the agent imports the top-level frames of the file (up to the 40-frame safety limit).

## Option C — MCP workflow for an AI coding agent

The repo includes a local MCP server, `scripts/merchtest-figma-mcp.mjs`. Configure your MCP client to launch:

```json
{
  "mcpServers": {
    "merchtest-figma": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/merchtest/scripts/merchtest-figma-mcp.mjs"]
    }
  }
}
```

Provide `FIGMA_TOKEN` via the MCP process environment or a secure local environment manager, **not in this JSON committed to GitHub**. MCP tools:

- `figma_to_merchtest({url,output_name?})`: read a Figma Design file/frame, write `imports/*.json` locally and return frame count and path.
- `merchtest_editor_contract({})`: return the editable layer and section rules.

A coding agent can also use **Figma MCP** to read a frame's design context and use this project's schema to generate more specialized React components when needed; see `AGENTS.md`.

## How the editor translates Figma

| Figma | merchtest |
| --- | --- |
| Frame / Instance / Group | Nested DOM container |
| Auto Layout: horizontal / vertical | Flex row / column, with gap, padding and alignment |
| Free-positioned layers | Relatively scaled absolute positioning |
| Text | DOM text with editable content and typography |
| Solid fills / borders / corner radius | CSS background / border / radius |
| Image fills | Embedded image background (where exported) |
| One selected top-level frame | One editable merchtest section |

The imported sections live in the same `pageSections` state as the original merchandising editor, and import actions can be undone. Edited pages are saved to **this browser's localStorage**; they are not synchronized to GitHub or across devices.

### Limits and non-goals of this MVP

- Complex vector paths, masking, gradients, advanced Figma prototyping interactions, and precise variable/style token binding do **not** yet translate into semantic React components.
- Absolute-position layouts retain their desktop structure; they need responsive adjustments to achieve high fidelity on phones. Auto Layout is strongly recommended.
- Figma design files may have image fills that are too large to embed; skipped images remain blank.
- This pipeline creates editable page layers, not production-ready source files for an arbitrary design system. Reusable component generation with an approval workflow is a logical next phase.
- The deployed site **cannot retrieve a private Figma URL directly**: GitHub Pages has no secure server-side token storage. Use the plugin or local agent, or deploy an authenticated backend.
- Importing a JSON file is a deliberate review step. You cannot reliably drag raw layers cross-origin from the Figma browser tab into an arbitrary web app without an integration.
- Never import files from untrusted parties. The translator avoids executing imported source code, but any remote image URLs in arbitrary JSON should be reviewed.

## Testing

```bash
npm run test:figma
npm run build
```

Files: `src/figma-bridge.mjs` for normalization, `src/FigmaBridge.jsx` for the modal and rendering, `scripts/figma-pull.mjs` for REST download, `scripts/merchtest-figma-mcp.mjs` for the agent, `figma-plugin/` for export, and `scripts/figma-editor-bridge-v97.mjs` for integration.
