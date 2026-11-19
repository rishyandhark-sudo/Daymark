# Development Progress — Daymark

## Current state: two-section daily journal complete + UI improvements — awaiting review

The journal has been rebuilt around a strict **TARGET / HAPPENED** model with timezone-aware,
server-enforced permissions. This dedicated feature phase is complete and is **stopped for review**:
do **not** deploy and do **not** begin unrelated work until it is approved.

---

## What is built

### The two sections

Every date has two **separate, independent records** that are never mixed or overwritten:

| Section | Editable when | Fields |
| --- | --- | --- |
| **TARGET** (planned) | Current and future dates only. Permanently read-only from 00:00 the next local day. | Title, short description, multiple planned activities, category, expected duration, topics, planned coding problems, reference links, optional priority. |
| **HAPPENED** (actual) | Past dates only. Locked during its own date, unlocks at 00:00 the next local day. | Completed activities, actual category/description/topics/time, problems, links, accomplishments, challenges, lessons/reflection. Can exist without a TARGET. |

- Autosaved local drafts are a convenience only; the authoritative permission check happens in the
  shared time module and in Cloud Functions.
- The drawer shows each section's lock reason ("Editable until 11:59 PM…",
  "Locked at 11:59 PM…", "Opens at 12:00 AM the next day", "Past date · editable").

### Timezone and permission rules

- `shared/time.ts` is the single source of truth for timezone resolution and permissions, used by
  the app, Cloud Functions and tests.
- Rule: `target = date >= todayKey`, `happened = date < todayKey`, where `todayKey` comes from the
  **authoritative server instant** in the effective timezone. Frontend disabled states are not a
  security control.
- Timezone precedence for an existing record: its own frozen timezone → the other section's frozen
  day timezone → the current profile timezone. Changing the profile timezone never reopens or
  re-locks an existing day.
- Profile timezone is a validated IANA selector, default `Asia/Kolkata`.
- The header button is **Open today** and uses the server-derived `todayKey`.

### Calendar and navigation

- Calendar is the primary screen: truncated target title plus two distinct subtle indicators
  (indigo dot = TARGET, emerald square = HAPPENED) with a legend.
- Desktop: 580 px side drawer. Mobile: full-screen editor (`w-full`, `sm:w-[580px]`).
- Only two nav screens remain: **Journal** and **Progress**. Auth, registration, and the profile
  modal are unchanged.

### Comparison and analytics

- TARGET vs HAPPENED comparison uses **explicit user links only** (`linkedTargetActivityId`).
  Similar titles are never auto-matched.
- Completion status ("completed" / "partial" / "not-completed") is derived from linked minutes and
  solved problems, not title similarity.
- Progress analytics are derived from **HAPPENED records only**; planned work never counts as
  completed work. Existing analytics components are otherwise preserved.

### Backend and security

- Firestore paths: `users/{uid}/days/{YYYY-MM-DD}/target` and `.../happened`.
- Callables in `functions/src/index.ts`: `getServerTime`, `saveTarget`, `deleteTarget`,
  `saveHappened`, `deleteHappened`. They require auth, re-validate all payloads with the shared
  Zod schemas, use server `new Date()`, apply frozen-timezone precedence, and serialize timestamps
  to ISO strings.
- `firestore.rules` allows owner reads but **denies every direct client write** to day sections —
  all writes go through the callables.
- `firebase.json` declares the rules and functions source.

### Data migration

- Legacy Phase 1 entries migrate to **HAPPENED only** via `DEFAULT_TIME_ZONE`; no TARGET is invented.
- Fresh installs use `getMockDays()` with realistic two-section seed data.
- Old single-entry drawer/form/view components were removed.

---

## Verification performed

- `npm run typecheck` — passes.
- `npm test` — **22 tests pass** across 4 files:
  - `tests/time.test.ts` — permission matrix, save/delete, exact midnight boundary, timezone
    changes, frozen record timezone, authoritative decision metadata.
  - `tests/schema.test.ts` — valid/invalid payloads, duration/category limits, explicit links only.
  - `tests/dayService.test.ts` — service-level permission guards, per-record timezone freezing,
    TARGET/HAPPENED independence.
  - `tests/comparison.test.ts` — no title auto-matching, explicit-link completion/partial status.
- `npm run build` — passes; Progress is code-split into its own chunk.
- `functions npm run typecheck` — passes.
- Browser review (demo account, dev server at `http://localhost:5173`):
  - Calendar shows target titles and both indicators; future TARGET-only, today TARGET-only, past
    HAPPENED-only and past both-section days render correctly.
  - Today: TARGET editable, HAPPENED locked. Past: TARGET locked, HAPPENED editable. Future:
    TARGET editable, HAPPENED locked.
  - Edit → change title → Save persists to storage and returns to read mode; delete removes the
    record; local drafts are cleared after save.
  - HAPPENED editor link dropdown lists only planned activities; unlinking an identically-titled
    activity changes the comparison to "Not completed" and moves it to "unlinked", confirming no
    title auto-matching.
  - Comparison card renders planned/actual duration, problems, activities and per-activity status.
  - Progress renders from HAPPENED data; profile timezone change persists; header shows "Open today".
  - No console errors on any tested screen. Demo data was reset to a clean state afterward.

### Limitations / not verified

- Production callables and Firestore rules were **not exercised**: no Firebase project credentials
  are configured, and nothing was deployed.
- Local demo uses `getServerClock()` with the browser `new Date()` only because there is no backend
  configuration; it is documented as demo-only, not a security boundary.
- Mobile-specific verification is limited to the implemented responsive classes and the
  full-screen drawer implementation; the available browser tool cannot emulate a phone viewport.
  Please check visually during review.
- `functions npm install` reports 8 moderate-severity npm audit advisories, all transitive from
  `firebase-admin` through `uuid <11.1.1`; the only offered fix is a breaking major upgrade to
  `firebase-admin@14.5.1`, so it is deliberately deferred. `functions npm run build` passes. The web
  build also warns about chunks larger than 500 kB. Neither blocks this feature.

---

## Phase status

| Item | Status |
| --- | --- |
| Two-section TARGET / HAPPENED model | **Complete — awaiting review** |
| Timezone-aware, server-enforced permissions | **Complete — awaiting review** |
| Cloud Functions callables + Firestore rules | **Complete (not deployed)** |
| Calendar / drawer / comparison / Progress UI | **Complete — awaiting review** |
| Permission and midnight test coverage | **Complete (22 tests)** |
| Deployment | **Not started — no deployment without approval** |

---

## How to review

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, choose **Explore with demo account**, and review:

1. Journal calendar indicators and the "Open today" button.
2. A future date, today, and a past date in the drawer — check the TARGET/HAPPENED lock states.
3. Editing, saving and deleting a TARGET.
4. A past date with both sections — expand a HAPPENED activity, change its explicit link, and watch
   the comparison update.
5. Progress (HAPPENED-only analytics) and the profile timezone selector.

To reset demo data, clear site storage in the browser.

Key files:

- `shared/` — authoritative time rules, domain constants, shared payload schemas.
- `src/types/index.ts` — two-section record types and profile timezone.
- `src/services/dayService.ts` — local/cloud day storage, permissions, drafts, migration.
- `src/context/JournalContext.tsx` — server clock, day maps, permissions, async mutations.
- `src/components/journal/` — DayDrawer, SectionPanel, editors, summary, comparison.
- `src/components/calendar/` — month view and date-cell indicators.
- `src/pages/Journal.tsx`, `src/pages/Progress.tsx`.
- `src/services/analyticsService.ts` — HAPPENED-only analytics.
- `src/components/profile/ProfileModal.tsx` — IANA timezone selector.
- `src/components/layout/Header.tsx` — server-time "Open today".
- `functions/src/index.ts`, `firestore.rules`, `firebase.json` — backend and security.
- `tests/` — permission matrix, midnight transition, schema, service guards, comparison.

---

## UI improvements — completed

These changes were added without rebuilding the TARGET/HAPPENED model, changing permissions,
touching analytics inputs, or altering authentication and navigation.

### 1. Compact contribution heatmap

- `src/components/analytics/ContributionHeatmap.tsx` now uses fixed 12 px squares with 3 px gaps
  instead of fluid `aspect-square` cells, plus a slim weekday column, month labels aligned to
  week columns, and a smaller legend.
- Date tooltips (date + recorded duration) and all existing heatmap data are unchanged.
- The surrounding Progress card keeps its reduced padding; the heatmap no longer dominates the
  two-column row.

### 2. Theme switch

- `src/services/themeService.ts` persists `light` / `dark` under `daymark:theme:v1`.
- `src/context/ThemeContext.tsx` applies the `dark` class to `<html>`, updates `color-scheme` and
  the browser `theme-color`, and exposes `useTheme()`.
- The header button (`Sun` / `Moon`) toggles the theme immediately; the choice survives refresh.
- `index.html` applies the stored theme with an inline script before styles load, preventing a
  flash of the wrong theme.
- `tailwind.config.js` maps `surface` and the slate palette through CSS variables in
  `src/index.css`, so Journal, Progress, Calendar, editors, drawers, dialogs, charts, forms and
  profile screens all adapt together. The indigo accent is unchanged; status tints become
  translucent in dark mode.

### 3. Multi-colour daily learning graph

- `buildDailyLearningData()` in `src/services/analyticsService.ts` builds one cumulative curve per
  subject from a day's **HAPPENED** activities. X is cumulative minutes in recorded activity
  order (no start/end timestamps exist in the model, so no clock times are invented); Y is each
  subject's running total. Multiple activities in a category accumulate into that category's
  curve; TARGET durations are never passed in.
- `src/components/analytics/DailyLearningGraph.tsx` uses the existing Recharts dependency for
  smooth monotone areas with subtle transparency, per-category colours from `CATEGORY_COLORS`
  (deterministic fallback for custom categories), a compact legend, tooltips with subject,
  duration and elapsed time, minimal axes/gridlines and theme-aware styling. Data changes animate.
- Placement: compact version inside the HAPPENED details in the day drawer
  (`SectionSummary.tsx`), and a full version with a date selector on Progress (`Progress.tsx`).
  A clean empty state is shown for days with no timed activities.
- `LazyDailyLearningGraph.tsx` keeps Recharts in a separate chunk so journal startup stays light.

### Tests and verification for this phase

- Added `tests/dailyLearning.test.ts` (6 tests): DSA 120 / AI/ML 30 separation, multiple activities
  in one category, recorded-order timeline, empty/zero-minute handling, stable custom colours, and
  theme persistence.
- `npm run typecheck`, `npm test` (**37 tests across 6 files**), and `npm run build` pass.
- Browser verification: compact heatmap, theme toggle + refresh persistence, graph for
  DSA = 120 / AI/ML = 30, same-category accumulation, edits/deletes updating the graph, and
  desktop/mobile layouts were checked in the in-app browser.

## Next step

**Stop here for review.** Do not deploy, commit or push without approval. After approval, the
remaining product work (e.g. public profile at `/u/username`, deployment) can be planned as a
separate phase.
