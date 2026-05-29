# LIME Clickable Slot Builder Prototype

React/Vite prototype for the storefront slot builder and merchandising rules editor.

The uploaded prototype source is restored during build from compressed chunks in `scripts/app-source` by `scripts/restore-app.mjs`.

## What is inside

- React component: `ClickableSlotBuilderPrototype`
- Vite build with GitHub Pages base path `/testti/`
- `lucide-react` icons
- Tailwind runtime styling via CDN
- Source restore step before `npm run build`
- GitHub Actions workflow that builds `dist` and deploys it to Pages

## Local launch

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## GitHub Pages

GitHub Pages should use **GitHub Actions** as the source.

Expected public URL:

`https://micromaaash-dot.github.io/testti/`
