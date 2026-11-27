# Cinéma - Movies App

A small movie catalogue built with the Next.js App Router. Browse a local list of
films, search by title, and save favourites in the browser.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- React 19
- Plain CSS (global stylesheet + per-component CSS files)
- `localStorage` for favourites (no backend, no database)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Create a production build         |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint                        |

## Routes

| Route        | Description                                       |
| ------------ | ------------------------------------------------- |
| `/`          | Film list with title search                       |
| `/favorites` | Saved films, with a "remove all" action           |

Unknown routes render the French `not-found` page.

## Project structure

```text
public/assets/posters/     Film poster images
src/app/                   App Router files (layout, pages, not-found)
src/compenants/            UI components
  cardes/MovieCard.jsx     Film card (poster, title, favourite button)
  favorite/Favorite.jsx    Favourites page content
  home/                    Film list, search and local movie data
  navbar/                  Site navigation
src/context/               Favourites context (localStorage persistence)
```

> Note: the components directory is currently spelled `compenants`. Renaming it
> to `components` is a recommended cleanup, but it touches every import.

## How favourites work

`FavoritesProvider` (`src/context/FavoritesContext.jsx`) is a client component
mounted in the root layout. It reads and writes the `cinema:favorites` key in
`localStorage`, and stays in sync across tabs. Because storage is only available
in the browser, favourites are read after hydration; the server renders an empty
list.

## Assets

Posters live in `public/assets/posters`. The file names are referenced verbatim
by `src/compenants/home/Movie.js` (including existing typos such as
`instellar.jpg` and `pulp-iction.jpg`). `The Matrix` currently has no poster file
and renders a text fallback.

## Notes for contributors

- This project is JavaScript, not TypeScript.
- Run `npm run lint` and `npm run build` before opening a pull request.
- `next.config.mjs` enables Cache Components and Partial Prefetching. When those
  are enabled, recently visited routes stay mounted, so avoid duplicating element
  `id`s across pages.
- The app is intentionally frontend-only; do not add API keys or secrets.
