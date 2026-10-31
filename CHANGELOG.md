# Changelog

Notable changes to Beforehand. The format follows [Keep a Changelog](https://keepachangelog.com),
and the project uses [semantic versioning](https://semver.org).

## [Unreleased]

Nothing yet.

## [1.0.0] — 2026-10-31

The first complete version: a planning simulator for weddings, birthdays and community events.

### Added

- **The engine.** Variables, derived quantities, cost rules, constraints, tasks and lead times,
  declared as data and evaluated as pure functions. Change a lever and the whole graph is
  re-evaluated and compared with the version last accepted.
- **Three event packs** — wedding, birthday and community event — each with a different master
  variable, as data rather than code.
- **The blast radius.** A strip along the bottom of every plan screen reporting what a pending
  change set off: which lines moved, which deadlines shifted, which tasks appeared, what broke.
  Keep it or undo it.
- **Budget screen.** Four headline figures, the levers that move them, and where the money goes as
  a ring and a list.
- **Two timelines.** Decision deadlines computed from how much notice each thing needs, and a run
  of show scheduled backwards from the one fixed moment of the day.
- **Vendor checklist.** Every line nobody has promised yet, with the arithmetic behind its figure,
  and a place to paste what a vendor actually sent. Three states per rupee: estimated, quoted,
  paid.
- **Ideas.** Suggestions asked for against what the plan can still absorb, with the headroom
  enforced on the server rather than requested in the prompt.
- **The assistant**, on Gemini, with a retry and fallback chain. It reads pasted text and proposes
  ideas; it never does arithmetic.
- **A landing page** whose hero is a working simulator running the real engine.
- **Light and dark themes**, defined once as design tokens, with a control that remembers the
  choice.
- **Local persistence.** Plans live in the browser, validated against a schema on every read. No
  accounts, no passwords, no user database.
- **Deployment configuration for Vercel**: a static build plus one serverless function mounting
  the same Express application.

### Security

- Rate limiting keyed on an address the client cannot write. Reading the first hop of
  `x-forwarded-for` — what Express's `trust proxy` does — had let anyone rotate a header and hold
  an unlimited number of budgets; measured at 70 requests with a rotating header drawing zero
  refusals before the fix and ten after.
- Nine security headers declared once in `server/securityHeaders.ts`, sent by the API and repeated
  for the static host, with a test that fails if the two drift.
- Redaction of phone numbers, email addresses and URLs in the browser and again on all three
  server routes.
- Untrusted text fenced inside a boundary that changes per request, labelled as data.
- Every request and reply schema-checked with Zod `strictObject`; stable error codes that never
  carry a stack trace or an upstream message.
- A secret scanner in CI, and dependencies pinned exactly.

### Accessibility

- WCAG 2.2 AA asserted by axe on every page, in both themes, on phone, tablet and desktop.
- A keyboard-only journey test, and a reflow test at 320 px with text at 200%.
- Colour is never the only carrier of meaning, including in the spending ring, whose six hues are
  stepped to clear both a normal-vision separation floor and the three common kinds of colour
  blindness against each theme's own surface.

### Known gaps

- No screen-reader pass has been recorded.
- Plans do not sync between devices and cannot be exported.
- The interface is English only.
- Cost rules are hand-authored estimates for one Indian cost base.

[unreleased]: https://github.com/maheshmm7/beforehand/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/maheshmm7/beforehand/releases/tag/v1.0.0
