# KINO XII

Cinema website for browsing films and live events, choosing a showtime, and booking seats. Catalogue, sessions, accounts, and orders come from the Kino XII API.

The interface is in English. Styling is plain CSS (Poppins, with Noto Sans Georgian loaded for Georgian text).

## Features

- **Home.** Featured films, now playing, and coming soon. A signed-in user can request a notification for a coming-soon title.
- **Search.** The header searches film and event titles as you type and opens the matching movie page.
- **Movie details.** Synopsis, age rating, runtime, director, cast, formats, and showtimes grouped by hall. A past showtime stays closed.
- **Sessions.** Showtimes for the next seven days, grouped by film. Filters cover venue, date, format, language, and time of day. Results can be sorted and are paged at 10 films per page. The current filters, sort, and page are kept in the query string (`venue`, `date`, `format`, `language`, `time`, `sort`, `page`).
- **Seat map.** Choosing a showtime opens the purchase dialog: a seat map, adult or child tickets, and up to three seats. Child tickets are blocked on 16+ and 18+ films. A signed-in viewer who is under a 16+ or 18+ rating cannot buy that film.
- **Booking.** Continuing holds the selected seats, then checkout sends the buyer and card details. The confirmation appears only after the order is accepted. An incomplete profile is collected before the hold. A guest can view the map; holding seats requires a signed-in account.
- **Account.** Registration (username, email, password, optional avatar) and login. The account page edits full name, mobile number, date of birth, and avatar, and lists upcoming and past tickets. An upcoming order can be refunded.
- **Booking page.** After payment, the confirmation stored in this browser can be opened again. The page does not look up another person's order.

## Tech stack

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/) 7
- [oxlint](https://oxc.rs/docs/guide/usage/linter)

There is no UI kit and no separate state library. Auth and the purchase dialog use React context.

## API

Requests go to `https://api.kinoxii.redberryinternship.ge/api`.

Documentation: [https://api.kinoxii.redberryinternship.ge/docs](https://api.kinoxii.redberryinternship.ge/docs)

The bearer token is kept in `sessionStorage` for the current tab (`kino-xii-token`). The password is not stored. A confirmed order is also kept in this browser so its confirmation page can be opened again.

| Area | Calls |
| --- | --- |
| Catalogue | `GET /movies/featured`, `GET /movies/now-playing`, `GET /movies/coming-soon`, `GET /movies/{slug}`, `GET /movies/{slug}/sessions`, `GET /search` |
| Sessions | `GET /sessions`, `GET /sessions/{id}`, `GET /filter-options` |
| Account | `POST /register`, `POST /login`, `GET /me`, `PUT /profile`, `POST /logout`, `POST /movies/{id}/notify` |
| Purchase | `GET /sessions/{id}/seats`, `POST /sessions/{id}/holds`, `POST /orders`, `GET /tickets`, `POST /orders/{reference}/refund` |

## Routes

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/sessions` | Sessions, with filter, sort, and page query params |
| `/movies/:movieId` | Movie details and showtimes. `?purchase={sessionId}` opens the seat dialog, then the query is removed |
| `/seats/:sessionId` | Resolves the showtime and redirects to that movie with the purchase dialog open |
| `/account` | Profile and ticket history. Opens login when there is no session, then returns home if still signed out |
| `/booking/:reference` | Confirmation stored in this browser for that reference |

`vercel.json` rewrites every path to `index.html`, so these client routes load on a direct visit when the app is hosted on Vercel.

## Project structure

```text
src/
  auth/         sign-in state
  components/   header, home, sessions, movie, purchase, auth, and account UI
  data/         venue, format, language, time, and sort options
  hooks/        home catalogue, session catalogue, session filters, search
  lib/          session query, dates, purchase rules, age checks, form checks
  pages/        one screen per route
  purchase/     purchase-dialog state
  services/     API client
  styles/       CSS
  types/        shared TypeScript types
```

## Requirements

Node.js and npm. Dependencies are locked in `package-lock.json`.

## Commands

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Typecheck and build for production:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Serve the production build locally:

```bash
npm run preview
```
