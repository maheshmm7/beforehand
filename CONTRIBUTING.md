# Contributing

Thanks for looking. This is a small, opinionated codebase; the notes below are what it expects
rather than a formality.

## Getting set up

**Requirements:** Node 20 or newer, and npm.

```bash
git clone https://github.com/maheshmm7/beforehand.git
cd beforehand
npm install
cp .env.example .env    # a Gemini key is optional; see below
npm run dev             # the web app on http://localhost:5180
npm run dev:api         # the API on http://localhost:8787, in a second terminal
```

You do **not** need an API key to work on most of this. The engine, both timelines, the budget
screen and the vendor ledger are all deterministic and run with no key at all. Only "Set it up for
me", "Read it for me" and "Suggest ideas" call a model.

For the browser tests, once: `npx playwright install --with-deps chromium`.

## The gate

```bash
npm run verify
```

Types, lint, formatting, the secret scan, every test with its coverage floors, the production build
and the bundle-size budget. **If it passes, the branch is releasable.** CI runs exactly this, plus
`npm audit`, plus the browser suite.

Run the browser tests too when you have touched anything the eye can see:

```bash
npm run e2e
```

## What a change needs

- **A test that fails without it.** A bug fix brings the test that would have caught it; a feature
  brings the test that describes it. Coverage floors are enforced, so an untested branch fails the
  build.
- **No new `any`, no `@ts-ignore`, no `eslint-disable`.** There are none in the repository today.
  If the types are fighting you, the shape is usually wrong.
- **Exact dependency versions.** No `^`, no `~`. A reproducible install is worth more than an
  automatic patch bump.
- **No secret, ever.** Keys live in `.env`, which is git-ignored and scanned for in CI.

## How the code is written

Read a neighbouring file before adding one; the house style is more specific than a linter can
express.

- **Comments say why, not what.** A comment that restates the line above it is noise. A comment
  that records the fault a line prevents is worth keeping.
- **Name things the way a person would say them.** `tally(count, 'no cost changes', …)` rather than
  `formatPluralLabel`. The interface says "no deadline moves", not "0 deadlines shifted".
- **The engine is pure.** `shared/engine` holds functions over data with no I/O and no React. Packs
  are data, not code. If a new event type needs a new kind of rule, that is a signal worth
  discussing first.
- **The model never does arithmetic.** Gemini reads text and proposes ideas. Every figure is
  computed in TypeScript so it can show its working and cannot be hallucinated. Please keep that
  line where it is.
- **CSS Modules over the tokens in `src/styles/tokens.css`.** No hard-coded colour, no hard-coded
  spacing — if a value is missing from the tokens, add it there.
- **Accessibility is part of the change, not a follow-up.** WCAG 2.2 AA is asserted by axe on every
  page in both themes on three viewports. Colour alone never carries meaning. Anything that moves
  is skipped under `prefers-reduced-motion`.

## Layout changes

The screens are built to fit the window: on a desktop nothing but the content region scrolls, and
nothing folds, grows or jumps while it is read. If you change a layout, measure it rather than
eyeballing it — at 1280×800, 1366×768, 1440×900, 1536×864 and 1920×1080 — and check that
`e2e/consistency.spec.ts` and `e2e/spacing.spec.ts` still pass. Those two files exist because both
faults shipped once.

## Commits and pull requests

- One concern per commit. A subject line in the imperative, under about 72 characters, saying what
  the change does to the product rather than to the files.
- The body explains the why: what was wrong, what the fix is, and what you measured. Numbers beat
  adjectives.
- Say plainly what you did **not** do, or could not verify. An honest gap is useful; a quiet one is
  a trap for the next person.
- No AI attribution or generated-by lines in commits or pull requests.
- Fill in the pull request template. It is short.

## Reporting things

- **A bug or an idea** — open an issue; there is a template for each.
- **A security problem** — do not open an issue. See [SECURITY.md](SECURITY.md).

## Licence

By contributing you agree your work is published under the [MIT licence](LICENSE) that covers this
project.
