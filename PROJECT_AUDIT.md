# Project Audit — Movies_App (Cinéma)

- **Repository:** https://github.com/ilyass-cmd/Movies_App
- **Audited commit:** `38dc23b` ("Project Movies") on `main`
- **Audit date:** 2026-11-16
- **Environment:** Windows 11, Node.js 24.17.0, npm 11.13.0, Next.js 16.4.3
- **Scope:** clone, inspection, build/lint/runtime audit, fixes, verification. No commits, no push, no remote changes.

---

## 1. Project Overview

### Technologies

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router, Turbopack) |
| UI runtime | React 19.3.0 / React DOM 19.3.0 |
| Language | JavaScript (JSX), no TypeScript |
| Styling | Plain CSS: `globals.css` + per-component `.css` files, one CSS Module (`not-found.module.css`) |
| State | React Context + `useSyncExternalStore`, persisted in `localStorage` |
| Images | Local files under `public/assets/posters`, served through `next/image` |
| Linting | ESLint 9 + `eslint-config-next` (core-web-vitals) |
| Tests | None (no test runner, no test script) |
| CI | None |
| Backend | None — fully client-side, static data, no API keys |

`next.config.mjs` enables two current Next.js 16 features, both valid per the bundled docs:

```js
cacheComponents: true,
partialPrefetching: true,
experimental: { agentFeedback: true },
```

Cache Components implies Partial Prerendering and keeps recently visited routes mounted with React `<Activity>`. That behaviour matters for this app (see issue F11).

### Architecture

The app uses the App Router with a single root layout that mounts a client-side favourites provider and the navigation bar:

```
src/app/
  layout.js              Server component: metadata, FavoritesProvider, Navbar, skip link
  page.js                / route → Home
  favorites/page.js      /favorites route → Favorites
  not-found.js           French 404 page
  robots.js              /robots.txt
  globals.css            Global tokens, reset, skip link, sr-only utility
src/context/
  FavoritesContext.jsx   Client provider (localStorage, cross-tab sync)
src/compenants/
  cardes/MovieCard.jsx   Film card (poster, year, favourite toggle)
  home/Home.jsx          Film list + client-side title search
  home/Movie.js          Static film data (5 films)
  favorite/Favorite.jsx  Favourites list, empty state, clear-all
  navbar/Navbar.jsx      Navigation with active route + favourites count
public/assets/posters/   Four poster JPEGs
```

### Existing features

- Film grid (5 films) with poster, title and release year.
- Case-insensitive title search with live result count and empty-result message.
- Add/remove favourites from a card (heart button, `aria-pressed`).
- Favourites page with count, grid, empty state and “Tout supprimer”.
- Favourites counter in the navbar, persisted in `localStorage`, synced across tabs.
- Responsive CSS grids, keyboard focus styles, skip link, `lang="fr"`.
- Custom 404 page, page metadata, per-page titles.
- Static prerendering of `/` and `/favorites`.

### Current application status

**The project did not build when cloned.** The last commit (`38dc23b`) was an incomplete migration from a Vite/React-Router prototype to the Next.js App Router: it renamed the only page (`src/app/page.js` → `src/app/test.js`), so the root route disappeared, and it added components that import a favourites context which did not exist. `next build` failed with `Module not found: Can't resolve '@/context/FavoritesContext'`, and ESLint reported 5 errors.

After the fixes in this audit:

| Check | Result |
| --- | --- |
| `npm install` | 339 packages installed |
| `npm run lint` | **0 errors, 1 warning** (exit 0) — warning is in unused prototype code |
| `npm run build` | **Success** (exit 0 on retry; see note below) |
| `npm run start` | Pages served: `/` 200, `/favorites` 200, unknown route 404, `/robots.txt` 200, `/_next/image` 200 |
| `npm run dev` | Starts and serves `/` and `/favorites` (200) with no compile errors |
| Browser runtime | No console errors; add/persist/remove favourites, clear-all, search, client navigation all work |
| Lighthouse (production) | `/` and `/favorites`: **Accessibility 1.00, Best Practices 1.00, SEO 1.00**, no failures |

> **Build caveat (not a code defect):** Next.js 16.4.3 is flagged by npm for a security advisory. On this version, `next build` and `next dev` may stop once with `SecurityFatalError` and an upgrade recommendation; re-running the same command completes successfully. This behaviour was reproduced repeatedly and is caused by the advisory check, not by the project code. Upgrading to Next.js 16.4.6 (the patched release reported by `npm audit`) removes it — see Priority 1.

---

## 2. Problems Found & Fixed

### F1 — Root route `/` did not exist

- **Location:** `src/app/` (no `page.js`)
- **Problem:** The previous commit renamed `src/app/page.js` to `src/app/test.js`, so the App Router had no page for `/`. Every visit to the site root returned 404.
- **Why it mattered:** The application was unreachable.
- **Change:** Added `src/app/page.js` rendering `<Home />` with a page title.
- **Verification:** Build lists `/` as a static route; `GET /` returned 200 with the film grid.

### F2 — Favourites route did not exist

- **Location:** `src/app/favorites/`
- **Problem:** The navbar linked to `/favorites`, but no folder/page existed. The only “favorites page” file was `src/compenants/home/Page.jsx`, which is not a route and imports a missing `./Favorites`.
- **Change:** Added `src/app/favorites/page.js` (server component with metadata) rendering the existing `Favorites` component.
- **Verification:** `/favorites` returns 200 and renders the empty state / saved films.

### F3 — Build failed: missing favourites context

- **Location:** `src/app/layout.js`, `src/compenants/navbar/Navbar.jsx`, `src/compenants/cardes/MovieCard.jsx`, `src/compenants/favorite/Favorite.jsx`
- **Problem:** All four files imported `.../context/FavoritesContext`, which did not exist. `next build` failed at the first import.
- **Change:** Created `src/context/FavoritesContext.jsx` with a client provider exposing `favorites`, `isFavorite`, `toggleFavorite`, `clearFavorites`.
- **Verification:** `next build` compiles; favourites work end-to-end (see F8).

### F4 — `layout.js` used `<Navbar />` without importing it

- **Location:** `src/app/layout.js`
- **Problem:** ESLint: `'Navbar' is not defined`; at runtime the layout would throw.
- **Change:** Imported `Navbar` from `@/compenants/navbar/Navbar`.
- **Verification:** ESLint error gone; navbar renders on every route.

### F5 — Navbar used React Router in a Next.js app

- **Location:** `src/compenants/navbar/Navbar.jsx`
- **Problem:** `import { Link, NavLink } from "react-router-dom"` — the package is not a dependency, and `to=`/`NavLink` active classes do not exist in Next.js. This was a leftover from the Vite prototype.
- **Why it mattered:** Broken navigation and a missing-module build error if the component were reachable.
- **Change:** Rewrote with `next/link` and `usePathname()`, adding `aria-current="page"` and keeping the existing `.active` styling.
- **Verification:** Client-side navigation `/ → /favorites → /` works; the active link is highlighted; Lighthouse SEO/a11y pass.

### F6 — Components used hooks without `"use client"`

- **Location:** `src/compenants/navbar/Navbar.jsx`, `cardes/MovieCard.jsx`, `home/Home.jsx`, `favorite/Favorite.jsx`
- **Problem:** These files use `useState`/context/`usePathname` but had no client directive. Under the App Router they are Server Components by default and would fail at build/runtime.
- **Change:** Added `"use client"` to each interactive component. `layout.js` and the route pages stay Server Components, as recommended by the Next.js docs.
- **Verification:** Build succeeds; interactivity works (search, favourite toggle, clear-all).

### F7 — Two competing `MovieCard` implementations, both broken in different ways

- **Location:** `src/compenants/home/Home.jsx`, `src/compenants/favorite/Favorite.jsx`, `src/compenants/MovieCard/MovieCard.jsx`, `src/compenants/cardes/MovieCard.jsx`
- **Problem:**
  - `Home.jsx` imported `../data/movies`, a path that does not exist.
  - Both pages imported `../MovieCard/MovieCard`, the **incomplete draft** (`favoriteMovie()` is a stub, `movie.card` and `movie["release-date"]` do not match the data shape, and a plain `.css` file is imported as a CSS Module object).
  - The complete, accessible implementation (`cardes/MovieCard.jsx`, with context wiring and `aria-pressed`) was unused.
- **Why it mattered:** Search results could not render, and the wired-up design was disconnected from routing.
- **Change:** Made `cardes/MovieCard.jsx` the canonical card; pointed `Home` and `Favorites` at it; kept the draft files untouched (they are unused) but documented them under Remaining Problems.
- **Verification:** Film grids render on both routes; favourite buttons work; no module-resolution errors.

### F8 — Favourites had no state layer (and a naive implementation would break SSR)

- **Location:** `src/context/FavoritesContext.jsx` (new)
- **Problem:** No provider existed. A straightforward `useState(() => localStorage.getItem(...))` implementation would crash during server rendering and cause hydration mismatches.
- **Change:** Implemented the provider with `useSyncExternalStore`:
  - server snapshot is a stable empty array, so SSR and hydration agree;
  - the stored value is parsed once after hydration;
  - writes are wrapped in `try/catch` (private mode/quota);
  - malformed JSON and non-array values are ignored;
  - the `storage` event keeps multiple tabs in sync;
  - stored entries are normalised to `{ id, title, release_date, url }`.
- **Why this shape:** It is the React-recommended way to read an external store, and it satisfies the React 19 `react-hooks/set-state-in-effect` lint rule that rejected the initial effect-based version.
- **Verification:** Add favourite → `aria-pressed="true"`, `localStorage` contains the film; navigate to `/favorites` → card listed; reload → still listed; “Tout supprimer” → empty state and `[]` stored; second tab updates through the `storage` event path.

### F9 — Poster URLs did not match the assets

- **Location:** `src/compenants/home/Movie.js`
- **Problem:** Data pointed to `/posters/*.jpg`, but files live in `/assets/posters/`. Two data entries also disagreed with the real filenames (`interstellar.jpg` vs `instellar.jpg`, `pulp-fiction.jpg` vs `pulp-iction.jpg`), and `matrix.jpg` does not exist.
- **Why it mattered:** Every poster was a 404 / broken image.
- **Change:** Corrected the four existing paths to the real filenames; set `url: null` for “The Matrix” and added a styled text fallback in `MovieCard` instead of inventing an asset.
- **Verification:** `/_next/image?...inception.jpg` returns 200 `image/png`; all four posters render; The Matrix renders the fallback with an accessible title.

### F10 — Favourites page imported the wrong stylesheet and router

- **Location:** `src/compenants/favorite/Favorite.jsx`
- **Problem:** `import "./Favorites.css"` (the file in this folder is `Favorite.css`), `import { Link } from "react-router-dom"`, and `../context/FavoritesContext` (wrong relative path). The existing styles and empty-state design were never applied.
- **Change:** Switched to `next/link`, `@/context/FavoritesContext`, and `./Favorite.css`.
- **Verification:** Favourites page is styled, “Parcourir les films” works, empty state renders.

### F11 — Duplicate DOM `id` caused by Cache Components

- **Location:** `src/app/layout.js`, `home/Home.jsx`, `favorite/Favorite.jsx`, `not-found.js`
- **Problem:** The skip link target `id="contenu"` was placed on each `<main>`. With `cacheComponents: true`, Next keeps previously visited routes mounted and hidden, so after navigating both mains existed and `document.querySelectorAll('#contenu')` returned **2** — invalid HTML and an ambiguous skip target.
- **Change:** Moved the skip target to a single wrapper `<div id="contenu" tabIndex={-1}>` in the root layout and removed the per-page ids.
- **Verification:** After client-side navigation, `#contenu` count is **1**; the skip link still resolves to the content wrapper.

### F12 — Dark OS theme made the interface unreadable

- **Location:** `src/app/globals.css`
- **Problem:** `prefers-color-scheme: dark` set the body background to `#0a0a0a` and text to `#ededed`, while every component hard-codes the light palette (`#fff`, `#1b2230`, `#5b6475`). On a dark-themed OS, navy headings sat on a near-black body with no card background.
- **Why it mattered:** A real visual defect for a large share of users, with no theme switch.
- **Change:** Made the light, print-inspired design explicit (`color-scheme: light`) and removed the conflicting dark variable block. This preserves the original design direction instead of redesigning it.
- **Verification:** Computed styles show the light palette; Lighthouse colour-contrast audit passes on both routes.

### F13 — Heading hierarchy skipped a level

- **Location:** `src/compenants/cardes/MovieCard.jsx` / `MovieCard.css`
- **Problem:** Page heading was `<h1>` and each film title `<h3>` (skipping `<h2>`). Lighthouse flagged `heading-order`.
- **Change:** Film titles are now `<h2>`; CSS selector updated accordingly.
- **Verification:** Lighthouse accessibility went from 0.94 → 1.00; snapshot shows `h1` then `h2` per card.

### F14 — Insufficient colour contrast on the poster fallback

- **Location:** `src/compenants/cardes/MovieCard.css` (`.movie-poster-fallback`)
- **Problem:** `#5b6475` on `#d9dce1` = **4.33:1**, below WCAG AA (4.5:1) for 16px text. Reported by Lighthouse for “The Matrix”.
- **Change:** Used the same navy as the card titles (`#1b2230`) for the fallback text.
- **Verification:** Lighthouse contrast audit passes; ratio now well above 4.5:1.

### F15 — Accessible name did not match the visible navbar label

- **Location:** `src/compenants/navbar/Navbar.jsx`
- **Problem:** An `aria-label="Favoris, 1 film en favoris"` on a link whose visible text was `Favoris` + `1` triggered `label-content-name-mismatch`, which confuses voice-control users.
- **Change:** Removed the overriding `aria-label`; the count badge is `aria-hidden` and a visually hidden suffix (“1 film en favoris”, correctly pluralised) is part of the link text.
- **Verification:** Lighthouse `label-content-name-mismatch` no longer reported; accessible name contains the visible label.

### F16 — Images were raw `<img>` tags and the sources are huge

- **Location:** `src/compenants/cardes/MovieCard.jsx`
- **Problem:** Plain `<img>` bypassed optimisation and had no intrinsic dimensions (layout-shift risk). One poster is **12.3 MB** and another **3.4 MB**.
- **Change:** Used `next/image` with `fill`, `sizes`, and `priority` for the first card only; kept `object-fit: cover` and the 2:3 aspect-ratio container.
- **Verification (measured over HTTP):**
  - `instellar.jpg`: 12,911,182 bytes → **303,560 bytes** at `w=640&q=75` (`image/png`).
  - `inception.jpg`: 790,886 → 288,767 bytes at `w=640`.
  - Image endpoint returns 200; Lighthouse best-practices is 1.00.

### F17 — ESLint errors blocked `npm run lint`

- **Location:** `src/app/layout.js`, `src/compenants/favorite/Favorite.jsx`, `src/compenants/Users/User.jsx`
- **Problem:** 5 errors: undefined `Navbar` plus four unescaped apostrophes (`react/no-unescaped-entities`).
- **Change:** Fixed the import; used French typographic apostrophes (`’`) in the favourites copy and `&apos;` in the demo component.
- **Verification:** `eslint` exits 0 with **0 errors** (one remaining warning in unused prototype code, see Section 3).

### F18 — Incorrect French pluralisation

- **Location:** `home/Home.jsx`, `favorite/Favorite.jsx`
- **Problem:** `length > 1 ? "s" : ""` produced “0 films” (French uses the singular for zero) and the favourites page duplicated the expression for two nouns.
- **Change:** Pluralise only when `count > 1`; compute the favourites count once and reuse it for “film(s)” and “enregistré(s)”.
- **Verification:** Snapshot shows “5 films”, “1 film”, “1 film enregistré”; empty list states “0 film”.

### F19 — No 404 page

- **Location:** `src/app/not-found.js` (new), `not-found.module.css`
- **Problem:** Unknown routes fell back to the default Next.js 404, in English and outside the app’s visual language.
- **Change:** Added a small French page with a link back to the films list, using a CSS Module consistent with the existing palette.
- **Verification:** `GET /does-not-exist` returns 404 with “Page introuvable” and “Retour aux films”.

### F20 — Missing accessibility navigation aids

- **Location:** `src/app/layout.js`, `globals.css`
- **Problem:** No skip link, and no `aria-current` on navigation links.
- **Change:** Added a keyboard-only “Aller au contenu” skip link with reduced-motion support, and `aria-current="page"` on the active nav item.
- **Verification:** Skip link is the first focusable element and targets `#contenu`; Lighthouse accessibility 1.00.

### F21 — Metadata was minimal

- **Location:** `src/app/layout.js`, `src/app/page.js`, `favorites/page.js`
- **Problem:** Only `title: "Cinéma"`, no description; child pages had no title handling; the root page did not include the brand in its title.
- **Change:** Added a title template (`%s | Cinéma`) with a default, a description, and an absolute title for the root page.
- **Verification:** `/` → “Films | Cinéma”; `/favorites` → “Mes favoris | Cinéma”; description meta present.

### F22 — No `robots.txt`

- **Location:** `src/app/robots.js` (new)
- **Problem:** Lighthouse’s SEO audit on `/favorites` failed with `robots-txt` (404).
- **Change:** Added a standard App Router `robots` route allowing all crawlers. No sitemap URL was invented because the deployment URL is unknown.
- **Verification:** `/robots.txt` returns 200 with `User-Agent: * / Allow: /`; SEO score is 1.00 on both routes.

### F23 — README was create-next-app boilerplate

- **Location:** `README.md`
- **Problem:** It described a generic Next.js starter, not this app; no routes, features, structure or favourite-storage notes.
- **Change:** Rewrote it for the actual project: stack, scripts, routes, structure, how favourites work, asset caveats, contributor notes.
- **Verification:** Content matches the implemented behaviour.

### Files changed

| File | Type |
| --- | --- |
| `src/app/page.js` | added |
| `src/app/favorites/page.js` | added |
| `src/app/not-found.js`, `not-found.module.css` | added |
| `src/app/robots.js` | added |
| `src/context/FavoritesContext.jsx` | added |
| `src/app/layout.js` | edited |
| `src/app/globals.css` | edited |
| `src/compenants/navbar/Navbar.jsx` | edited |
| `src/compenants/cardes/MovieCard.jsx`, `MovieCard.css` | edited |
| `src/compenants/home/Home.jsx`, `Movie.js` | edited |
| `src/compenants/favorite/Favorite.jsx` | edited |
| `src/compenants/Users/User.jsx` | edited (lint only) |
| `README.md` | rewritten |

No files were deleted, no commit was created, no branch or remote setting was changed. `package.json`, `package-lock.json`, `next.config.mjs`, `eslint.config.mjs` and `AGENTS.md` are untouched.

---

## 3. Remaining Problems

These are issues I did **not** fix, either because the instructions prohibit deleting existing work, because they require a decision from the maintainer, or because they could not be verified in this environment.

### 3.1 Security — Next.js version has a known advisory (direct dependency)

- `npm audit` reports **8 moderate** vulnerabilities: one direct runtime advisory in `next@16.4.3` and seven dev-tooling advisories (`minimatch` through `typescript-eslint`).
- The Next advisory is *information disclosure across root params when a `use cache` function is called through `unstable_cache()`*. This app does not use `use cache` or `unstable_cache`, so practical exposure is currently nil, but the framework should still be patched.
- Fix available: **Next.js 16.4.6** (non-major). This also stops the intermittent `SecurityFatalError` that aborts the first `build`/`dev` run.
- Not applied because the task explicitly forbids unapproved dependency upgrades; see the final note of this report.

### 3.2 Dead prototype code left in place

Preserved per the “do not delete existing work” rule, but it is not part of the application and should be removed or archived deliberately:

| Path | State |
| --- | --- |
| `src/app/App.js` | Vite/React-Router entry point; imports uninstalled `react-router-dom` and a missing `./index.css` |
| `src/app/test.js` | Broken todo-list tutorial: `localStorage` during render, undefined `sauvegrade`, `getItem` used as a setter, `id.map` on a number, undefined `id` in delete, `filtre`/`setFiltre` typos |
| `src/compenants/MovieCard/MovieCard.jsx` + `Movie.css` | Unused draft card; CSS imported as a module object, `movie.card` / `movie["release-date"]` mismatch, incomplete handler. Source of the only remaining lint warning |
| `src/compenants/Favorites/Favorites.jsx` + `Favorites.css` | Empty stub (renders an empty `<div>`); its CSS is imported but never applied |
| `src/compenants/Tache/tache.css` + `TacheItem.jsx` | Todo demo. **Danger:** the stylesheet contains global `body`, `form`, `input`, `button`, `ul`, `li` rules that would override the whole movie UI if imported |
| `src/compenants/Users/User.jsx` + `style.module.css` | Component demo; not routed |
| `src/compenants/home/Page.jsx` | Not a route; imports a missing `./Favorites`; exports `metadata` from a non-route module |
| `src/app/page.module.css` | Leftover create-next-app stylesheet; unused and references removed Geist font variables |
| `public/*.svg`, default `favicon.ico` | create-next-app boilerplate assets |

Risks: confusing onboarding, accidental imports (especially `tache.css`), misleading “entry point” files, and one lint warning.

### 3.3 Directory typo and duplicate concepts

- `src/compenants` is a misspelling of `components`; `cardes` is presumably `cards`; `favorite` (singular) contains `Favorites` (plural). Renaming touches every import, so it was left as a deliberate refactor task.
- Two `MovieCard` directories and two favourites-page concepts still coexist.

### 3.4 Assets

- `public/assets/posters/instellar.jpg` is **12.3 MB**, `pulp-iction.jpg` is **3.4 MB**; total asset weight is ~17 MB. Runtime serving is optimised by `next/image`, but clone and build times and repository size suffer.
- Filenames contain typos (`instellar`, `pulp-iction`); the data references them verbatim, which is fragile but correct today.
- No poster exists for “The Matrix”; a text fallback is shown. Adding an asset is a content decision, not something I invented.

### 3.5 No automated tests or CI

- No test runner, no test files, no `test` script.
- No GitHub Actions workflow, so lint/build regressions (like the one this audit fixed) can be merged unnoticed.
- No error boundary (`src/app/error.js`), so an unexpected render error would show the default error screen.

### 3.6 Data and product limitations

- Film data is a hard-coded five-item array in `src/compenants/home/Movie.js`; there is no detail page, rating, genre or API integration.
- `localStorage` data has no schema version; future shape changes need a migration strategy. The current reader normalises known fields but cannot interpret old/unknown formats.
- No loading skeletons or transitions because all routes are static.

### 3.7 Verification limits

- **Mobile viewport was not visually tested.** The in-app browser cannot emulate a viewport and `window.resizeTo` is blocked. Responsive behaviour was assessed from CSS (fluid grids with `minmax(180px, 1fr)`, `clamp()` padding, viewport meta tag) and from a 1000px-wide production render. A real device/DevTools pass is still recommended.
- Lighthouse here reports Accessibility, Best Practices and SEO only; it explicitly does not run a performance benchmark, so no Lighthouse performance score is claimed. Image-optimisation savings were measured directly over HTTP instead.
- Real pointer clicks through the browser tool intermittently failed with `UnknownVizError` when the target was outside the viewport; after scrolling into view, a real click succeeded. Remaining interaction checks used DOM clicks and controlled input. This is a tooling limitation, not an app error — React handlers, storage and navigation all behaved correctly.
- `npm audit` advisories were read but not remediated (see 3.1).

---

## 4. Code Quality Assessment

### Architecture — Fair (now workable)

The App Router structure is conventional and correct after the fixes: server layout/pages, client components only where interactivity is required, one provider at the root. The previous state was an unfinished migration with three competing prototypes, so the architectural clarity is new rather than inherited. The `compenants` typo and duplicate component trees still blur the organisation.

### Component organisation — Fair

Responsibilities are reasonably separated: `Home` owns search, `MovieCard` owns presentation + favourite toggle, `Favorites` owns the saved list, `Navbar` owns navigation. Route files are thin wrappers with metadata. Weak points: components live in inconsistently named folders, and dead siblings sit next to live ones with no marker.

### Code reusability — Good

- One canonical `MovieCard` is used by both routes.
- Favourite logic is centralised in context, not duplicated in components.
- Pluralisation and labels are computed locally, but small; a shared `pluralize` helper would be over-engineering for two call sites.
- Static data is separated from UI.

### State management — Good

Context + `useSyncExternalStore` is proportionate for a client-only app: no global state library, SSR-safe snapshots, cross-tab synchronisation, guarded reads/writes. `useMemo`/`useCallback` keep the context value stable. The remaining gap is schema versioning, not architecture.

### Error handling — Basic

`localStorage` access is wrapped in `try/catch`, malformed data is ignored, and `useFavorites` throws a clear error outside its provider. There is no React error boundary, no user-facing fallback for unexpected failures, and no error reporting. For a static app the risk is low, but `app/error.js` is a cheap improvement.

### Performance — Good

- Both routes are statically prerendered.
- First card image is prioritised; the rest are lazy by default; explicit `sizes` avoids oversized downloads.
- Measured optimisation: 12.9 MB source poster served as 304 KB (and 791 KB → 289 KB).
- No fonts, analytics or third-party scripts are loaded.
- Remaining cost is repository weight (unoptimised source JPEGs), not runtime.

### Accessibility — Excellent (verified)

- Lighthouse Accessibility **1.00** on both routes, no remaining failures.
- Semantic headings (`h1` → `h2`), `lang="fr"`, `alt` text on posters, `aria-pressed` on toggles, `aria-live` result count, `aria-current` navigation, visible focus rings, skip link, reduced-motion handling, AA colour contrast.
- Not yet verified: screen-reader announcements of the favourites count after toggling (the count is outside a live region), and focus management after client-side navigation.

### Responsive design — Fair to Good (not device-tested)

- Fluid grids (`auto-fill` + `minmax`), `clamp()` page padding, and an aspect-ratio poster container adapt without fixed widths.
- Navbar and search form are simple flex rows that fit narrow screens; the explicit mobile media query only exists in the unused `tache.css`.
- No hamburger menu is needed at current content volume.
- Needs a real 320–768px verification pass; the code has no obvious overflow sources.

---

## 5. Recommended Improvements

### Priority 1 — Critical / do first

**1.1 Upgrade Next.js to the patched 16.4.6+ release**

- **Why:** Removes the direct security advisory and the intermittent `SecurityFatalError` that aborts the first `build`/`dev` run. It is also a blocker for trustworthy CI.
- **Files:** `package.json`, `package-lock.json`; verify `next.config.mjs` options still behave the same.
- **Difficulty:** Easy (low risk, patch-level upgrade).

**1.2 Remove or archive the dead prototypes**

- **Why:** Removes the remaining lint warning, eliminates accidental imports (notably the global selectors in `tache.css`), and makes the project navigable for new contributors.
- **Files:** `src/app/App.js`, `src/app/test.js`, `src/app/page.module.css`, `src/compenants/MovieCard/`, `src/compenants/Favorites/`, `src/compenants/Tache/`, `src/compenants/Users/`, `src/compenants/home/Page.jsx`, unused `public/*.svg`.
- **Difficulty:** Easy–Medium (decide what to keep; update no imports because nothing live references them).

**1.3 Add CI (lint + build)**

- **Why:** The clone was unbuildable; a two-job workflow would have caught it in the PR that introduced it.
- **Files:** `.github/workflows/ci.yml` (new), existing `package.json` scripts.
- **Difficulty:** Easy.

**1.4 Add an error boundary**

- **Why:** A render error currently falls back to the default Next.js screen; a branded French `error.js` with a reset action keeps the app usable.
- **Files:** `src/app/error.js` (new), optional `global-error.js`.
- **Difficulty:** Easy.

**1.5 Reduce poster weight in the repository**

- **Why:** 17 MB of source images slows clones and builds, and one file is 12.3 MB. Serving is optimised, but the repo is not.
- **Files:** `public/assets/posters/*`; optionally add an image-processing script.
- **Difficulty:** Easy (re-encode/resize at the source; get maintainer approval before replacing binary assets).

### Priority 2 — Important quality work

**2.1 Normalise the component structure**

- Rename `compenants` → `components`, `cardes` → `cards`, `favorite` → `favorites`; merge the duplicate `MovieCard` trees.
- **Why:** Removes the biggest source of confusion and import mistakes.
- **Files:** all files under `src/`; update `@/*` imports.
- **Difficulty:** Medium (mechanical but touches every file).

**2.2 Move film data to a dedicated module with a stable schema**

- **Why:** `home/Movie.js` mixes data with a page folder and is not reusable by future routes or tests.
- **Files:** new `src/data/movies.js`; update `Home`, future detail page.
- **Difficulty:** Easy.

**2.3 Add automated tests**

- **Why:** Favourites persistence, search filtering and pluralisation are pure behaviours that regress easily; currently nothing is tested.
- **Files:** new `vitest.config.mjs` + `src/**/*.test.jsx`; optionally Playwright for the favourite flow.
- **Difficulty:** Medium.

**2.4 Verify and polish responsive behaviour**

- **Why:** Mobile behaviour is inferred, not proven; the audit could not emulate a phone.
- **Files:** `Home.css`, `Favorite.css`, `Navbar.css`, `MovieCard.css`; add breakpoints only where needed.
- **Difficulty:** Easy–Medium.

**2.5 Complete the design system**

- **Why:** Colours (`#1b2230`, `#9b1d32`, `#5b6475`) are repeated across CSS files; a token set enables a real dark theme and consistent changes.
- **Files:** `globals.css` (custom properties), component CSS files.
- **Difficulty:** Medium.

**2.6 Add SEO extras**

- **Why:** robots is done; `sitemap.js`, an Open Graph image and Movie JSON-LD would improve sharing and indexing.
- **Files:** `src/app/sitemap.js`, `opengraph-image`, `src/app/page.js`.
- **Difficulty:** Easy–Medium (needs the production URL).

**2.7 Version the favourites storage schema**

- **Why:** Changing the saved shape later would silently break returning users.
- **Files:** `src/context/FavoritesContext.jsx`.
- **Difficulty:** Easy.

### Priority 3 — Advanced / product growth

**3.1 Film detail routes**

- Add `/films/[id]` with synopsis, cast and metadata; requires extending the data model or an API.
- **Files:** `src/app/films/[id]/page.js`, `src/data/movies.js`, `MovieCard` links.
- **Difficulty:** Medium.

**3.2 Real data source (e.g. TMDB) with Cache Components**

- Server-side fetching with API routes/`use cache`, keeping the key server-only.
- **Why:** Turns the static demo into a real catalogue without exposing credentials.
- **Files:** `src/app/api/`, `src/lib/`, `next.config.mjs`, `.env.local.example`.
- **Difficulty:** Hard.

**3.3 TypeScript migration**

- **Why:** The data/context contracts are exactly where types help most.
- **Files:** all `.js/.jsx` files, `tsconfig.json`, ESLint config.
- **Difficulty:** Hard.

**3.4 PWA / offline support**

- **Why:** The app is already fully static and local-first; offline caching fits naturally.
- **Files:** manifest, service worker or Next PWA setup.
- **Difficulty:** Medium–Hard.

**3.5 Internationalisation**

- **Why:** UI is French-only by design; extraction would allow an English version.
- **Files:** copy in components, routing/middleware.
- **Difficulty:** Medium.

**3.6 View Transitions and interaction polish**

- **Why:** Route transitions and favourite animations would feel more finished; the CSS already respects reduced motion.
- **Files:** `next.config.mjs`, `layout.js`, card CSS.
- **Difficulty:** Easy–Medium.

---

## 6. Contribution Opportunities

### Beginner-friendly

1. **Delete/archive the dead prototype files** listed in 3.2 and confirm `npm run lint` is completely clean.
2. **Fix poster filename typos** (`instellar.jpg`, `pulp-iction.jpg`) and update `Movie.js`.
3. **Add the missing “The Matrix” poster** (needs maintainer-provided art) and remove the fallback entry.
4. **Compress/resize source posters** to reasonable web sizes (e.g. ≤ 300 KB each at 2× card width).
5. **Add `src/app/sitemap.js`** once the deployment URL is known.
6. **Improve README screenshots and troubleshooting notes.**
7. **Fix the stale package name** `react-app` → `movies-app`.
8. **Add `loading.js`/`error.js` copy** in French, matching the 404 page.

### Intermediate

1. **Set up GitHub Actions** for `npm ci`, `npm run lint`, `npm run build`.
2. **Write unit tests** for favourites (`toggle`, `clear`, malformed storage) and search filtering.
3. **Add Playwright coverage** for: add favourite → navbar count → favourites page → reload → clear.
4. **Rename and consolidate the component tree** (`compenants` → `components`, one `MovieCard`).
5. **Introduce CSS custom properties** for the palette and spacing; then a proper `prefers-color-scheme` theme.
6. **Add an error boundary** and verify recovery with a forced render error.
7. **Storage schema versioning** (`{ version, items }`) with migration from the current array.
8. **Responsive verification pass** at 320/375/768/1024px with screenshots in the PR.

### Advanced

1. **TypeScript migration** with typed `Movie` and favourite store contracts.
2. **TMDB integration** with a server-only API key, caching via Cache Components and graceful failure states.
3. **Film detail routes** with metadata generation (`generateMetadata`) and JSON-LD.
4. **PWA/offline** support with an installable manifest and cached posters.
5. **Internationalisation** (French/English) without duplicating components.
6. **Performance budget and monitoring** (image size limits, bundle analysis, Web Vitals reporting).
7. **Design-system extraction** into reusable primitives (button, card, grid) if the app grows.

---

## Verification Log (actual commands and results)

```text
npm install
  → 339 packages added; 8 moderate advisories reported by npm audit

npm run lint
  → 1 warning, 0 errors; exit 0
  → warning: <img> in src/compenants/MovieCard/MovieCard.jsx (unused prototype)

npm run build
  → first run after a fresh advisory check: SecurityFatalError (Next 16.4.3 advisory)
  → immediate retry: "✓ Compiled successfully"; exit 0
  → routes: /, /_not-found, /favorites (all static); /robots.txt served

npm run start -- -p 3100
  → GET /            200, contains posters and "Cinéma"
  → GET /favorites   200, empty state present
  → GET /missing     404, "Page introuvable"
  → GET /robots.txt  200, "User-Agent: * / Allow: /"
  → GET /_next/image?url=.../inception.jpg&w=640&q=75   200, image/png, 288,767 bytes
  → GET /_next/image?url=.../instellar.jpg&w=640&q=75    200, image/png, 303,560 bytes (source 12,911,182)

npm run dev -- -p 3101   (NEXT_TELEMETRY_DISABLED=1)
  → Ready; GET / 200; GET /favorites 200; GET /missing 404
  → no compile errors in server output

Browser (production build)
  → console errors: none on / and /favorites
  → favourite click: aria-pressed "true", localStorage holds 1 film
  → /favorites shows the film; survives reload
  → "Tout supprimer": empty state + localStorage "[]"
  → search "dark": results count "1 film", only "The Dark Knight"
  → after client navigation: exactly one #contenu (duplicate-id bug fixed)
  → Lighthouse /:           accessibility 1.00, best-practices 1.00, SEO 1.00
  → Lighthouse /favorites:  accessibility 1.00, best-practices 1.00, SEO 1.00
```

Not run: `npm test` (no test script exists), Lighthouse performance benchmark (unsupported by the tool), real mobile-device viewport tests (browser tool cannot emulate a viewport).

---

## Suggested next five improvements

1. **Upgrade Next.js to 16.4.6+** — removes the security advisory and the build abort.
2. **Remove/archive the dead prototype files** — cleans lint, structure and onboarding.
3. **Add CI (lint + build)** — prevents this exact “clone does not build” regression.
4. **Consolidate the component tree** (`compenants`/`cardes`/duplicate `MovieCard`).
5. **Add tests for favourites + search**, then responsive verification at mobile widths.

> **Security upgrade note:** your cloned Next.js version (16.4.3) is affected by a known vulnerability, and npm reports a patched release (16.4.6). Upgrading was intentionally left out of this audit because dependency changes were outside the approved scope — it was later applied in a separate worktree after approval (see the Addendum below).

---

## Addendum — Security upgrade (approved after the audit)

After the audit was delivered, the maintainer approved the security upgrade in an
isolated Git worktree, so the main working tree above is unchanged.

- **Worktree:** `C:\Users\DELL\Movies_App-security-upgrade` (detached HEAD at `38dc23b`, containing the audit fixes copied in for verification).
- **Upgrade:** `next` **16.4.3 → 16.4.6** and `eslint-config-next` **16.4.3 → 16.4.6** (exact versions).
- **Config:** added `experimental.agentUpgrade: "security"` to `next.config.mjs`; unrelated options preserved.
- **Duplicate checks:** no `next-upgrade:` markers, branches, or commits with equivalent work. `gh` is not installed, so open pull requests could not be checked.
- **Compliance:** no commit, no push, no PR, no remote changes were made, per the maintainer's instructions.

Verification in the upgraded worktree:

| Check | Result |
| --- | --- |
| `next --version` | `Next.js v16.4.6` |
| `npm audit` | Next.js advisory gone; 7 moderate dev-tooling advisories remain (`typescript-eslint`/`minimatch`) |
| `npm run lint` | 0 errors, 1 warning (same unused prototype file) |
| `npm run build` | Success on first run — the `SecurityFatalError` abort no longer occurs; routes `/`, `/_not-found`, `/favorites`, `/robots.txt` |
| Runtime | `/` 200, `/favorites` 200, unknown route 404, `/robots.txt` 200, optimised image 200 |
| Browser | No console errors; favourite toggles, persists across reload, single `#contenu` |
| Lighthouse | `/`: accessibility 1.00, best-practices 1.00, SEO 1.00, no failures |

The upgrade remains isolated in that worktree; it is not merged into the main
checkout and contains no commits. The dev-only advisories can be addressed later
by upgrading the ESLint toolchain (see Priority 1/2).

---

## Phase 2 — Contribution plan (reviewed 16 November 2026)

> **Execution update (17 November 2026):** this plan is being applied on branch
> `chore/next-16.4.6-ci`. The Phase-1 fixes are the first commit on that branch;
> the Next.js 16.4.6 upgrade and `.github/workflows/ci.yml` are the follow-up
> commit. Cleanup (2.3), tests (2.5) and responsive verification (2.6) remain
> future contributions.
>
> **Review-time status:** planning only. No application feature or component
> behaviour was changed by the plan itself.

### 2.1 Repository state inspected

| Item | Observed |
| --- | --- |
| Main checkout | `C:\Users\DELL\Movies_App` |
| Branch / HEAD | `main` at `38dc23b` (`Project Movies`) |
| Working tree | Phase-1 audit fixes still uncommitted (10 modified files, 7 new paths) |
| Upgrade worktree | `C:\Users\DELL\Movies_App-security-upgrade`, detached HEAD `38dc23b` |
| Worktrees | Exactly the two paths above |
| Source trees | Identical (`git diff --no-index --quiet` on both `src` trees exited `0`) |
| CI configuration | None before this phase; `.github/` did not exist |
| `gh` CLI | Not installed, so open pull requests could not be listed |

Uncommitted Phase-1 paths:

- **Modified:** `README.md`, `src/app/globals.css`, `src/app/layout.js`,
  `src/compenants/Users/User.jsx`, `src/compenants/cardes/MovieCard.css`,
  `src/compenants/cardes/MovieCard.jsx`,
  `src/compenants/favorite/Favorite.jsx`, `src/compenants/home/Home.jsx`,
  `src/compenants/home/Movie.js`, `src/compenants/navbar/Navbar.jsx`.
- **New:** `PROJECT_AUDIT.md`, `src/app/favorites/`, `src/app/not-found.js`,
  `src/app/not-found.module.css`, `src/app/page.js`, `src/app/robots.js`,
  `src/context/`.

### 2.2 Security upgrade review (Next.js 16.4.3 → 16.4.6)

#### What actually changed

| File | Diff | Assessment |
| --- | --- | --- |
| `package.json` | 2 lines | `next` and `eslint-config-next` move from `16.4.3` to exact `16.4.6`. `react`/`react-dom` stay at `19.3.0`. |
| `package-lock.json` | 48 additions / 48 deletions | Only the `next`, `@next/*` and `eslint-config-next` entries change. No new runtime dependency family. |
| `next.config.mjs` | 1 line | Adds `experimental.agentUpgrade: "security"`; `agentFeedback`, `cacheComponents` and `partialPrefetching` are preserved. This marker records why the upgrade happened and is optional. |
| `src/`, `README.md`, `PROJECT_AUDIT.md` | No upgrade diff | These files were copied into the worktree from the main checkout so the upgraded tree could build. They are **not** part of the dependency upgrade and must not be copied back wholesale. |

#### Compatibility

- Next.js 16 declares `engines.node >= 20.9.0`. The verified local runtime is
  Node `24.17.0`; the CI workflow therefore uses Node 24.
- The React peer range accepts `^19.0.0`; the installed `19.3.0` satisfies it.
- 16.4.6 is a patch release. The app uses stable App Router APIs
  (`layout.js`, `page.js`, `not-found.js`, `robots.js`, `next/link`,
  `next/image`, `next/navigation`), so no migration step is expected or needed.
- `eslint-config-next` is pinned to the same patch as `next`, which avoids
  config/plugin version skew.
- Verification in the worktree already passed: lint (0 errors, 1 warning),
  first-run build, `/`, `/_not-found`, `/favorites`, `/robots.txt`, runtime
  status codes, favourites flow and Lighthouse.

#### Security implications

- The direct Next.js advisory that affected `16.4.3` is removed.
- `npm audit --omit=dev` in the upgraded worktree reports **0 vulnerabilities**.
- The full audit still reports **7 moderate** advisories in the ESLint toolchain
  (`@typescript-eslint/*` → `minimatch`). They are development-only, are not
  shipped in the production bundle, and should be handled separately.
- Do **not** run `npm audit fix --force` as part of this upgrade: it can jump
  major versions of lint tooling and create a second, unrelated regression.
- The lockfile change is small and reviewable, which keeps supply-chain review
  practical.

#### Safest integration path

A Git merge of the worktree is the wrong tool here: it is a **detached HEAD**
with **uncommitted, mixed changes** (upgrade + copied audit fixes). There is no
branch to merge and no commit to cherry-pick. Copy only the three upgrade files.

1. Land the Phase-1 audit fixes first (see 2.7, Phase 1). This keeps the upgrade
   diff limited to dependencies and config.
2. Branch from the updated `main` as `chore/next-16.4.6-ci`.
3. Copy **only** `package.json`, `package-lock.json` and `next.config.mjs` from
   `C:\Users\DELL\Movies_App-security-upgrade`. Do not copy `src/`, `README.md`,
   `node_modules/` or `.next/`.
4. Run `npm ci` (not `npm install`) so the copied lockfile is authoritative.
5. Run `npm run lint` and `npm run build`, then a runtime smoke test.
6. Commit and open one PR that also adds `.github/workflows/ci.yml`, so the
   first CI run proves the upgraded tree is green.
7. Merge only after CI passes; then remove the detached worktree.

**Sequencing warning:** on the current `main`, `16.4.3` can abort its first
clean build with `SecurityFatalError` (a retry succeeds). CI must not hide that
with retries. Add CI **with** the upgrade, or land the upgrade before enabling
the required check. Otherwise the first CI run will legitimately be red.

**Rollback:** before committing, `git restore package.json package-lock.json
next.config.mjs`; after merging, revert the PR and run `npm ci` to restore
`node_modules`. No application source rollback is needed.

### 2.3 Cleanup review (nothing deleted)

Identification used import/reference searches, Next.js route conventions,
0-byte file checks and the build route list. A file is "safe to remove" only
when no live route, component or config imports it.

#### Safe to remove, in a dedicated cleanup PR

| Path | What it is | Evidence | Verdict |
| --- | --- | --- | --- |
| `src/app/App.js` | Old Vite/React-Router entry point | Imports `react-router-dom` (not a dependency) and relative paths that do not exist; no importer | Remove |
| `src/app/test.js` | Broken todo tutorial | No importer; `test.js` is not a Next.js route; reads `localStorage` during initial state | Remove |
| `src/compenants/Tache/` (`TacheItem.jsx`, `tache.css`) | Todo demo | Only `test.js` imports it; CSS has global `body`/`form`/`input`/`button`/`ul`/`li` rules | Remove with `test.js` |
| `src/compenants/Favorites/` (`Favorites.jsx`, 0-byte `Favorites.css`) | Empty favourites stub | Only `App.js` imports it; component renders an empty `<div>` | Remove with `App.js` |
| `src/compenants/MovieCard/` (`MovieCard.jsx`, `Movie.css`) | Draft duplicate of `cardes/MovieCard` | Only imports its own CSS; no importer; its `<img>` is the single remaining lint warning | Remove |
| `src/compenants/Users/` (`User.jsx`, 0-byte `style.module.css`) | Demo component | No importer; 0-byte stylesheet; `User.jsx` is currently modified, so review `git diff` first | Remove after confirming the edit is not wanted |
| `src/compenants/home/Page.jsx` | Stale duplicate favourites page | Imports `./Favorites`, which does not exist under `home/`; no importer | Remove |
| `src/app/page.module.css` | Default Next.js starter styling | `src/app/page.js` does not import it; no other importer | Remove |
| `public/next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, `file.svg` | Starter assets | No references in JS/JSX/CSS/Markdown | Optional removal; low value |

#### Keep — still required

- `src/compenants/home/Home.jsx`, `Home.css`, `Movie.js` (the five-film data set).
- `src/compenants/cardes/MovieCard.jsx`, `MovieCard.css` (the canonical card).
- `src/compenants/favorite/Favorite.jsx`, `Favorite.css` (the `/favorites` page).
- `src/compenants/navbar/Navbar.jsx`, `Navbar.css`.
- `src/context/FavoritesContext.jsx` (favourites + localStorage store).
- `src/app/layout.js`, `page.js`, `favorites/page.js`, `not-found.js`,
  `not-found.module.css`, `robots.js`, `favicon.ico`, `globals.css`.
- `public/assets/posters/*` (used by `Movie.js`; the misspelled filenames are
  intentional so they match the data).
- `next.config.mjs`, `eslint.config.mjs`, `jsconfig.json`, `package*.json`,
  `README.md`, `AGENTS.md`, `PROJECT_AUDIT.md`.

#### Cautions

- `home/Movie.js` is **not** dead: it is the active data source. Do not remove
  it just because it is static; refactoring it to JSON or an API is a separate
  feature.
- `Users/User.jsx` is a tracked file with an uncommitted modification. It is
  unreferenced, but deleting it while the Phase-1 diff is uncommitted would
  blur the review. Delete it only in the cleanup PR.
- `Tache/tache.css` is only safe because nothing live imports it. Its global
  element selectors would affect every button and form in the app if imported.
- Removing `MovieCard/` also removes the last lint warning; after cleanup,
  `npm run lint` should report 0 errors and 0 warnings.

#### Recommended cleanup order

1. Commit/merge the Phase-1 fixes so the cleanup diff is purely deletions.
2. Create `chore/remove-dead-prototypes`.
3. Remove the duplicated/stub files and their now-orphaned CSS in one commit.
4. Run `npm run lint` (expect 0 warnings), then `npm run build`.
5. Smoke-test `/`, `/favorites`, a 404 route and the favourite toggle.
6. Review `git status` and `git diff --stat` before committing.
7. If any file is uncertain, `git mv` it to an `archive/` folder instead of
   deleting it, but do not keep the archive in the shipped tree indefinitely.

### 2.4 CI setup

Workflow prepared at `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Lint and build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NEXT_TELEMETRY_DISABLED: "1"
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
```

Why each part matters:

| Control | Regression it prevents |
| --- | --- |
| `npm ci` | Fails when `package.json` and `package-lock.json` disagree; guarantees a clean, reproducible install instead of "works with my old `node_modules`". |
| `npm run lint` | Catches unused variables/imports, React hook misuse, invalid JSX and broken module resolution. |
| `npm run build` | Catches missing routes/modules, server/client boundary mistakes, metadata errors, invalid image/CSS imports and the exact "clone does not build" failure this audit found. |
| `pull_request` trigger | Runs the checks before merge, not after a broken change is already on `main`. |
| `contents: read` | Least privilege: the job cannot write to the repository. |
| `persist-credentials: false` | The checkout token is not left in the job's Git config. |
| Concurrency + timeout | Cancels superseded runs and prevents a hung job from consuming minutes. |
| `NEXT_TELEMETRY_DISABLED` | Keeps CI logs deterministic and avoids telemetry from the runner. |

Limits: CI does not test localStorage, search behaviour, visuals or responsive
layout, and it does not run `npm audit`. Those need the tests in 2.5 and the
manual checklist in 2.6. It also does not deploy anything.

Enable the protection after the workflow is on `main`:

1. GitHub → **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: `main`.
3. Enable **Require status checks to pass before merging**.
4. Select the check named `Lint and build` (workflow `CI`) and save.
5. Optionally require branches to be up to date before merging.

Two practical notes:

- The lint script (`eslint`) exits `0` with warnings. CI will not fail on the
  current single warning. After the cleanup PR removes it, add
  `--max-warnings=0` to the `lint` script to stop warning creep.
- This workflow is intentionally not added to the Phase-1 PR: on `16.4.3` the
  first build can abort. Ship it with the `16.4.6` upgrade (Phase 2) so its
  first run is meaningful.

### 2.5 Lightweight testing strategy

Test behaviour, not implementation details. The app is small enough that 20–25
focused tests cover the real risks. Avoid snapshot tests, CSS assertions and
Next.js internals.

#### Recommended stack (three dev dependencies)

| Package | Role | Why it is enough |
| --- | --- | --- |
| `vitest` | Test runner | Fast, understands ESM/JSX without a Babel config, stubs CSS imports by default. |
| `jsdom` | Browser environment | Provides `window`, `localStorage` and `StorageEvent` for the favourites store. |
| `@testing-library/react` | Rendering and queries | Encourages role/label queries; includes `fireEvent` and `cleanup`. npm installs its `@testing-library/dom` peer automatically. |

Deliberately omitted for now: Jest (slower, extra Babel/Next config), Enzyme
(legacy), Cypress/Playwright (heavy browser download), `jest-dom` (plain DOM
assertions are sufficient), `user-event` (`fireEvent` covers these simple
interactions), and `@vitejs/plugin-react` (setting `esbuild.jsx` to `automatic`
below is enough for tests). Add Playwright only if a navigation bug cannot be
reproduced in jsdom.

Proposed commands (do **not** run as part of this planning phase):

```bash
npm install --save-dev vitest jsdom @testing-library/react
```

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

`vitest.config.mjs` (the `.mjs` extension is required because `package.json`
does not set `"type": "module"`):

```js
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    css: false,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

#### Test matrix

| Area | File | Cases to cover |
| --- | --- | --- |
| Favourites | `src/context/FavoritesContext.test.jsx` | Starts empty; add; remove; toggle is idempotent; no duplicate ids; `clearFavorites`; normalized fields only; malformed JSON; non-array JSON; invalid entries filtered; quota/private-mode failure keeps in-memory state; `storage` event from another tab updates state. |
| Persistence | Same file | After adding, `localStorage["cinema:favorites"]` contains the normalized array; reset modules and re-render to simulate a reload and confirm the favourite returns. |
| Search/filter | `src/compenants/home/Home.test.jsx` | All five films by default; case-insensitive partial match (`inc` → Inception); surrounding whitespace ignored; no-match message includes the query; clear button restores all five and disappears; singular/plural count (`1 film`, `5 films`). |
| Accessibility of search | Same file | `role="search"`, labelled input, live results count (`aria-live="polite"`). |
| Navigation | `src/compenants/navbar/Navbar.test.jsx` | Both links point to `/` and `/favorites`; correct link has `aria-current="page"` for each mocked pathname; count badge shows the right number and has screen-reader text; badge is absent at zero. |
| Error handling | `FavoritesContext.test.jsx`, `Favorite.test.jsx`, `not-found.test.jsx` | `useFavorites` outside the provider throws the documented message; 404 page renders its heading and home link; empty favourites page shows guidance and the browse link; corrupt storage does not crash. |
| Card fallback | `src/compenants/cardes/MovieCard.test.jsx` | A film with `url` renders the poster alt text; the `null`-poster film (`The Matrix`) renders the title fallback; the favourite button has `aria-pressed` and an action-specific label. |

#### Implementation notes

- `FavoritesContext` keeps a module-level `cachedFavorites` reference. Between
  tests, call `vi.resetModules()` and dynamically `await import()` the provider
  so each test starts from a fresh module cache. `localStorage.clear()` alone is
  not enough.
- Mock `next/navigation` per test:
  `vi.mock("next/navigation", () => ({ usePathname: () => "/favorites" }))`.
  `next/link` renders a normal anchor in jsdom, so no mock is needed.
- For the quota test:
  `vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("QuotaExceededError"); })`.
  Assert the UI still updates and that a reload (reset modules) comes back empty.
- Import `cleanup` and call it in `afterEach`; with Vitest's default non-global
  mode, Testing Library's automatic cleanup does not run.
- Use `screen.getByRole` / `getByLabelText` rather than class names. This keeps
  tests valid if the `compenants`/`cardes` structure is renamed later.
- Mock `next/image` only if jsdom objects to `srcSet`; do not assert on Next's
  internal image markup.
- Keep the storage key assertion (`cinema:favorites`) in one test. It is a
  deliberate contract; if the key changes, update the test and document the
  migration.

#### Rollout

1. Add the stack on `test/favourites-search`; commit the lockfile change.
2. Write favourites + search first (highest regression value), then navigation,
   then error handling.
3. Run `npm test` locally and confirm it finishes in a few seconds.
4. Add a `npm test` step to `.github/workflows/ci.yml` between lint and build.
5. Only then consider Playwright for real cross-page navigation, reload and
   browser storage. That is a second-tier investment, not a prerequisite.

### 2.6 Responsive testing checklist

Use `npm run dev`, Chrome/Edge DevTools device toolbar (or Firefox Responsive
Design Mode), 100% zoom, hard reload. Test `/`, `/favorites` (empty and with
2–3 favourites) and `/does-not-exist` at each size. Mobile emulation was not
available in the current tooling, so this remains a manual checklist.

Expected grid from the current CSS (`repeat(auto-fill, minmax(180px, 1fr))`,
1.5rem gap, `clamp(1rem, 4vw, 3rem)` page padding):

| Width × height | Usable content width | Expected columns | Notes |
| --- | --- | --- | --- |
| 320 × 568 | ~288 px | 1 | One large poster per row. Check search input + "Effacer" fit. |
| 375 × 667 | ~343 px | 1 | Same single-column layout; two 180 px cards + gap need 384 px. |
| 768 × 1024 | ~707 px | 3 | Tablet layout; 4 columns would need 792 px. |
| 1024 × 768 | ~942 px | 4 | Fifth card wraps to a second row. |
| 1440 × 900 | ~1004 px (container capped at 1100 px) | 5 | All five films fit on one row. |

At 320/375 the single-column result is mathematically expected, not a bug. If a
denser mobile layout is wanted, a `max-width: 480px` rule with two equal
columns and a smaller gap is the smallest change; decide this as a design
choice before changing CSS.

Common checks at every width:

- [ ] No horizontal scrolling:
      `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth + 1`.
- [ ] No element crosses the left/right viewport edge (use the console check below).
- [ ] Navbar brand, "Films", "Favoris" and the count badge are visible, aligned
      and not overlapping; focus outlines are not clipped.
- [ ] Touch targets: favourite button, nav links and buttons are comfortably
      tappable. Current favourite button is 40 px and nav links are roughly
      24 px high; treat 44 px as the target if this becomes a touch-focused change.
- [ ] Search: input and "Effacer" fit or wrap without clipping the placeholder;
      the results count and no-match message wrap cleanly.
- [ ] Grid: expected column count; posters keep their 2:3 ratio; the heart stays
      inside the poster; titles wrap without colliding with the year.
- [ ] Favourites: empty-state card, browse link, "Tout supprimer" and populated
      grid all fit; the header wraps rather than overflowing.
- [ ] 404: title, text and "Retour aux films" link stay within the viewport.
- [ ] Images: four posters load, "The Matrix" shows its text fallback, no layout
      shift and no broken-image icon.
- [ ] Keyboard: skip link appears first, tab order is logical, Enter/Space
      activate links and buttons, focus is always visible.
- [ ] 200% text zoom (separate pass): no clipped or overlapping content.
- [ ] Reduced-motion preference: no problematic animation.

Console overflow check (paste in DevTools on each page/width):

```js
const vw = document.documentElement.clientWidth;
const overflow = [...document.querySelectorAll("body *")]
  .filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && (r.right > vw + 1 || r.left < -1);
  })
  .map((el) => `${el.tagName}.${el.className}`);
console.log({ scrollWidth: document.body.scrollWidth, vw, overflow });
```

Record the results in the responsive PR/issue as a small table (width → pass /
issue). Fix only confirmed layout defects; do not mix responsive CSS changes
with the upgrade or cleanup PRs.

### 2.7 Exact next steps for the contributor

Run these **later**, in order. They are not executed by this audit.

#### Phase 1 — land the audit fixes

```powershell
cd C:\Users\DELL\Movies_App
git status --short
git diff --stat
git switch -c fix/phase-1-audit
git add README.md src PROJECT_AUDIT.md
git commit -m "fix: restore routes, favourites and accessibility"
git push -u origin fix/phase-1-audit
```

Open PR A on GitHub (the `gh` CLI is not installed). Do **not** add `.github/`
to this PR; keep the workflow for Phase 2 so its first run is green. Wait for
review and merge.

#### Phase 2 — upgrade + CI

```powershell
git switch main
git pull
git switch -c chore/next-16.4.6-ci
Copy-Item C:\Users\DELL\Movies_App-security-upgrade\package.json .
Copy-Item C:\Users\DELL\Movies_App-security-upgrade\package-lock.json .
Copy-Item C:\Users\DELL\Movies_App-security-upgrade\next.config.mjs .
npm ci
npm run lint
npm run build
npm start
```

Smoke-test `/`, `/favorites`, `/does-not-exist` (404) and `/robots.txt`; toggle a
favourite and reload. Then commit the upgrade **with** the prepared workflow:

```powershell
git add package.json package-lock.json next.config.mjs .github/workflows/ci.yml
git commit -m "chore: upgrade Next.js to 16.4.6 and add CI"
git push -u origin chore/next-16.4.6-ci
```

Open PR B. Confirm the `Lint and build` CI check is green, then merge. After the merge:

```powershell
git worktree remove C:\Users\DELL\Movies_App-security-upgrade
git worktree prune
```

If Git refuses because the worktree still has uncommitted changes, inspect them
first; use `--force` only after confirming no unique work remains.

#### Phase 3 — remove dead prototypes

```powershell
git switch main
git pull
git switch -c chore/remove-dead-prototypes
git rm -r src/app/App.js src/app/test.js src/app/page.module.css
git rm -r src/compenants/Tache src/compenants/Favorites src/compenants/MovieCard
git rm -r src/compenants/Users src/compenants/home/Page.jsx
npm run lint
npm run build
```

Expect 0 lint warnings. Smoke-test the routes, then commit and open PR C. Keep
the deletion list limited to the table in 2.3; do not touch `home/Movie.js`,
`cardes/MovieCard` or the posters.

#### Phase 4 — add tests

```powershell
git switch main
git pull
git switch -c test/favourites-search
npm install --save-dev vitest jsdom @testing-library/react
```

Add `vitest.config.mjs`, the `test` scripts and the test files from 2.5. Run
`npm test`, then add the `npm test` step to CI and open PR D.

#### Phase 5 — responsive verification

Run the 2.6 checklist at 320, 375, 768, 1024 and 1440 px on `/`, `/favorites`
and the 404 page. Record results; if the single-column mobile layout is
undesired, make it a separate, reviewed CSS change.

#### Phase 6 — dev-only advisories (non-blocking)

After CI and tests are stable, address the 7 moderate ESLint-toolchain
advisories with a normal, non-forced dependency update. Re-run lint, build and
tests, and confirm `npm audit --omit=dev` still reports 0.

#### Definition of done

- [ ] A clean clone on Node 24 runs `npm ci`, `npm run lint`, `npm run build`.
- [ ] `main` uses Next.js `16.4.6`; production audit reports 0 vulnerabilities.
- [ ] CI is required on `main` and green.
- [ ] `npm run lint` reports 0 warnings.
- [ ] Favourites, persistence, search and navigation tests pass in CI.
- [ ] Responsive checklist is signed off at all five widths.
- [ ] Dead prototypes are removed in their own PR.
- [ ] The detached upgrade worktree is removed.

**Compliance:** this phase made no commit, push, pull request, merge, branch
change or file deletion. `.github/workflows/ci.yml` and this section are
uncommitted working-tree changes.
