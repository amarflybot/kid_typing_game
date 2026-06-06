# Abhimanyu Typing Adventure

A kid-friendly learning app built with React 19, Vite, and TypeScript. It combines typing practice, word-building, racing, Upper KG math, and Hindi letter activities in one browser-based experience.

## Features

- **Ladder Mode:** type three-letter words correctly to help the character climb the ladder, earn coins, advance levels, and manage hearts.
- **Car Dash:** type car-themed words to move the race car, build boosts, gain fans, and complete laps.
- **Learning Lab:** build words from letter tiles, undo mistakes, shuffle tiles, skip to a new word, and match word cards from clues.
- **Math Quest:** practice Upper KG math with a randomized 50-question session drawn from a larger question bank.
- **Math Question Types:** counting, addition, subtraction, bigger-number comparison, missing numbers, ten frames, patterns, shape recognition, measurement comparison, and position/order questions.
- **Hindi Practice:** match Hindi letters, sounds, words, and pictures with tap-friendly choices and auto-advance after each answer.
- **Persistent Progress:** scores and counters are saved in `localStorage`, so browser refreshes do not clear progress.
- **Reset Progress:** the main app header includes a reset button to clear saved progress across the whole app.
- **Kid-Focused UI:** includes Abhimanyu’s photo, colorful cards, large tap targets, feedback messages, animations, and simple audio cues.

## Getting Started

Install dependencies once:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` - start the Vite dev server with HMR.
- `npm run build` - build the production bundle to `dist`.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint checks.
- `npm test` - run the Vitest test suite.
- `npm run test:watch` - run Vitest in watch mode.

## Progress Storage

The app stores progress in browser `localStorage` under the `kid-game:*` keys. Stored progress includes:

- selected app tab
- ladder coins and level
- car lap, boost, and fans
- learning lab stars
- math stars, streak, and answered count
- Hindi stars, streak, and answered count

Use **Reset Progress** in the app header to clear all saved progress.

## Deployment (GitHub Pages)

The repo is configured to deploy automatically to GitHub Pages at:

`https://amarflybot.github.io/kid_typing_game/`

1. Push or merge changes into the `main` branch.
2. GitHub Actions workflow `.github/workflows/deploy.yml` installs dependencies, runs `npm run build`, and uploads the `dist` folder as a Pages artifact.
3. The `Deploy to GitHub Pages` job publishes the site. Monitor progress in the Actions tab.

To redeploy manually, trigger **Actions -> Deploy to GitHub Pages -> Run workflow**.
