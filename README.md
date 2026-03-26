# Mario Typing Adventure

A kid-friendly typing game built with React 19 + Vite + TypeScript. Players can practice three-letter words in two fun modes:

- **Ladder Mode:** climb rungs by typing words correctly.
- **Car Dash:** race a car around the track with each correct word.

Both modes include cheerful audio cues, colorful word cards, and animated progress indicators to keep young learners engaged.

## Getting Started

Install dependencies once:

```bash
npm install
```

Available scripts:

- `npm run dev` – start Vite dev server with HMR.
- `npm run build` – type-check and build the production bundle to `dist`.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run the ESLint + TypeScript checks.

## Deployment (GitHub Pages)

The repo is configured to deploy automatically to GitHub Pages at\
`https://amarflybot.github.io/kid_typing_game/`.

1. Push or merge changes into the `main` branch.
2. GitHub Actions workflow `.github/workflows/deploy.yml` installs dependencies, runs `npm run build`, and uploads the `dist` folder as a Pages artifact.
3. The `Deploy to GitHub Pages` job publishes the site. You can monitor progress in the Actions tab.

If you need to redeploy manually, trigger the workflow via **Actions → Deploy to GitHub Pages → Run workflow**.
