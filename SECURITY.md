# Security policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub's
[Report a vulnerability](https://github.com/maheshmm7/beforehand/security/advisories/new) form on
this repository. If that is unavailable to you, open an issue titled "Security contact request"
with no details in it, and you will be given somewhere private to send them.

Please include:

- what the problem is, in a sentence;
- the steps or the request that shows it;
- what an attacker gets out of it;
- the commit or the deployed URL you tested against.

A proof of concept is welcome. Do not test against anybody else's deployment, do not run load or
denial-of-service tests, and do not access or modify data that is not yours.

### What to expect

|                                                  |                                                              |
| ------------------------------------------------ | ------------------------------------------------------------ |
| First reply                                      | Within 5 days                                                |
| An assessment, with a severity and a plan        | Within 14 days                                               |
| A fix for anything confirmed as high or critical | As fast as it can be done well, and before any public detail |

This is a single-maintainer project, not a company with an on-call rota. Those are honest
intentions, not a contractual SLA. You will be credited in the release notes unless you ask not to
be.

## Supported versions

Only `main`, and whatever is currently deployed from it. There are no long-lived release branches.

## Scope

**In scope**

- The API in `server/` and `api/` — authentication-free by design, but everything else applies:
  injection, rate-limit bypass, header or policy weaknesses, error messages that leak internals.
- The browser application in `src/` — cross-site scripting, anything that exfiltrates a plan, or
  anything that defeats redaction.
- The prompt boundary — getting the model to ignore its instructions, to return something outside
  its schema, or to make the server act on text that came from a user.
- Anything that lets a client spend the deployment's model quota beyond its rate limit.
- The build and release path: a dependency or a script that could introduce code.

**Out of scope**

- The accuracy of a cost estimate. The figures are planning estimates and are documented as such.
- Content a language model produces. Ideas are labelled as guesses.
- Anything that needs physical access to a visitor's unlocked device, since plans are stored in
  that browser deliberately.
- Missing hardening that has no exploit behind it. Tell us anyway, but it is a bug report.
- Denial of service by volume alone against a free-tier deployment.

## How this application is built

Context, so a report can be aimed well.

- **No accounts, no passwords, no user database.** Plans live in the browser's local storage and
  are validated against a schema on every read. There is no session to steal and no server-side
  record of a person.
- **The key never reaches the browser.** `GEMINI_API_KEY` is read in the server process only. A
  scanner runs in CI over the working tree, and `.env` has been git-ignored since the first commit.
- **Every request and every reply is schema-checked.** Zod `strictObject` on both directions, so an
  unknown field is a rejection rather than a surprise. A model reply that does not fit the contract
  is refused, not shown.
- **Untrusted text is fenced.** Anything pasted is wrapped in a boundary that changes per request,
  labelled as data, and the model is instructed to ignore instructions inside it. Phone numbers,
  email addresses and URLs are stripped in the browser and again on all three server routes.
- **Limits are enforced on the server after the model answers**, not merely asked for in the
  prompt — including the headroom an idea has to fit inside.
- **Rate limiting is keyed on an address a client cannot write.** Only the hops a trusted proxy
  appended are read; `TRUSTED_PROXY_HOPS` says how many of those there are and defaults to none.
  Limits are applied before body parsing, so a flood costs no parse work.
- **Nine security headers**, declared once in `server/securityHeaders.ts`, sent by the API and
  repeated for the static host in `vercel.json`, with a test that fails if the two ever drift.
- **Errors carry stable codes only** — never a stack trace, never an upstream message.
- **Dependencies are pinned exactly**, with no `^` or `~`, and `npm audit` runs in CI at
  `--audit-level=high`. Nothing the browser or the function ships has an advisory against it.

## Known limitations

Stated here so nobody has to find them twice.

- Plans are not encrypted at rest in the browser. Anyone with the unlocked device can read them.
  This is a deliberate trade for having no accounts.
- There is no audit log, because there is nothing and nobody to attribute an action to.
- A deployment's model quota is protected by rate limiting, not by a spend cap. Set a quota on the
  key in Google AI Studio if that matters to you.
- `npm audit` currently reports moderate advisories against `minimatch` reached through ESLint and
  its plugins. They are development dependencies: they are not installed by the serverless
  function, are not part of the browser bundle, and cannot be reached by a request. Forcing a
  newer `minimatch` past ESLint's own expectations would break linting without closing any path
  that exists, so the advisories are recorded here rather than papered over.
