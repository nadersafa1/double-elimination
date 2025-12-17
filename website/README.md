# double-elimination Website

Marketing and demo site for the [double-elimination](https://www.npmjs.com/package/double-elimination) npm package.

## Development

```bash
# From the root of double-elimination repo
npm run website:install  # First time setup
npm run website:dev      # Start dev server
```

Or from this directory:

```bash
npm install
npm run dev
```

## Build

```bash
# From the root of double-elimination repo
npm run website:build
```

Or from this directory:

```bash
npm run build
```

## Deployment

The website is automatically deployed to GitHub Pages when changes are pushed to the `main` branch in the `website/` folder.

The site will be available at: `https://nadersafa1.github.io/double-elimination/`

## Features

- Interactive bracket demo with configurable participants and tournament formats
- Syntax-highlighted code examples
- Responsive dark theme design
- Framer Motion animations

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- prism-react-renderer

