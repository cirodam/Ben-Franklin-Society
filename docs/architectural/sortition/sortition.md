# Sortition System

Sortition is the mechanism by which members are randomly selected ("drawn by lot") to fill seats in the General Assembly and in committees. This document describes the data model, rules, and implementation plan.

---

## Concepts

### Sortition bodies

Any association of type `general_assembly` or `committee` is a **sortition body** — a group defined by a fixed number of seats filled through lottery rather than election or appointment.

| Body type | Pool | Permanence |
|---|---|---|
| `general_assembly` | Whole community (all active persons) | Always permanent |
| `committee` | A single source college, or the whole community if none | Permanent or ad hoc |

### Seats

A sortition body has a fixed number of **seats**, numbered 1 through N. Each seat always exists as a record in the database once the body is configured. Seats are never deleted; they may simply be vacant (no active `seat_term`).

### Terms

Each time a seat is filled by sortition, a **seat term** record is created linking the seat to a person. Terms have a defined start date and a calculated end date (`started_at + term_days`). A term can be vacated early if the seat holder resigns or is removed.

### Sortition draw

A **sortition draw** is the lottery event that fills one or more seats. The app:
1. Queries the eligible pool (college members, or all active persons for GA).
2. Excludes anyone currently holding a seat in that body (no double-seating).
3. Randomly shuffles the pool and picks one person per vacant seat.
4. Records the draw and creates seat terms for each filled seat.

The draw is recorded even if no seats are vacant (documenting the pool size for auditing).

---

## Schema

### `sortition_body_config`

Configuration for a sortition body. One row per GA / committee.

```sql
CREATE TABLE IF NOT EXISTS sortition_body_config (
  association_uuid    TEXT PRIMARY KEY REFERENCES association(uuid),
  seat_count          INTEGER NOT NULL,
  term_days           INTEGER NOT NULL,
  is_permanent        INTEGER NOT NULL DEFAULT 1,   -- 0 = ad hoc (committees only)
  source_college_uuid TEXT NULL REFERENCES association(uuid)  -- NULL = whole community
);
```

### `seat`

One row per numbered seat in a sortition body. Created (and never deleted) when the body is configured.

```sql
CREATE TABLE IF NOT EXISTS seat (
  uuid             TEXT PRIMARY KEY,
  association_uuid TEXT NOT NULL REFERENCES association(uuid),
  seat_number      INTEGER NOT NULL,
  UNIQUE (association_uuid, seat_number)
);
```

### `sortition`

A single lottery draw event.

```sql
CREATE TABLE IF NOT EXISTS sortition (
  uuid              TEXT PRIMARY KEY,
  association_uuid  TEXT NOT NULL REFERENCES association(uuid),
  conducted_at      TEXT NOT NULL,
  conducted_by_uuid TEXT NOT NULL REFERENCES person(uuid),
  pool_size         INTEGER NOT NULL,  -- eligible persons at draw time
  notes             TEXT NULL
);
```

### `seat_term`

Records who holds a seat for a given term. Each row is produced by a sortition draw.

```sql
CREATE TABLE IF NOT EXISTS seat_term (
  uuid           TEXT PRIMARY KEY,
  seat_uuid      TEXT NOT NULL REFERENCES seat(uuid),
  person_uuid    TEXT NOT NULL REFERENCES person(uuid),
  sortition_uuid TEXT NOT NULL REFERENCES sortition(uuid),
  started_at     TEXT NOT NULL,
  ends_at        TEXT NOT NULL,  -- started_at + term_days (calendar date)
  vacated_at     TEXT NULL       -- set if holder resigns/removed early
);
```

---

## Relationships

```
association (type: general_assembly | committee)
  └── sortition_body_config   (1:1)
  └── seat[]                  (1:N, count = seat_count)
        └── seat_term[]       (1:N history)
              ├── person
              └── sortition
                    └── association (same body)
```

---

## Business rules

1. A person cannot hold two seats in the same body simultaneously.
2. A person in the eligible pool may decline; the app re-draws randomly from the remainder (handled in UI, not enforced in DB).
3. Ad hoc committees dissolve once their purpose motion is enacted/resolved — dissolution is still handled via `dissolveAssociation`.
4. `association_member` is not used for seat holders — `seat_term` is the authoritative membership for sortition bodies. (The `association_member` table can optionally mirror active seat holders for permission checks, but `seat_term` takes precedence.)
5. When a sortition draw is conducted, all currently vacant seats (no active `seat_term`) are filled in one event, unless the caller specifies fewer.

---

## Code locations

| File | Responsibility |
|---|---|
| `src/lib/server/schema.ts` | DDL for all 4 new tables |
| `src/lib/server/associations.ts` | `SortitionBodyConfig`, `Seat` types; `getSortitionConfig`, `setSortitionConfig`, `createSeats`, `listSeats` |
| `src/lib/server/sortition.ts` | `Sortition`, `SeatTerm` types; `conductSortition`, `getCurrentTermHolders`, `listSortitions`, `vacateSeatTerm` |
| `src/routes/setup/+page.server.ts` | Seed `sortition_body_config` and `seat` rows for GA and committees |

---

## Implementation steps

1. **Schema** — add 4 tables to `schema.ts`.
2. **`associations.ts`** — add `SortitionBodyConfig` / `Seat` types and helper functions.
3. **`sortition.ts`** — create new server module with draw logic.
4. **Setup seeding** — seed config + seats for GA and the 2 committees.
5. **Type-check** — `pnpm exec tsc --noEmit`.

---

## Seed defaults (adjustable via future motions / config UI)

| Body | `seat_count` | `term_days` | `is_permanent` | `source_college_uuid` |
|---|---|---|---|---|
| General Assembly | 12 | 365 | 1 | NULL |
| Agricultural Committee | 5 | 180 | 1 | `agricultural-college` |
| Food Committee | 5 | 180 | 1 | `culinary-arts` |

---

## Future work

- UI: `/general-assembly/sortition` — conduct a draw, view past draws, seat roster
- UI: `/committees/[uuid]/sortition` — per-committee draw page
- Vacate seat action (resign / remove)
- Ad hoc committee termination flow tied to a motion
- `association_member` sync from `seat_term` (for permission checks)
