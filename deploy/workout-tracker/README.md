# Workout Tracker — PeakFormBio

Athlete-facing workout logger + Jefit-style exercise database, plus a desktop
coach console. Built to drop into the existing PeakFormBio app. Dark theme, SF/Inter,
action-blue `#0066cc` / sky `#2997ff` — matches `colors_and_type.css`.

> **No Supabase.** Persistence is backend-agnostic. The only integration hook is
> `onSaveSession(session)` and the props you pass in — wire them to your existing
> `api-client.js` / `db.js` / `server.js`.

---

## Files

| File | What it is | Ship to prod? |
|------|-----------|---------------|
| `exercise-db.js` | 59-exercise library (muscles, equipment, instructions, tips) + `exerciseByName/ById` helpers. Sets `window.EXERCISE_DB`, `window.MUSCLE_LABELS`. | ✅ |
| `wt-musclemap.jsx` | `<MuscleMap>` front/back muscle-target avatar. | ✅ |
| `wt-ui.jsx` | Shared kit: `WTCtx` (accent/unit/RPE), icons, demo-media placeholder, charts, sheets, weight helpers (`WTUtil`). | ✅ |
| `wt-active.jsx` | `<ActiveWorkout>` — live set logging (previous values, tap-to-complete, auto-fill, PR detect). | ✅ |
| `wt-library.jsx` | `<ExerciseLibrary>` + `<ExerciseDetail>` (how-to / muscles / history). | ✅ |
| `wt-screens.jsx` | `<TodayScreen>`, `<HistoryScreen>`, `<ProfileScreen>`, `<FinishSummary>`. | ✅ |
| `wt-app.jsx` | `<WorkoutTracker>` shell — nav, active-session state, rest timer, and **`window.WTData`** (all pure data helpers). | ✅ |
| `wt-coach.jsx` | `<CoachAdmin>` — desktop coach dashboard. | ✅ |
| `ios-frame.jsx` | iPhone bezel — **demo only**. In `ClientPortal` the real device is the frame; don't ship this. | ⚠️ demo |
| `workout-tracker-preview.html` | Standalone demo harness (seeds data + fakes the backend in `localStorage`). Reference only. | ⚠️ demo |

Load order matters (later files use `window.*` from earlier ones):
`exercise-db.js` → `wt-musclemap` → `wt-ui` → `wt-active` → `wt-library` → `wt-screens` → `wt-app` → `wt-coach`.

---

## Athlete side — mount in `ClientPortal.html`

```jsx
<WorkoutTracker
  plan={activePlan}        // the client's active workout_plans row { goal, title, plan_data:[7 days] }
  sessions={loggedSessions}// array of past workout_sessions (see shape below)
  athlete={{ name, goal }} // display only
  config={{ accent:'#2997ff', unit:'lb', showRpe:true }}
  onSaveSession={async (session) => {
    await api.createWorkoutSession(session);   // <-- your endpoint, NOT supabase
  }}
/>
```

`plan.plan_data` is the exact 7-day shape your **Workout Editor / Builder** already
produce, so a coach-assigned plan flows straight in. Exercise names resolve against
`exercise-db.js` via `exerciseByName()`.

The in-progress workout autosaves to `localStorage` (`pfb_wt_active`) so a mid-gym
refresh doesn't lose the set. Only **finished** workouts hit `onSaveSession`.

## Coach side — mount in `Admin.html`

```jsx
<CoachAdmin
  sessions={clientSessions}     // that client's workout_sessions
  plan={clientPlan}             // their active workout_plans row
  athlete={{ name, goal }}
  clients={roster}              // [{ id, name, status }] for the sidebar
/>
```

---

## The one new store you need: `workout_sessions`

A finished `session` passed to `onSaveSession` looks like this (weights in **lb**,
matching `weigh_ins.weight_lb`):

```js
{
  id: 'sess-…',
  date: '2026-06-01T18:30:00.000Z',   // ISO
  title: 'Push · Chest, Shoulders, Triceps',
  durationSec: 3120,
  totalVolumeLb: 10470,
  prs: [ { name:'Barbell Bench Press', weightLb:185, reps:6 } ],
  exercises: [
    { name:'Barbell Bench Press',
      sets: [ { weightLb:185, reps:6, pr:true }, { weightLb:175, reps:8, pr:false } ] }
  ]
}
```

Suggested table (adapt to your DB layer):

```sql
create table workout_sessions (
  id              text primary key,
  client_id       uuid not null,
  date            timestamptz not null,
  title           text,
  duration_sec    integer,
  total_volume_lb numeric,
  prs             jsonb,      -- [{name, weightLb, reps}]
  exercises       jsonb,      -- [{name, sets:[{weightLb, reps, pr}]}]
  created_at      timestamptz default now()
);
```

Add `api.createWorkoutSession(s)` (insert) and `api.listWorkoutSessions(clientId)`
(select, newest first) to `api-client.js`, and the matching route in `server.js`.
That's the whole backend surface.

---

## Display config
- **Units** — stored as lb; `config.unit:'kg'` converts on display only.
- **Accent / RPE column** — `config.accent`, `config.showRpe`. In the demo these are
  the Tweaks panel; in prod pass whatever you like (or read from client prefs).

## Exercise demo media
Each exercise renders a labelled placeholder (`<WTDemo>` / `<WTThumb>`), keyed by
exercise `id`. Swap in real photos/GIFs by giving each `EXERCISE_DB` entry a
`media` URL and rendering it in those two components.

## Try it
Open `workout-tracker-preview.html` to see everything running on seeded demo data.
