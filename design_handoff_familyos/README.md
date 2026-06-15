# Handoff: FamilyOS v2 — Weekly Screen-Time Economy ("Editorial" design)

## Overview
FamilyOS v2 turns each child's weekly responsibilities (music practice, homework) into earned **screen-time minutes**. A kid taps *"I did it"* on a task → it waits as **pending** until the parent approves → hitting a weekly target pays a lump of minutes (capped at **2 hours / 120 min per week**). The week is browsable (past / current / next) with a 7-day activity calendar. Every Monday the cycle resets.

This package documents the chosen **"Editorial"** visual direction: confident big type, a warm cream paper background, one vermilion accent, and **custom hand-drawn line illustrations** (no emoji). It is one responsive app with three surfaces: **Home (profile switch)**, **Kid dashboard**, **Parent dashboard**, plus **PIN** and **earn-celebration** overlays.

## About the Design Files
`design_files/FamilyOS Editorial.dc.html` is a **design reference / working prototype**, not production code. It's authored in an in-house "Design Component" format (a single class rendered with `React.createElement`, plus a `support.js` runtime). **You do not need that runtime.** Open the file in a browser to see and click the real app; read the class to extract exact values. This README is self-sufficient.

**Your task:** recreate this in the target stack. Per the PRD (§9): **Next.js 16 (App Router) + React 19, Prisma 5 + a fresh Neon Postgres, Tailwind v4, Server Actions for mutations, Vitest** for the economy logic, deployed to **Vercel**. Build it as a clean, installable, responsive **PWA** (web now; native iPad later — keep the data model simple and client state clean).

## Fidelity
**High-fidelity.** Final type, colour, spacing, illustrations, and interactions are specified below. Reproduce them through Tailwind tokens / your component library rather than copying inline styles.

---

## Responsive behaviour (important)
The app is **full-viewport and width-responsive** around a single breakpoint: **`wide` = viewport ≥ 880px**.

- **Narrow (< 880px) — phone / iPad portrait:** every surface is a single scrolling column.
- **Wide (≥ 880px) — iPad landscape / desktop web:**
  - **Home:** the 3 profile cards become a 3-column grid, vertically centered, max-width ~1080px.
  - **Parent:** a **two-pane** layout — left = approvals queue + recent activity; right (with a hairline divider) = both kids' weekly progress. Max-width ~1120px.
  - **Kid:** currently a centered single column (max-width ~640px). *(A landscape split-view — calendar/balance on the left, task list on the right — is the planned next enhancement.)*

Implement with your framework's responsive system (CSS media/container queries). The prototype switches on `window.innerWidth`; production should prefer container/media queries.

---

## Screens / Views

### 1. Home — "Who's here?"
**Purpose:** anyone taps a profile. Kids open their dashboard directly; tapping **Mum** requires the **parent PIN**.
- Eyebrow `TUESDAY · WK 24` (12px/700, uppercase, letter-spacing .14em, muted `#97907F`). Title **"Who's here?"** (40px narrow / 52px wide, Space Grotesk 700, letter-spacing −0.02em, ink `#1A1510`).
- **Profile card** (button): cream `#FAF7F1`, **1.5px solid ink border**, radius 18px, and a signature **hard offset shadow `4px 4px 0 #1A1510`**. Layout: 66px round avatar + name (24px/700) over role (Nunito 13px/700 muted) + right-aligned stat (30px/700 vermilion `#E8503A`) over a tiny uppercase label.
  - Kid stat = minutes left to use this week (`mins to use`). Mum stat = count of pending approvals (`to check`).
- Footer hint (Nunito 13px/700, faint `#B8B0A2`): "A grown-up needs a PIN to approve".

### 2. Kid dashboard
**Purpose:** browse weeks, see minutes gained, log tasks, redeem.
- **Top bar:** a square back button `‹` (42px, 1.5px ink border, radius 11px) + `MY WEEK` eyebrow.
- **Header:** 46px avatar + kid name (22px/700).
- **Week picker:** `‹` / `›` nav buttons (40px, 1.5px border; disabled state border `#E0D9CC`, faint glyph) flanking the centered week **label** (17px/700, e.g. "Jun 15 – 21") + **tag** (Nunito 12px/800 uppercase; colour = vermilion for *This week*, muted for past, faint for *Next week*).
- **7-day calendar strip:** a `#F3ECDF` rounded panel (radius 14) with a 7-col grid. Each day cell: weekday letter (Nunito 10px/800) + date (15px/700) + an activity dot. States:
  - `done` (a day with activity) → vermilion dot.
  - `today` → cell gets `inset 0 0 0 2px ink` ring.
  - `todayDone` → solid ink cell, white date, vermilion dot.
  - `none` / `ahead` (this week, future days) → muted, no dot. `muted` (whole future week) → faint.
- **Hero:** huge **minutes-gained** number (84px, Space Grotesk 700, letter-spacing −0.05em) + stacked label "minutes / gained" (14px/600 uppercase vermilion). Below: a 6px progress track (`#EDE7DB`) filled vermilion to `gained/120`, with a 1.5px ink rule above the hero. Caption row: `<gained> of 120 mins` · `max 2 hrs / week`.
- **Tasks** (label `TASKS`): each row = 48px rounded tile (`#F3ECDF`, or green `#EAF3EE` when earned) holding the **custom illustration**, the task title (17px/600, ellipsis), progress, and an action:
  - **Tally** (instruments): a row of 16px rounded squares — filled ink when approved; **1.5px dashed vermilion** when pending; **1.5px dashed `#D8CDBA`** when empty.
  - **Bar** (homework): 8px track `#EDE7DB`, ink fill to `approved/target`.
  - Action: not-earned & no pending → **"I did it"** (ink button, white, radius 8). Pending → **"checking"** pill (vermilion on `#FCEADF`). Earned → green check chip + `+<reward>`. Past & unfinished → muted "not finished".
- **Footer:** current week → **"Use screen time →"** (vermilion button, 54px) + caption `<left> mins left to use this week`. Past week → "Week finished · N mins gained". Future → "This week hasn't started yet".

### 3. Parent dashboard — "Mum's desk"
- Top bar `PARENT` + back, and an **Unlocked** chip (green on `#EAF3EE`) once past the PIN.
- Header: 46px Mum avatar + "Mum's desk" (24px/700) + "This week · Jun 15–21".
- **To check** (queue): one row per pending task — illustration tile + `Kid · Task` + `+<reward> mins when finished`, with a reject **✕** (1.5px border) and **Approve** (green `#3E8E6E`) button.
- **This week:** per kid — avatar + name + `<gained> gained` (vermilion), each task as a mini illustration + label + `approved/target` (or `✓ +reward`) + a 6px progress bar (ink, green when earned), then **+15 bonus** / **−15** adjust buttons.
- **Recent:** activity log rows — `Kid · text`, time, and a signed amount (`+60m` green earn, `−15m` redeem, `±` adjust).

### 4. Earn celebration  ← now on the KID's screen
When an approval crosses a target, the earned minutes are queued for that child and the celebration plays **on the kid's dashboard** (not the parent's). Full-bleed vermilion scrim + ~16 falling confetti pieces + a cream card: eyebrow `<Name> earned`, big `+<mins>` (88px/700 vermilion), "minutes of screen time", "<Task> complete", and a **Nice!** button. Tap anywhere to dismiss.

### 5. PIN gate
Opens when Mum is selected while locked. Ink scrim, cream card: "Parent PIN", 4 dots, a 3×4 keypad (digits + ⌫). Correct PIN (placeholder **1234**) unlocks and proceeds to the parent view. Unlock persists for the session.

---

## Interactions & the economy (unit-test this)
- **Task**: belongs to a kid + a week; has `title`, `kind` (drum/guitar/book/pencil → illustration), `display` (`tally`|`bar`), `target`, `reward`, and tracked `approved` + `pending`.
- **Log (kid):** `pending += 1`; marks today active on the calendar. Never self-approves.
- **Approve (parent):** `pending −= 1`, `approved += 1`. If this crosses the target (`wasApproved < target && approved ≥ target`) → award `reward` once and **queue the celebration for that kid**. Awarded **once per task per week**.
- **Reject:** `pending −= 1` (discarded).
- **gained** = Σ `reward` for tasks where `approved ≥ target`, per week. **weeklyMax = 120 (2 h)**; the ring/bar fill is `gained/120`.
- **left to use** = `gained − redeemed + adjust`, clamped ≥ 0 (current week only).
- **Redeem (kid):** `redeemed += min(chosen, left)`; can't exceed `left`; options 15/30/60.
- **Adjust (parent):** `adjust += ±15` with a history entry. PIN-gated (gated at parent-view entry).
- **Weekly reset:** Monday, **Europe/London** *(confirm)*; `approved`/`pending`/`redeemed`/`adjust` reset; **no rollover**; prior weeks remain viewable.
- **PIN:** gates entry to the parent view (placeholder 1234; confirm whether required at launch).
- **Motion:** ring/bar `width/stroke` 300ms ease; celebration card `fos-pop` 340ms; confetti `fos-fall` ~1.8–3.4s. Keep calm (≤ ~400ms).

## State Management
Suggested model (mirror in Prisma):
```
Kid        { id, name }
Task       { id, kidId, title, kind, display:'TALLY'|'BAR', target, reward, active }
Completion { id, taskId, kidId, weekStart, status:'PENDING'|'APPROVED'|'REJECTED', createdAt, approvedAt }
Ledger     { id, kidId, weekStart, type:'EARN'|'REDEEM'|'ADJUST', minutes(+/-), note, createdAt }
Settings   { parentPin (nullable), timezone:'Europe/London' }
```
Per kid + week derive: `approved`/`pending` per task, `gained`, `left`, `redeemed`, `adjust`. Mutations are **Server Actions**; recompute server-side. Client-only UI state: selected view/profile, current week index, redeem sheet, PIN entry, parent-unlocked session flag, and a per-kid "pending celebration" payload to play on next kid-view open.

---

## Design Tokens

### Colour
| Token | Hex | Use |
|---|---|---|
| Paper (bg/surface) | `#FAF7F1` | App background, cards |
| Ink | `#1A1510` | Headings, borders, primary text, dark buttons |
| **Accent (vermilion)** | `#E8503A` | The one accent — CTAs, numbers, dots, pending |
| Accent tint | `#FCEADF` | Avatar bg, "checking" pill, soft chips |
| Tile | `#F3ECDF` | Illustration tiles, calendar panel |
| Hairline | `#EAE3D6` | Row separators, dividers |
| Soft track | `#EDE7DB` | Progress track |
| Muted | `#97907F` | Secondary text / labels |
| Faint | `#B8B0A2` / `#C9C1B2` | Tertiary, disabled |
| Disabled border | `#E0D9CC` | Inactive nav/keys |
| Success (earn) | `#3E8E6E` | Approve, earned, green check; tint `#EAF3EE` |
| Face fill | `#FFF6EC` | Avatar/illustration interior |

### Typography
- **Display / UI:** **Space Grotesk** (400/500/600/700) — headings, numbers, buttons.
- **Meta / labels:** **Nunito** (600/700/800) — small captions, tags, roles, history.
- Both via Google Fonts CDN in the prototype.
- Scale: kid hero **84px/700** (letter-spacing −0.05em); celebration **88px/700**; home title **40–52/700**; profile name / section title **22–24/700**; body **16–17/600**; eyebrows/labels **12–13/700–800 uppercase**, letter-spacing **.14em**.

### Spacing / Radius / Shadow
- Spacing ~8-pt: 4 / 6 / 8 / 12 / 14 / 18 / 22 / 26 / 32 px. Screen padding 26px (narrow), 30–32px (wide panes).
- Radius: tally dot 5px · buttons 8–11px · cards/tiles 13–14px · calendar panel 14px · pills 999px.
- Signature shadow: **hard offset `4px 4px 0 #1A1510`** on home profile cards. Overlays: scrims `rgba(26,21,16,.4–.45)`; modal card `0 24px 60px rgba(0,0,0,.25–.3)`.
- Borders are a deliberate **1.5px solid ink** on interactive/structural elements (editorial line feel).

## Assets / Illustrations
**No emoji.** Each task uses a **custom inline-SVG line illustration** in the ink + vermilion language (24×24 viewBox, ~2.4 stroke, round caps): **drum, guitar, book (homework), pencil (maths)**. Avatars (Tyler, Riley, Mum) are simple flat line portraits — tint circle + head + neat hair + dot eyes + smile + soft cheek blush; hair distinguishes them. All SVG source is inline in the design file (`this.SVG` and `this.AV`); reproduce them as SVG components. Icons elsewhere can use any consistent outline set; no external/branded image assets are required.

### Seed data & placeholders (confirm with Oliver — PRD §10)
| Kid | Tasks | Target | Reward |
|---|---|---|---|
| Tyler | Drums (tally) · Chinese (bar) · Maths (bar) | 4× / 5 / 5 | 60 / 30 / 30 |
| Riley | Guitar (tally) · Chinese (bar) · Maths (bar) | 4× / 5 / 5 | 60 / 30 / 30 |

Weekly cap **120 min (2 h)**. Parent **PIN = 1234**. Reward values, homework goal counts, rollover (none), timezone (Europe/London), award walk-back, and whether redemptions need parent confirmation are **open questions in PRD §10**.

## Files
- `design_files/FamilyOS Editorial.dc.html` — the full interactive prototype (all surfaces, economy, week browser, responsive layouts, celebration, PIN). **Source of truth for exact values.**
- `design_files/support.js` — in-house runtime (reference only; not needed in the target app).
- `../PRD.md` — full product requirements.

Open the HTML and try: tap **Tyler** → **I did it** → back → **Mum** (PIN **1234**) → **Approve** → back → **Tyler** (celebration plays) → **Use screen time**. Resize the window to see the responsive Home grid and Parent two-pane.
