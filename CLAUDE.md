# PeakFormBio — project notes

## Tech / data
- **Do NOT use Supabase.** The user does not use Supabase. Do not reference a Supabase
  client, `sb.from(...)`, or Supabase auth in new deliverables. Model data with plain
  JS objects / localStorage stubs in previews, and keep persistence layer-agnostic
  (a generic `api`/`store` interface the user can wire to their own backend).
- Weight is stored in **lb** (e.g. `weigh_ins.weight_lb`); convert for display.

## Design system
- Dark theme: canvas `#0a0a0a`, cards `#161617`, hairline `rgba(255,255,255,0.08)`,
  text `#f5f5f7`, action blue `#0066cc` / on-dark sky `#2997ff`.
- SF Pro / Inter stack. Tokens in `colors_and_type.css`.
- Preview files follow the `*-preview.html` pattern: mount a JSX component on a
  localStorage-backed stub, with a banner + top tabs.

## File layout rule
- **All JSX/JS app files live in `deploy/` only** — never duplicate them in root.
- Preview HTMLs stay in root but reference files as `src="deploy/filename.jsx"`.
- When creating new features, write the JSX/JS directly into `deploy/` and reference from there in the preview.
