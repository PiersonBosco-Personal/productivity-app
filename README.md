# ProductivityApp

A calendar application built on ASP.NET Core and React. Cookie-authenticated, multi-calendar,
with repeating events expanded on read rather than stored as rows.

## What it does

- **Accounts** — register, log in, log out. Cookie-based sessions over ASP.NET Core Identity.
- **Calendars** — create any number of them, each with a colour drawn from a curated palette
  or picked from a constrained hue band. Toggle any of them out of the agenda view.
- **Events** — timed or all-day, with an optional location and notes. Events belong to a
  calendar, and a calendar belongs to a user, so ownership is enforced through the join on
  every read and write.
- **Repeating events** — daily, weekly, or monthly, at any interval, ending on a date or
  never. A series is a single row: occurrences are generated for the window being viewed and
  never written to the database.
- **Week agenda** — a swipeable week strip over a scrolling day-by-day agenda. Multi-day and
  midnight-crossing events show continuation arrows on each day they touch. Times are stored
  in UTC and rendered in the browser's zone.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite, React 19, TypeScript, Tailwind v4, TanStack Query, React Router |
| Backend | ASP.NET Core 10 Web API (`net10.0`), controllers, no views |
| ORM | EF Core 10 with Npgsql, snake_case naming convention |
| Database | PostgreSQL 17 |
| Auth | ASP.NET Core Identity, cookie-based, `Guid` keys |
| Tests | xUnit v3 integration tests over `WebApplicationFactory` + Testcontainers |

## Running it

**Requirements:** .NET 10 SDK, Node 22+, pnpm, Docker, and the EF Core CLI
(`dotnet tool install --global dotnet-ef`).

```bash
# 1. database
cp .env.example .env
docker compose up -d

# 2. api  (from server/ProductivityApp.Api)
dotnet user-secrets set "ConnectionStrings:Default" \
  "Host=localhost;Database=productivity;Username=productivity;Password=local_dev_password"
dotnet ef database update
dotnet run                       # http://localhost:5080

# 3. client  (from client)
pnpm install
pnpm dev                         # http://localhost:5173
```

Open <http://localhost:5173> and register an account.

The Vite dev server proxies `/api` to Kestrel, so the browser sees a single origin and the
auth cookie needs no CORS policy or `SameSite` relaxation. If you change either port, change
it in `client/vite.config.ts` and `server/ProductivityApp.Api/Properties/launchSettings.json`
together.

## Tests

```bash
cd server
dotnet test
```

Integration tests boot the real application in memory and run it against a throwaway
Postgres container, so Docker must be running. They cover authentication, per-user ownership
of calendars and events, the calendar-ownership check on event creation, half-open range
boundaries, and recurrence expansion.

The client's pure helpers carry self-checks that need no test framework:

```bash
cd client/src
node --experimental-strip-types lib/datetime.check.ts
```

## API

All routes require an authenticated session except register and login.

| Method | Route | |
|---|---|---|
| `POST` | `/api/auth/register` | create an account and sign in |
| `POST` | `/api/auth/login` | |
| `POST` | `/api/auth/logout` | |
| `GET` | `/api/auth/me` | current user, or 401 |
| `GET` | `/api/calendars` | |
| `POST` | `/api/calendars` | |
| `GET · PUT · DELETE` | `/api/calendars/{id}` | |
| `GET` | `/api/events?from=&to=&calendarId=` | occurrences overlapping the window |
| `POST` | `/api/events` | |
| `GET · PUT · DELETE` | `/api/events/{id}` | |

OpenAPI is served at `/openapi/v1.json` in development.

## Design notes

**Ownership through the calendar.** There is no `user_id` on `events`. The filter is
`.Where(e => e.Calendar.UserId == userId)`, which EF turns into a join — one source of truth
for who owns what, at the cost of a join per query. The calendar id arrives in the request
body on create and update, so both paths re-check it.

**Half-open time ranges.** `ends_at_utc` is exclusive, so a 9–10 event and a 10–11 event do
not overlap. Window queries use `starts < to && ends > from` — overlap, not containment. A
`ck_events_end_after_start` check constraint backs the API-side validation.

**Recurrence is expanded on read.** A series is one row: a first occurrence plus frequency,
interval, and an optional exclusive end. `RecurrenceExpander` produces the occurrences that
fall in the requested window, and the request window is capped at 366 days so that work is
always bounded. Monthly occurrences are advanced from the original start rather than the
previous occurrence, so a series on the 31st clamps to 28 February and then returns to 31
March instead of drifting.

**UTC everywhere.** All timestamps are stored UTC and rendered in the browser's zone. Npgsql
maps them to `timestamptz` and rejects ambiguous local-kind values at write time.

**Integration tests over unit tests.** The controllers are thin over EF Core and Identity;
what is worth asserting is HTTP-level behaviour, so the tests exercise the real pipeline
against a real database.

## Layout

```
client/                      React SPA, organised by feature
  src/features/              auth · calendars · events · calendar (agenda)
  src/lib/                   date, colour, and recurrence helpers + self-checks
server/
  ProductivityApp.Api/       Controllers · Data · Models · Services · Migrations
  ProductivityApp.Tests/     xUnit v3 integration tests
docker-compose.yml           Postgres; the API runs on the host
```

## Roadmap

- `EventOverrides` — cancel or edit a single occurrence of a series, keyed by its original
  start
- Time-zone-aware series, so a repeating event keeps its wall-clock time across a
  daylight-saving change
- Tasks, alongside events
- An assistant that can read and edit the calendar through tool calls
