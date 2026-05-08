# Session handoff — academic-journal-system

Snapshot of state at the end of the gap-analysis + Phase 1–12 implementation
session (2026-05-08). Use this as the priming context for the next session;
the prompt template at the bottom is what to paste in.

## Where the work lives

- Repo: `/Users/eml/Desktop/journal/academic-journal-system`
  (also at `https://github.com/eneml/academic-journal-system`)
- OJS reference (read-only, no port): `/Users/eml/Desktop/journal/ojs-3.5.0-4`
- Branch: `main`. The `design-refresh` branch was merged via PR #1 (74 commits).
  Subsequent phases land directly on `main`. Plan-of-record:
  [GAP.md](./GAP.md).
- Migration head: **V175**.
- Spring Boot main class: `JournalApplication`.
- Java: 25 LTS (`JAVA_HOME=/Users/eml/Library/Java/JavaVirtualMachines/jdk-25.0.3+9/Contents/Home`).

## What got done in the last session

| Phase | Migrations | What shipped | Status |
|---|---|---|---|
| GAP.md audit | — | 23-phase parity doc, scope-cuts (CMS, OAI-PMH, ROR/affiliations, CRediT) | ✅ |
| 1 — Email templates | V136 (fix), V145, V147 | `email_template` + `email_template_locale`, JMustache renderer with Caffeine cache, locale fallback chain `recipient → journal default → en`, 15 canonical keys × EN+RO seeded, manager UI `/admin/email-templates`. Listeners now go through it with hardcoded fallback when key has no locales. | ✅ |
| 2 — Notification opt-out | V148, V149 | `notification_subscription_setting`, `notification.template_key` plumbing, `MailService` skips email when blocked (in-app banner unaffected), UI `/preferences` with grouped checkboxes + link from `/notifications`. | ✅ |
| 3 — Stage assignments | V165 | `stage_assignment(submission, stage, user, role, can_change_metadata, recommend_only)`, REST CRUD `/api/v1/submissions/{id}/participants`, `EditorialLookup.participantsAt/.allParticipantsOf`, listener auto-adds AUTHOR on submit + EDITOR on every decision, Participants tab on `editor/submissions/$id` with Add/Remove. | ✅ |
| 4 — Decision wizard | — | `DecisionMade.suppressDefaultEmail` flag, `DecisionEmailRequested` event, `DecisionPreviewService` returning predicted outcome + email steps with templateKey + recipients; `POST /decisions/preview`; `POST /email-templates/{key}/render` opened to editorial roles; commit accepts `emailOverrides`. UI: drawer wizard "Continue → Preview email" with editable Subject/Body per recipient + Skip toggle. | ✅ |
| 5 — Recommend + revert decisions | V170, V172 | 6 new `DecisionType` values: `RECOMMEND_ACCEPT/DECLINE/REVISIONS/RESUBMIT` (advisory, no stage change, no email) + `REVERT_DECLINE` / `REVERT_INITIAL_DECLINE` (clear DECLINED → QUEUED). UI gates decision dropdown by `stage_assignment.recommend_only` for current user (admin sees all). 2 new email keys seeded EN+RO. | ✅ |
| 6 — Review forms | V150 | `review_form` + `review_form_element` + `review_form_response` + FK on `journal_section.review_form_id`. 6 element types (SMALL_TEXT/TEXT/TEXTAREA/RADIO/CHECKBOXES/DROPDOWN). Admin builder `/admin/review-forms` with reorder ↑/↓ + options editor. Reviewer-side rendering on `reviewer/assignments/$id` with auto-save on submit. | ✅ |
| 7 — Discussions module | V160, V174 | New `discussion` module (allowedDeps `shared/submission/identity/storage`). `discussion` + `discussion_message` + `discussion_participant` + FK `submission_file.discussion_message_id`. REST API `/api/v1/submissions/{id}/discussions` + `/api/v1/discussions/{id}/messages|participants|close`. 2 new email keys seeded. UI: tab + `DiscussionsCard` on editor page with Open + Detail drawers. | ✅ |
| 8 — Reviewer suggestions | V175 | `reviewer_suggestion` table + `journal_config.reviewer_suggestions_enabled`. CRUD per submission + Approve action gated to EDITOR/SECTION_EDITOR/ADMIN. `ReviewerSuggestionsCard` in editor's Review tab with Approve/Remove. | ✅ |
| 10 — Categories module | V155 | New `category` module (allowedDeps `shared/storage/publication`). Hierarchical via `parent_id`, multilingual title/description, `sort_option` enum, public read endpoints + admin write. Admin UI `/admin/categories` with 2-level tree + drawer. Public site: `/categories` index (grid with subcategory chips) + `/categories/[slug]` detail with breadcrumb + articles list. | ✅ |
| 12 — Crawler meta + Read-next | — | `RecommendationsController` exposing `/api/v1/articles/{slug}/recommendations/by-author` (matches by ORCID overlap, returns up to N most-recent published works). Public site emits Highwire `citation_*` (title/author repeated/publication_date/journal_title/issn/doi/pdf_url/language) + Dublin Core `DC.*` (title/creator/publisher/date/identifier/type/format/language/description) + OG/Twitter/canonical. "Read next / More from these authors" strip on article page. | ✅ |

## Migration map (current)

```
V1   init baseline (extensions, modulith outbox)
V20  journal_config + sections + genres + masthead
V25  app_user + user_role_assignment
V30  stored_file
V35  submission + submission_author + submission_file
V40  review_round + review_assignment
V45  editorial_decision
V50  publication
V55  issue
V60  notification
V65  event_log
V70  published_search_index
V75  doi + publication_galley + FKs
V80  deposit_record
V85  announcement
V90  orcid_credentials
V95  deposit_record.actor_user_id
V100 publication_metrics
V105 issue.cover_file_id
V110 journal_config branding (acronym, subtitle, founding year, frequency, publisher, country)
V115 publication_metric_daily
V120 backfill daily metrics
V125 publication.display_order
V127 announcement CTA + guest_editors
V128 indexing_membership + tagline + tagline_ornament
V130 search_facets (article_type, open_access)
V135 user_library_item
V136 indexing_membership.version (FIX — pre-existing schema mismatch)
V145 email_template + email_template_locale
V147 seed 15 canonical email templates EN+RO
V148 notification_subscription_setting
V149 notification.template_key
V150 review_form + review_form_element + review_form_response + FK on section
V155 category + publication_category
V160 discussion + discussion_message + discussion_participant + FK on submission_file
V165 stage_assignment
V170 editorial_decision.decision_type CHECK extended (RECOMMEND_*, REVERT_*)
V172 seed revert email templates EN+RO
V174 seed discussion email templates EN+RO
V175 reviewer_suggestion + journal_config.reviewer_suggestions_enabled
V176 seed review action email templates (acknowledgement/unassign/reinstate)
V177 seed reviewer-attachment genre
V178 journal_config policies + submission metadata (Phase 11)
V179 seed editorial digest email templates
V180 submission_file.parent_submission_file_id + publication_galley.publisher_id
V185 journal_config.doi_prefix/suffix_pattern/auto_mint + DoiStatus.STALE
V200 issue_galley
V205 highlight
V210 user_invitation
V211 seed invitation email template
V215 email_log
V220 published_search_index.fulltext_text
```

Free for ad-hoc fixes between phases: V146, V161-V164, V166-V169, V171, V173,
V181-V184, V186-V199, V201-V204, V206-V209, V212-V214, V216-V219, V221-V299.

## Active modules (post-session)

```
shared        — kernel, exception types, AuditableEntity base
identity      — Keycloak users + role grants
journal       — config singleton + sections + genres + masthead + indexing
submission    — manuscripts + authors + files + reviewer suggestions
review        — rounds + assignments + review forms (NEW Phase 6)
editorial     — decisions engine (Accept/Decline/…/Recommend/Revert)
                + stage assignments (NEW Phase 3)
                + decision preview/wizard (NEW Phase 4)
publication   — versioned + galleys + DOI + by-author recommendations (NEW Phase 12)
issue         — Vol/No + cover + curation
metrics       — per-publication views + daily rollup
dashboard     — read-only aggregation for admin stats
messaging     — Notification + email_template + Mustache renderer
                + opt-out matrix (NEW Phase 2) + render endpoint (NEW Phase 4)
integration   — CrossRef + ORCID + JATS + citation formats
search        — tsvector + facets
storage       — S3-compatible
audit         — append-only event log
library       — user reading list
announcement  — calls for papers, special-issue invitations
scheduling    — cron sweeps (reviewer reminders, etc.)
discussion    — NEW Phase 7. Threaded conversations per submission stage
category      — NEW Phase 10. Hierarchical taxonomy + public browse
highlight     — NEW Phase 17. Curated featured cards on the homepage
invitation    — NEW Phase 20. Invite users (typically reviewers) not yet on
                the system. Token-based accept link, daily expiry sweep.
```

## What's done since the last handoff

| # | Phase | Migrations | Backend | Frontend |
|---|---|---|---|---|
| 9  | Reviewer file uploads + review actions    | V176, V177 | `POST/GET/DELETE /api/v1/reviewer/assignments/{id}/files`; `/resend`, `/reinstate`, `/unassign` on editor side; 3 mailables seeded; `SubmissionFiles` cross-module write port | Reviewer attachments card; editor Resend/Reinstate/Unassign buttons; FilesRail badge for REVIEW_ATTACHMENT |
| 11 | Submission wizard polish                  | V178       | `journal_config.submission_checklist/privacy_statement/competing_interests_policy`; `submission.subjects/languages/data_availability` | Admin Privacy/CI policy editors + checklist builder; author wizard ChecklistCard + 3 metadata fields |
| 13 | Editorial reminders + stats report        | V179       | `EditorialDigestJob` (1st of every month at 09:00) emits `EditorialReminderDue` to editors and `EditorialStatsReportDue` to admins; messaging listener renders + dispatches | — |
| 14 | Galley enhancements                       | V180       | `submission_file.parent_submission_file_id` FK + `publication_galley.publisher_id`; `Galley.approve(userId)` captures the publisher | — (frontend pdf.js viewer deferred) |
| 15 | DOI minter + STALE sweep                  | V185       | `JournalConfig.doi_prefix/doi_suffix_pattern/doi_auto_mint`; `DoiMinter` auto-mints on `GalleyApproved`; `DoiStaleSweep` weekly cron; `DoiStatus.STALE` enum value | — |
| 16 | Issue galleys                             | V200       | `issue_galley` table + service + REST API (`/api/v1/issues/{id}/galleys`) | — (admin upload UI deferred) |
| 17 | Highlights / featured cards               | V205       | New `highlight` module; admin CRUD + public read at `/api/v1/highlights` | — (homepage rendering deferred) |
| 18 | Native XML export                         | —          | `NativeXmlExporter` streams a ZIP archive; admin endpoint `GET /api/v1/integrations/native-xml-export` | — |
| 19 | DOAJ deposit                              | —          | `DOAJ` added to `DepositTarget`; `DoajPayloadGenerator` + `DoajClient`; `PublicationDoiListener` enqueues DOAJ deposits when `ajs.integration.doaj.enabled=true` | — |
| 20 | Invitations module                        | V210, V211 | New `invitation` module: `user_invitation` table, REST API, mailable, daily expiry sweep, by-key lookup for accept page | — (UI to invite + accept deferred) |
| 21 | Email log                                 | V215       | `email_log` table; `MailService.sendForNotification/sendDirect` records SENT/FAILED/SKIPPED rows with template_key + recipient + notification linkage; admin endpoint `/api/v1/email-log` | — |
| 22 | Search galley full-text indexing          | V220       | `published_search_index.fulltext_text` + new tsvector at weight D; PDFBox extractor invoked on `GalleyApproved` for PDF galleys | — (no UI surface) |
| 23 | COUNTER R5 / SUSHI                        | —          | Deferred — only if a library asks. | — |

## Frontend follow-ups (delivered)

- **Phase 14**: `<PdfViewerClient>` client component embeds the article's
  PDF galley inline via the native browser viewer (resolves the presigned
  URL at fetch-time so SSR cache doesn't serve a stale link). Falls back
  to the existing Galleys panel when the browser refuses to embed PDFs.
  HTML galley dependent-asset rewriting deferred — needs a serve-side
  rewriter, not just a UI change.
- **Phase 15**: `/admin/dois` lists every minted DOI with status filter
  chips (STALE / ERROR / REGISTERED / SUBMITTED / NOT_REGISTERED) and a
  Re-deposit button that flips a row back to NOT_REGISTERED so the
  existing dispatcher picks it up. Extra `Mark stale` action on
  REGISTERED rows. Backend port at `/api/v1/admin/dois`.
- **Phase 16**: `IssueGalleysCard` injected into the issue curate page —
  upload-from-disk via multipart (new `POST /issues/{id}/galleys/upload`
  endpoint) + paste a remote URL + per-row Approve / Remove. Combined
  PDF / EPUB live in the same row.
- **Phase 17**: `<HighlightStrip>` "Editor's picks" on the homepage,
  hidden when no highlights exist; admin CRUD at `/admin/highlights`
  with sort order, per-locale title/description, optional cover image
  storedFileId, and either a publication target or external URL.
- **Phase 20**: `/admin/invitations` (list + invite form with
  type/email/expiry/optional submission binding) and
  `/invitations/accept?key=…` accept page. Key persists across the
  Keycloak sign-in redirect via sessionStorage so the link still works
  after auth.
- **Phase 21**: `/admin/email-log` browses outbound mail with server-side
  filters on recipient / templateKey / status plus a quick filter for
  subject and error message.

Admin nav (in `AppShell`) now includes the long-tail admin pages that
existed but weren't reachable from the menu: Highlights, Categories,
Review forms, Email templates, Invitations, DOIs, Email log. Audit
log and Settings stay where they were.

## Won't port (scope cut, do not rebuild)

- Static-pages CMS — `/about`, `/policies`, `/for-authors`, `/call-for-papers` stay as MDX in `apps/public-site/app/`. Edit via git.
- CRediT contributor roles
- ROR registry + affiliations as first-class entities
- OAI-PMH 2.0 server + `oai_dc`/`jats` formats
- Subscription paywalls / APC fees (open-access only)
- LOCKSS/CLOCKSS gateway, DRIVER set, marc/marcxml/rfc1807, lensGalley, TinyMCE,
  custom-block plugin manager, multi-journal mode
- CSS tracking-pixel statistics (we already do server-side counter bumps)
- OAI `email` set (privacy hole)

## Hard rules

These were the rules at session start; they stay in effect.

1. **No OJS / PKP attribution in code or comments**. The implementation is
   the user's. OJS is a *reference*, not a source. (`GAP.md` is a planning
   doc and may name OJS in plain English.)
2. **Don't rename / restructure existing routes** in
   `apps/editorial/src/routes/` or `apps/public-site/app/`.
3. **Don't reach across module boundaries via direct repository imports.**
   Add a method on the target module's `Lookup` (read) or `Service` (write)
   in its `api` package and consume that.
4. **Industry defaults are fine** (Mustache for templating, Postgres tsvector
   for FTS, OAI-PMH 2.0 spec verbatim, BCP-47 locale tags, ROR identifiers,
   JATS 1.3 DTD). **Decision-shaped values must be asked**: branding
   strings, ISSN, role lists, locale lists, default emails, retraction
   policies. Don't fabricate. The user-instruction policy "decide tu, fii
   profi" was given mid-session and applies — keep the bias toward shipping
   pragmatic defaults rather than blocking on questions.
5. **Atomic commits, English subjects, < 60 chars, no `Co-Authored-By: Claude`,
   no AI-generated formality.** Examples: `add discussion module skeleton`,
   `V160 discussions table + repo`, `oaipmh: ListRecords + GetRecord verbs`.
6. **Java is 25 (LTS spec)**. Don't downgrade.
7. **Spring Boot main class is `JournalApplication`** (not `AjsApplication`).
   Wait on health with `until curl -sf http://localhost:8080/actuator/health;
   do sleep 1; done`.
8. **Frontend dev:** never `git add -A` from repo root (`.env`, `.idea/`,
   `target/` would slip in). Stage explicit paths under `frontend/` and
   `src/main/`.
9. **User-facing voice:** Romanian conversational, technical terms in
   English. Replies short and low-key, no formal section headers / no
   bullet-list summaries unless useful.
10. **No fake data.** Empty states beat fictional sample rows.

## Tech stack notes

- **Backend**: Spring Boot 3.5.3, Spring Modulith 1.4.1, Postgres 17,
  Flyway, JPA, Lombok, MapStruct, JMustache 1.16, Caffeine, AWS SDK v2 (S3),
  OAuth2 Resource Server (Keycloak JWT), Apache PDFBox, Saxon-HE.
- **Frontend monorepo**: pnpm + turbo. Two apps:
  - `apps/public-site` — Next.js 15 (App Router, RSC, Tailwind v4 CSS-first
    `@theme`). All public reading screens + `/categories` (NEW).
  - `apps/editorial` — Vite + React 19 + TanStack Router (file-based, dotted
    naming for nested routes — parent must render `<Outlet />` when not on
    its index path; see `submissions.tsx` for the pattern).
- **Shared packages**: `@ajs/ui` (Button/Card/etc primitives + tokens.css),
  `@ajs/i18n`, `@ajs/auth`, `@ajs/api-client` (OpenAPI types regenerated
  via `pnpm generate` against the live backend).

### Modulith dependency rules (current)

```
shared       (open kernel)
identity     → -
journal      → shared, identity::api
submission   → -
storage      → -
metrics      → -
review       → shared, identity::api, submission::api, storage::api, journal::api
editorial    → shared, identity::api, submission::api, review::api
publication  → shared, submission::api, journal::api, storage::api, metrics::api
issue        → shared, publication::api, journal::api, storage::api, identity::api
search       → shared, publication::api, issue::api, journal::api
audit        → all major event types (write-only sink)
library      → shared, identity::api, publication::api
announcement → shared
discussion   → shared, submission::api, identity::api, storage::api  (NEW)
category     → shared, storage::api, publication::api  (NEW)
messaging    → shared, identity::api, submission::api, review::api,
                editorial::api, publication::api, issue::api, journal::api,
                discussion::api  (extended)
integration  → shared, publication::api, issue::api, submission::api,
                journal::api, identity::api
dashboard    → shared, submission::api, editorial::api, review::api,
                publication::api, metrics::api, journal::api, issue::api
scheduling   → shared, submission::api, review::api, editorial::api,
                issue::api, publication::api
```

There are no cycles. New cross-module reads go through a `Lookup` port; new
cross-module writes go through a typed Service interface in the target's
`api` package.

## Dev environment

- Postgres / Redis / MinIO / Keycloak / Mailpit run via `docker-compose up`.
  Containers: `aj-postgres`, `aj-redis`, `aj-minio`, `aj-keycloak`, `aj-mailpit`.
  Secrets in `.env` (gitignored), default password `rootroot`.
- Backend: `mvn -Dmaven.test.skip=true spring-boot:run` from repo root with
  `.env` sourced. (`-DskipTests` skips test execution but still compiles
  tests; `maven.test.skip=true` skips both — needed because there are
  pre-existing test compilation issues unrelated to this branch.)
- Frontend: `pnpm install` once, then `pnpm dev` (turbo). Public-site on
  `:3000`, editorial on `:5173`.
- Test users (all `rootroot`): `admin@journal.local`, `editor@journal.local`,
  `reviewer@journal.local`, `author@journal.local`. Local app_user IDs for
  ones already provisioned: admin = 2, author = 3.
- The login form uses Keycloak Direct-Grant — call
  `document.querySelector('form').requestSubmit()` to submit reliably
  (button-click can race React's onSubmit).
- Keycloak realm `academic-journal`, public client `aj-spa`.
- Mailpit UI: http://localhost:8025

## Plugins available in this repo (use them properly)

- **agent-skills** — drives `/spec → /plan → /build → /test → /review →
  /ship`. One atomic task per commit.
- **ux-ui-mastery** — `/ux-audit`, `/design-review`, `/accessibility-check`,
  `/cognitive-check`, `/component-build`, `/design-critique`. Use it on
  new screens; the project must keep WCAG 2.2 AA on every page.
- **ui-ux-pro-max** — consult for React/Tailwind/shadcn-style patterns when
  picking component shapes.

If a slash-command name conflicts, use the namespaced form (e.g.
`/agent-skills:review`).

## Things that bit me last session — watch out

- **Schema validation**: `ddl-auto: validate`. Any new entity field needs an
  exact DDL match. Especially: `email` columns on user-related tables are
  `CITEXT` in DB; declare with `@Column(columnDefinition = "citext")` on
  the entity, not `@JdbcTypeCode(VARCHAR)`.
- **TSR file routing**: `parent.child.tsx` makes `child` a nested route
  whose content is rendered through the parent's `<Outlet />`. The parent
  must early-return `<Outlet />` when on a child path. See
  `routes/admin/review-forms.tsx` for the canonical pattern. If you don't
  want nesting, use a flat path (e.g. `/preferences` not
  `/notifications/preferences`).
- **Mapstruct + new fields**: when a record gets a new component, the
  mapper complains about the unmapped target. Add the field to all writer
  DTOs that flow into the entity.
- **Flyway out-of-order**: V145 was applied before V136, V150 came after
  V165, etc. Use `-Dflyway.outOfOrder=true` when bringing the dev DB up to
  head. Production should always be linear; only the local dev DB has gaps
  because phases interleaved.
- **Public reads on the API need `SecurityConfig` whitelist**. New
  controllers default to authenticated; add explicit GET path patterns to
  the `permitAll()` requestMatchers list. Patterns shipped: categories,
  recommendations, public publication reads.

## Mandatory workflow

1. **Read first, don't guess.** Walk the OJS folders or the AJS modules
   relevant to the phase. The deliverable is code you can defend with
   concrete file paths.
2. **Atomic commits.** One concern per commit, English subject < 60 chars,
   no `Co-Authored-By: Claude`. Push when each phase is done.
3. **Honour modulith dependency rules.** Every cross-module read goes
   through a Lookup; every cross-module write goes through a typed Service
   interface. New modules add `package-info.java` first.
4. **No fake data.** Empty-state UIs are required for every new screen.
5. **Decision-shaped values come from the user** — but the user has said
   "decide tu, fii profi", so prefer pragmatic defaults and ask only when
   the answer would be a real surprise (e.g. branding strings, on/off
   business rules).

---

# Prompt template for the next session

Paste this verbatim as the first message of the new session. Adjust the
phase you want to work on at the bottom.

```
# Mission

Continue building the Academic Journal System (AJS) — Java Spring Modulith
backend + pnpm/turbo frontend monorepo at
`/Users/eml/Desktop/journal/academic-journal-system` (branch `main`).
The OJS 3.5 reference tree is at `/Users/eml/Desktop/journal/ojs-3.5.0-4`.

The full plan is in `GAP.md` at the repo root. The previous session
finished GAP.md + Phases 1, 2, 3, 4, 5, 6, 7, 8, 10, 12. Migration head
is V175. See `SESSION-HANDOFF.md` for the detailed snapshot of state,
modules, and what's left.

# Hard rules

1. No OJS / PKP attribution in code or comments. OJS is a reference, not
   a source. GAP.md may mention OJS in plain English.
2. Don't rename or restructure existing routes in
   `apps/editorial/src/routes/` or `apps/public-site/app/`.
3. Don't reach across module boundaries via direct repository imports —
   add a Lookup method (read) or Service interface (write) in the target
   module's `api/` package and consume that.
4. Industry defaults are fine. Decision-shaped values (branding, ISSN,
   role lists, default emails, retraction policies) need user input —
   but I have already said "decide tu, fii profi", so prefer pragmatic
   defaults and ask only when the answer is genuinely surprising.
5. Atomic commits, English subjects < 60 chars, no `Co-Authored-By:
   Claude`, no AI-generated formality. Push after each phase.
6. Java is 25 (LTS spec). `JAVA_HOME=/Users/eml/Library/Java/JavaVirtualMachines/jdk-25.0.3+9/Contents/Home`.
   Don't downgrade.
7. Spring Boot main class is `JournalApplication`. Wait on health with
   `until curl -sf http://localhost:8080/actuator/health; do sleep 1; done`.
8. Frontend dev: never `git add -A` from repo root. Stage explicit paths
   under `frontend/` and `src/main/`.
9. Romanian conversational replies, English in code/docs. Short and
   low-key, no formal section headers unless useful.
10. No fake data — empty states beat fictional rows.

# Watch out

- `ddl-auto: validate` is strict. CITEXT columns need
  `@Column(columnDefinition = "citext")`.
- TSR dotted file routes nest under their parent — the parent must render
  `<Outlet />` when on a child path. See `routes/admin/review-forms.tsx`.
- Mapstruct complains about unmapped target props when you extend records.
- Flyway needs `-Dflyway.outOfOrder=true` locally because phases
  interleaved.
- New public read endpoints must be added to the `permitAll()` list in
  `SecurityConfig`.
- Run backend with `-Dmaven.test.skip=true` (pre-existing test compile
  issues unrelated to current branch).

# Won't port (scope cut, do not rebuild)

Static-pages CMS, CRediT contributor roles, ROR/affiliations entities,
OAI-PMH 2.0 server, subscription paywalls, LOCKSS/CLOCKSS gateway,
DRIVER set, marc/marcxml/rfc1807 OAI formats, lensGalley, TinyMCE,
custom-block plugin manager, multi-journal mode, CSS tracking-pixel
statistics, OAI `email` set.

# Plugins available

- agent-skills (`/spec → /plan → /build → /test → /review → /ship`)
- ux-ui-mastery (`/ux-audit`, `/design-review`, `/accessibility-check`,
  `/cognitive-check`, `/component-build`, `/design-critique`)
- ui-ux-pro-max

# Dev environment

- Docker containers (already running): `aj-postgres`, `aj-redis`,
  `aj-minio`, `aj-keycloak`, `aj-mailpit`. Default password `rootroot`.
- Backend: `set -a && source .env && set +a && JAVA_HOME=… mvn -q
  -Dmaven.test.skip=true spring-boot:run`.
- Frontend: `pnpm dev` from `frontend/`. Public site on `:3000`, editorial
  on `:5173`.
- Test users (all `rootroot`): admin@journal.local (id=2),
  author@journal.local (id=3), editor@journal.local, reviewer@journal.local.
- Keycloak realm `academic-journal`, public client `aj-spa`.
- Mailpit UI at http://localhost:8025.

# Today's phase

Pick up <PHASE NAME / NUMBER> from GAP.md / SESSION-HANDOFF.md.

<paste the relevant phase rows from SESSION-HANDOFF.md "What's left">

Read SESSION-HANDOFF.md and GAP.md, plan the atomic commits, then ship.
Verify in the browser before claiming the phase complete.
```

End of handoff.
