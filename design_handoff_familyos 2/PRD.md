# FamilyOS v2 — Weekly Screen-Time Economy
## Product Requirements Document

**Status:** Draft for design handoff
**Author:** Oliver
**Date:** 2026-06-15
**Audience:** Design (Claude Design will flesh out UI/UX), engineering
**Platform:** Web app now → iOS app optimized for iPad later

> This PRD is a complete rewrite of the original FamilyOS (a task/reward app with video proof). The old app and its data are being retired entirely. Nothing from v1 carries forward except the project name.

---

## 1. Executive Summary

We're building **FamilyOS v2**, a single-family web app that turns each child's weekly responsibilities (music practice, homework) into earned **screen-time minutes**. Each kid has a set of weekly **task targets**; hitting a target awards a lump sum of minutes into that kid's **weekly screen-time balance**, which they draw down as they use screens. A parent approves completions and sets the rules. The goal is to make the "do your work before screen time" rule visible, fair, and self-evident to the kids — replacing nagging with a balance they can see and control.

---

## 2. Problem Statement

### Who has this problem?
A single household: one parent (Mum) and two children, **Tyler** and **Riley** (primary-school age), who each have recurring weekly commitments and access to screens.

### What is the problem?
The household rule is "complete your tasks before you get screen time," but today this is enforced verbally and informally. There is no shared, visible record of:
- whether each kid has done their required practice and homework this week,
- how much screen time they've therefore earned, and
- how much they have left.

This creates repeated negotiation, inconsistent enforcement, and disputes ("but I *did* do drums!").

### Why is it painful?
- **For the parent:** constant nagging and manual tracking; hard to be consistent and fair across two kids; arguments over what's been done.
- **For the kids:** no clear, motivating picture of progress; screen-time decisions feel arbitrary rather than earned.

### Evidence
This is a personal/household product built from direct knowledge of the family's routine, not market research. The two children and their specific weekly tasks are known and fixed (see Personas and Requirements).

---

## 3. Target Users & Personas

### Primary persona: Parent ("Mum")
- **Role:** Sets the rules, approves completed tasks, grants/adjusts minutes.
- **Goals:** Get kids to reliably do practice + homework; make screen time fair and consistent without daily policing.
- **Behaviors:** Checks the app to approve completions and resolve "did I earn it?" questions; occasionally adjusts targets or minute values.
- **Needs:** Trustworthy record, quick approvals, the ability to override (grant/deduct minutes).

### Primary persona: Child ("Tyler", age-appropriate, ~7–11)
- **Weekly tasks:** Drums 4×/week, Chinese homework (progress toward a weekly goal), Math homework.
- **Goals:** Earn and spend screen time; see clearly how close they are to the next reward.
- **Behaviors:** Logs "I did it" after practice/homework; checks remaining minutes; redeems minutes to use a screen.
- **Needs:** Big, obvious, low-reading-required UI; instant feedback; a satisfying sense of progress.

### Primary persona: Child ("Riley", similar age)
- **Weekly tasks:** Guitar 4×/week, Chinese homework, Math homework.
- Same goals/behaviors/needs as Tyler; differs only in the instrument.

### Jobs-to-be-done
- *When* I've finished my practice, *I want to* mark it done and see my reward grow, *so I can* feel I earned my screen time.
- *When* my child asks for screen time, *I want to* see at a glance whether they've earned it, *so I can* be fair and consistent without an argument.

---

## 4. Strategic Context

### Why now?
The original FamilyOS (video-proof task app) is being retired; this is the replacement built around the family's actual routine. Starting fresh avoids carrying v1's complexity (video capture, rewards catalog) that isn't needed.

### Goals (household outcomes, not business OKRs)
- Kids reliably complete weekly practice and homework targets.
- Screen-time decisions become self-service and dispute-free.
- The parent spends less time tracking and negotiating.

### Platform strategy
- **Phase 1 (this PRD): Web app.** Responsive, works on everyone's phone and on a shared tablet, deployed to the cloud so it's reachable from any device.
- **Phase 2 (future): iOS app optimized for iPad.** The web app is the proving ground; the iPad app is the eventual home-surface. Design decisions made now should not paint us into a corner for iPad (see §10).

---

## 5. Solution Overview

A single-family app with **profile switching** (no login): the home screen lets anyone tap **Mum**, **Tyler**, or **Riley**. Parent-only actions are gated by an optional **parent PIN** so kids can't approve their own work or change the rules.

### The economy, in plain terms
1. Each kid has a fixed set of **weekly task targets** (e.g. Drums 4×, Chinese to goal, Math to goal).
2. A kid taps **"I did it"** to log progress toward a target. Each log is **pending** until the parent approves it.
3. When a task's **approved** progress reaches its weekly target, the kid earns that task's **reward in minutes** (a lump sum — partial progress earns nothing).
4. Earned minutes accumulate in the kid's **weekly screen-time balance**.
5. The kid **redeems** minutes when they use a screen; the balance goes down. A kid cannot redeem more than they have.
6. Every Monday the cycle **resets**: progress and balance start fresh (no rollover of unspent minutes).

### Key screens (to be designed by Claude Design)
- **Home / profile switch** — three big tappable profiles.
- **Kid dashboard** — the kid's current **minutes balance** front and center; each task shown as a tally (e.g. ○○○○ for 4× practice) or a **progress bar** (homework); an **"I did it"** action per task; a **"Use screen time"** redeem action.
- **Parent dashboard (PIN-gated for changes)** — pending-approval queue; each kid's progress and balance; grant/adjust minutes; manage tasks (titles, targets, minute values); set PIN; redemption history.

### User flow (happy path)
`Open app → tap Tyler → tap "I did it" on Drums → log shows pending → (later) Mum opens parent view, enters PIN, approves → on the 4th approved drum log this week, +X minutes posts to Tyler's balance → Tyler taps "Use screen time", redeems 30 min → balance decreases.`

---

## 6. Success Metrics

This is a household tool, so "success" is behavioral, not commercial.

### Primary signal
- **Weekly target completion rate:** % of each kid's weekly targets met. Goal: consistently high (kids actually doing practice + homework).

### Secondary signals
- **Self-service rate:** screen-time decisions resolved in-app without parent arbitration.
- **Approval latency:** time between a kid logging a task and the parent approving (lower is better — keeps motivation tight).
- **Dispute frequency:** anecdotal reduction in "but I did it" arguments.

### Guardrail
- **The app must not become a chore itself** — logging and approving must each take seconds, or the family will abandon it.

---

## 7. User Stories & Requirements

### Epic hypothesis
> We believe that giving Tyler and Riley a visible weekly screen-time balance that they earn by hitting practice and homework targets — with parent-approved completions — will make them complete their tasks more reliably and make screen-time decisions self-service and dispute-free.

### Task model (requirements)
Each **Task** is a recurring **weekly target** belonging to one kid, with:
- a title and emoji,
- a **target count** for the week (e.g. 4 for Drums; N steps for Chinese; N items for Math),
- a **reward in minutes** awarded once when the target is hit,
- a **display style**: `TALLY` (discrete sessions, e.g. instrument practice) or `BAR` (progress toward a goal, e.g. homework).

Seed data for launch:
| Kid | Task | Target | Display | Reward (mins) |
|-----|------|--------|---------|---------------|
| Tyler | Drums | 4× / week | Tally | configurable |
| Tyler | Chinese homework | to weekly goal | Bar | configurable |
| Tyler | Math homework | to weekly goal | Bar | configurable |
| Riley | Guitar | 4× / week | Tally | configurable |
| Riley | Chinese homework | to weekly goal | Bar | configurable |
| Riley | Math homework | to weekly goal | Bar | configurable |

*(Minute values and homework goals are set/edited by the parent; placeholders to be confirmed with Oliver.)*

### Stories

**Story 1 — Switch profile**
As anyone in the family, I want to tap a profile on the home screen, so I see that person's view.
- [ ] Home screen shows Mum, Tyler, Riley as large tappable targets.
- [ ] Tapping a kid opens their dashboard immediately (no PIN).
- [ ] Tapping Mum opens the parent dashboard; changes within it require the PIN (if set).

**Story 2 — Log a completion (kid)**
As a kid, I want to mark a task done, so it counts toward my weekly target.
- [ ] Each task has an "I did it" action.
- [ ] Logging creates a **pending** completion; the UI reflects pending vs approved distinctly.
- [ ] Tally tasks increment by one session per log; bar tasks increment one step per log.
- [ ] A kid cannot approve their own completion.

**Story 3 — Approve completions (parent)**
As the parent, I want to review and approve pending completions, so kids can't self-credit.
- [ ] Parent dashboard shows a queue of pending completions across both kids.
- [ ] Approving requires the PIN (if set).
- [ ] Approving counts the completion toward the weekly target; rejecting discards it.

**Story 4 — Earn minutes on target hit**
As a kid, I want to receive my reward minutes when I complete a weekly target, so my effort pays off.
- [ ] When a task's **approved** progress reaches its target count, exactly one EARN of `reward minutes` posts to that kid's current-week balance.
- [ ] The reward is awarded **once per task per week** (no double-award), even if more completions are approved.
- [ ] Partial progress (below target) awards nothing.

**Story 5 — See my balance and progress (kid)**
As a kid, I want to see my remaining minutes and how close I am to each reward, so I stay motivated.
- [ ] Current weekly minutes balance is the most prominent element on the kid dashboard.
- [ ] Each task shows progress vs target (tally dots or progress bar) and the minutes it will award.

**Story 6 — Redeem screen time (kid)**
As a kid, I want to spend my minutes when I use a screen, so my balance reflects reality.
- [ ] "Use screen time" lets the kid redeem a chosen number of minutes.
- [ ] A REDEEM cannot exceed the current balance.
- [ ] Balance updates immediately; redemption is recorded in history.

**Story 7 — Manage rules (parent)**
As the parent, I want to edit tasks, targets, and minute values, and manually grant/adjust minutes, so I keep the system fair.
- [ ] Parent can create/edit/deactivate tasks (title, emoji, target, reward minutes, display style).
- [ ] Parent can post a manual ADJUST (positive or negative) with a note.
- [ ] All rule changes are PIN-gated.

**Story 8 — Weekly reset**
As the family, I want each week to start fresh, so the system stays simple and seasonal.
- [ ] Weeks start **Monday**, computed in the **Europe/London** timezone *(confirm)*.
- [ ] At week rollover, progress and balance start at zero; **unspent minutes do not roll over** *(confirm)*.
- [ ] Prior weeks' history remains viewable.

### Edge cases & constraints
- Logging more sessions than the target (e.g. 5 drum sessions) is allowed but never awards more than the single target reward.
- Rejecting an already-counted completion must correctly walk back progress (and, if it drops below target after an award, the award handling must be defined — **open question**, see §10).
- Redeeming exactly to zero is allowed; redeeming below zero is blocked.
- Timezone correctness matters for the Monday boundary (don't award/reset on the wrong day).

---

## 8. Out of Scope

Explicitly **not** building in this release:
- **Video proof / media capture** (core of v1) — removed; trust + parent approval replaces it.
- **Real device screen-time measurement or enforcement** — this is a ledger by family agreement, not an OS-level control (that would require native per-device integrations, out of scope entirely).
- **Real authentication / accounts** — profile switching + parent PIN only, single-family.
- **Rewards catalog / spending points on treats** — currency is screen-time minutes only.
- **Multiple families / multi-tenant** — single household.
- **Notifications/reminders** — future consideration.

---

## 9. Dependencies & Risks

### Technical approach (for context; engineering owns details)
- **Stack:** Next.js 16 (App Router) + React 19, Prisma 5, **fresh** Neon Postgres, Tailwind v4, deployed to **Vercel**.
- **Server Actions** for mutations (Next 16 conventions to be followed per bundled docs).
- **Vitest** for the economy logic (week boundary, target-hit detection, balance computation).

### Dependencies
- **Design:** UI/UX for the three surfaces (Claude Design to flesh out) — kid dashboard especially needs a low-reading, high-delight treatment.
- **Infra:** New Neon database; new Vercel project (old one being torn down).
- **Decisions from Oliver:** minute values per task, homework weekly goals, PIN.

### Risks & mitigations
- **Risk: the app becomes a chore.** → Keep logging/approval to seconds; minimal taps; no friction.
- **Risk: approval bottleneck demotivates kids.** → Make the pending queue fast; consider batch-approve.
- **Risk: timezone/week-boundary bugs** award or reset on the wrong day. → Unit-test the boundary logic in a fixed timezone.
- **Risk (data protection): the database holds personal data about minors** (names, activity records). Although v2 removes children's *video* (a much lower-sensitivity profile than v1), it is still personal data of children stored in the cloud. Mitigations: store the minimum necessary (no contact details, no media), keep it within the single family, and ensure data can be fully deleted on request. Revisit if the app ever expands beyond this one household.

---

## 10. Open Questions

- **Minute values:** What reward (in minutes) should each task carry? (Drums/Guitar full target, Chinese goal, Math goal.)
- **Homework goals:** What is the weekly "goal" count for Chinese and Math progress bars?
- **Rollover:** Confirm no rollover of unspent minutes between weeks (current default).
- **Week boundary timezone:** Confirm Europe/London (or specify the family's timezone).
- **Award walk-back:** If a parent rejects a completion *after* the target reward was awarded, should the earned minutes be clawed back, or does an award stick once granted?
- **Redeem actor:** Can kids redeem their own minutes freely, or should redemption (or large redemptions) require parent confirmation?
- **PIN:** Is the parent PIN required for launch, or optional/off by default?

---

## Appendix A — iPad / iOS Future Direction

Phase 2 is a native **iOS app optimized for iPad**. The web app is Phase 1, but the following should inform design and architecture **now** so the transition is smooth:

- **Touch-first, large targets:** Design the kid dashboard for finger taps on a tablet, not mouse precision. Big buttons, generous spacing, minimal text — assume a young child on an iPad.
- **Single-surface, kiosk-friendly:** The app will likely live on a shared family iPad. Profile switching should be fast and obvious; consider a "home" surface that's pleasant to leave on a counter.
- **Portrait and landscape:** iPad is used both ways; layouts should adapt.
- **Offline tolerance (future):** A native iPad app may need to function briefly offline; keep the data model simple and the client state clean so this is feasible later.
- **Path to native:** Building the web app as a clean, installable, responsive PWA is the lowest-friction bridge toward a later native/iPad app (and could serve as an interim "add to home screen" experience on the iPad before a true native build).
- **Visual identity:** Design should establish a playful, kid-friendly visual system (color, mascot/avatars, motion/celebration on earning minutes) that can carry directly into the iPad app.

*Phase 2 is explicitly out of scope for build now, but in scope for design awareness.*
