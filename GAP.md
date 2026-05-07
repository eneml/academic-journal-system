# AJS ↔ OJS feature gap (as of 2026-05-08)

This document maps every meaningful feature of the OJS 3.5 reference
implementation onto the current state of `academic-journal-system`,
flags what is **missing** vs **partial** vs **already done**, and ends
with a phased plan for closing the gaps.

OJS is a **reference**, not a source. No PHP gets ported, no symbols
get copied, no `// matches OJS …` comments get written. We pick the
features OJS proves are needed by a working academic journal, ignore
the bits we don't want, and rebuild them in our modulith on our terms.

Citations: `OJS: <relative-path>` resolves under
`/Users/eml/Desktop/journal/ojs-3.5.0-4/`. `AJS: <relative-path>`
resolves under `/Users/eml/Desktop/journal/academic-journal-system/`.

Sizing legend (per task): **S** ≤ 2 h · **M** 2–6 h · **L** 6–16 h ·
**XL** > 16 h. Sizing is rough — adjust at `/gsd:plan-phase` time.

---

## Already covered (clarifications)

Things you might assume are missing but already ship — call out so we
don't rebuild them.

- **Per-publication daily metrics rollup** is in place (`AJS:
  src/main/resources/db/migration/V115__publication_metric_daily.sql`,
  `V120__backfill_daily_metrics.sql`). Powers `/admin/stats/articles`
  with per-format split (PDF / HTML / abstract / other). OJS's
  per-publication time-series view (`OJS: lib/pkp/api/v1/stats/publications/`)
  is matched.
- **Citation export** — seven formats (BibTeX, RIS, EndNote, APA, MLA,
  Chicago, Vancouver) already render via `AJS:
  src/main/java/com/eneml/ajs/integration/internal/application/CitationFormatter.java`
  and `ArticleCitationController`. OJS exposes the same shapes through
  the citationStyleLanguage plugin.
- **JATS export** — `AJS:
  src/main/java/com/eneml/ajs/integration/internal/application/JatsGenerator.java`
  produces JATS 1.3 from a published `Publication`. OJS does the
  equivalent via `lib/pkp/classes/jats/Repository.php` +
  `plugins/generic/jatsTemplate/`. Parity at the metadata-only level;
  full-text JATS upload still missing (see §11.3).
- **CrossRef deposit** — full pipeline (`CrossRefClient`,
  `CrossRefDepositXmlGenerator`, `DepositService`,
  `DepositDispatchJob`, `PublicationDoiListener`). OJS does this via
  `plugins/generic/crossref/` + `plugins/importexport/crossref/`. We
  match on outbound DOI registration.
- **ORCID push** — per-author OAuth credentials
  (`V90__orcid_credentials_init.sql`, `V95__deposit_actor_user.sql`),
  `OrcidClient`, `OrcidWorkXmlGenerator`, `OrcidAuthService`. OJS
  uses `lib/pkp/classes/orcid/`. We match on work deposit; review
  deposit and the email-collect handshake are partial (see §11.4).
- **Public RSS feed** — `AJS:
  frontend/apps/public-site/app/feed.xml/route.ts` (RSS 2.0, 50 most
  recent published articles). OJS ships this through
  `plugins/generic/webFeed/`. Considered done.
- **Public sitemap + robots** —
  `frontend/apps/public-site/app/sitemap.ts` and `robots.ts`. OJS
  uses `pages/sitemap/SitemapHandler.php`. Considered done.
- **hreflang alternates** — emitted from
  `frontend/apps/public-site/app/layout.tsx` via
  `metadata.alternates.languages`. OJS does this through theme
  templates. Considered done.
- **Per-user reading list** ("library") — V135 + `LibraryController`
  + LibraryService + the public Save button. OJS has no exact
  equivalent; the closest is the user notes/library files plugin and
  is unrelated. Considered done.
- **Indexing memberships** — V128 + `IndexingMembershipController`,
  surfaced on the homepage and footer chips. OJS does this through
  the `pflPlugin` (Publication Facts Label) and journal settings. We
  match on the data model and surface; PFL block itself is not ported
  — different shape.
- **Branding fields on `journal_config`** — acronym, subtitle,
  founding year, frequency, publisher, country, tagline,
  tagline_ornament (V110, V128). Match parity with OJS context fields
  in `OJS: schemas/context.json`.
- **Public-site reading screens are visually richer than the OJS
  default theme** — drop-cap, marginalia TOC, sparklines on featured
  articles, ink-bg open-call card. None of this needs porting back.

---

## Won't port (and why)

Conscious choice list — things OJS ships that we will **not** rebuild.
Anything new that lands here gets explicit sign-off from the user.

| OJS feature | Why we skip |
|---|---|
| **Subscription / paywall machinery** (`OJS: classes/subscription/`, `classes/payment/`, `plugins/paymethod/manual+paypal`, `pages/payment/`) | Out of scope for this journal — open-access only. OJS's `IndividualSubscription` / `InstitutionalSubscription` / `SubscriptionType` / `institution_ip` ranges add ~12 tables we won't ever read. |
| **APC / submission fees** (`OJS: schemas/context.json` `submissionFee`/`publicationFee` block) | Same reason — no fee-bearing publication mode. |
| **OAI-PMH `email` set leaking author email addresses** (`OJS: classes/oai/ojs/OAIDAO.php` set spec) | Privacy hole. When we add OAI-PMH (§13.2) we expose only journal/section sets, not author email sets. |
| **CSS tracking-pixel statistics** (`OJS: plugins/generic/usageEvent/` writing through `usage_stats_temporary_records`) | Consent-hostile and unreliable. We already do server-side counter bumps in `metrics::api` on the article/galley download endpoints. |
| **Reading-tools plugin chain** (`OJS: plugins/oaiMetadataFormats/` + the dust of v2 reading-tools) | Legacy. The functions readers actually use (cite, share, save) are first-class on our reading screen. |
| **TinyMCE-style WYSIWYG editor for backend forms** (`OJS: plugins/generic/tinymce/`) | We use `<textarea>` + Markdown for any rich content (about pages, announcements). Less surface, less XSS risk. |
| **LOCKSS / CLOCKSS publisher manifest gateway** (`OJS: pages/gateway/GatewayHandler.php::lockss`/`clockss`) | Niche preservation network use; revisit only if a member library asks. |
| **DRIVER metadata set + tombstone gateway** (`OJS: plugins/generic/driver/`) | Aggregator-specific; obsolete in 2026. Skip until a real consumer surfaces. |
| **rfc1807 / oai_marc legacy OAI metadata formats** (`OJS: plugins/oaiMetadataFormats/{rfc1807,marc}/`) | Superseded by `oai_dc` + JATS. We ship `oai_dc` and `jats` only when we add OAI-PMH. |
| **Generic ad-hoc plugin loader** (`OJS: lib/pkp/classes/plugins/`) | Spring already gives us module boundaries + `@ApplicationModule`. We don't need a runtime plugin registry. |
| **SOLR / Lucene search via `plugins/generic/lucene*`** | Postgres tsvector + facets is already in place; revisit only if scaling demands it. |
| **`registry/scheduledTasks.xml`** style task wiring | Spring `@Scheduled` is the equivalent and cleaner. |
| **Site-level multi-journal mode** (OJS hosts many journals; `context_id` everywhere) | Single-journal-per-instance is a deliberate decision (see `JournalConfig` singleton). Don't introduce `journal_id` columns. |
| **Static-pages CMS** (`OJS: plugins/generic/staticPages/`) | Scope-cut 2026-05-08. `/about`, `/policies`, `/for-authors`, `/call-for-papers` stay as MDX/markdown in `apps/public-site/app/`; copy edits go through git like any other code change. |
| **CRediT contributor roles** (NISO CRediT taxonomy via `OJS: plugins/generic/credit/`) | Scope-cut 2026-05-08. Author-role granularity beyond "primary contact" + "include in browse" is not surfaced. |
| **ROR registry + affiliations as a first-class entity** (`OJS: lib/pkp/classes/ror/`, `lib/pkp/classes/affiliation/`, `lib/pkp/classes/task/UpdateRorRegistryDataset.php`) | Scope-cut 2026-05-08. Affiliations stay as the free-text `app_user.affiliation` and `submission_author.affiliation` VARCHARs. No ROR ID resolution, no daily registry refresh. |
| **OAI-PMH 2.0 server** (`OJS: pages/oai/OAIHandler.php`, `lib/pkp/classes/oai/OAI.php`, `plugins/oaiMetadataFormats/`) | Scope-cut 2026-05-08. No `Identify`/`ListSets`/`ListMetadataFormats`/`ListIdentifiers`/`ListRecords`/`GetRecord` endpoint, no `oai_dc` or `jats` OAI-format. Aggregators that need our metadata pull from CrossRef / DOAJ / RSS instead. |

---

## 1. Identity & roles

### 1.1 — Roles

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Canonical role enum | Have | `AJS: src/main/java/com/eneml/ajs/identity/api/Role.java` | `OJS: lib/pkp/classes/security/Role.php` (8 roles) | We have 6: `ADMIN`, `EDITOR`, `SECTION_EDITOR`, `AUTHOR`, `REVIEWER`, `PRODUCTION_STAFF`. OJS adds `READER` and `SUBSCRIPTION_MANAGER` — both irrelevant given Won't-port list. Parity. |
| Per-user role grants (DB) | Have | V25 `user_role_assignment` (active-uniqueness via partial indexes) | `OJS: lib/pkp/classes/security/RoleDAO.php` + `user_user_groups` | More structured: explicit `scope_section_id` for section editors. |
| Section-scoped editors | Have | V25 `user_role_assignment.scope_section_id` constraint | OJS user_groups + `recommendOnly` flag | Parity. |
| ROLE_ID_ASSISTANT (copyeditor / layout) | Partial | `PRODUCTION_STAFF` covers it loosely | `OJS: lib/pkp/classes/security/Role.php::ROLE_ID_ASSISTANT=4097` (one role, multiple stage assignments) | We currently use one production role; if we add per-stage assignments (§5) we may want to split. Decision needed. |

### 1.2 — User profile fields

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Local mirror of Keycloak subject | Have | V25 `app_user` + `JwtUserProvisioning` | `OJS: lib/pkp/classes/user/User.php` | Lazy-provisioned. |
| ORCID iD on user | Have | V25 `app_user.orcid_id` (regex-checked) | `OJS: lib/pkp/classes/identity/Identity.php` (orcid trait) | Parity. |
| Affiliation, biography, country, public URL, signature, gossip note | Have | V25 `app_user` | `OJS: classes/user/User.php` | Parity (multilingual `biography` JSONB). |
| Locale persistence | Have | V25 `app_user.locale` + `PATCH /me/preferences` | `OJS: lib/pkp/classes/user/User.php::locales` | Parity. |
| User-controllable email subscription preferences (per-event opt-out) | Missing | — | `OJS: lib/pkp/classes/notification/NotificationSubscriptionSettingsDAO.php` (`notificationSubmissionSubmitted`, `notificationNewQuery`, `notificationEditorialReport`, …) | Owner: `messaging`. Adds `notification_subscription_setting(user_id, setting_key, blocked BOOLEAN)`. **Decision needed**: which event keys are user-controllable. Cost: M. |
| **Affiliations as first-class entity** (with ROR id) | Won't port | `app_user.affiliation` is a free-text VARCHAR; that's the resting state | `OJS: lib/pkp/classes/affiliation/Affiliation.php` + `lib/pkp/classes/ror/Ror.php` | Scope-cut 2026-05-08. |
| **ROR registry fetch** (background sync of canonical institution names) | Won't port | — | `OJS: lib/pkp/classes/task/UpdateRorRegistryDataset.php` | Scope-cut 2026-05-08. |
| Global ban / soft-disable | Have | V25 `app_user.status='DISABLED'` | OJS `users.disabled` | Parity. |
| Email validation tokens (forgot-password, change-email) | Partial | Keycloak handles password resets | `OJS: lib/pkp/classes/mail/mailables/ChangeProfileEmailInvitationNotify.php` | We delegate to Keycloak — no AJS-side token table needed. Mark as Have via Keycloak. |

### 1.3 — Invitations & user creation

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Self-registration | Have | `AJS: identity/internal/web/AuthRegistrationController.java` (`POST /api/v1/auth/register`) | `OJS: lib/pkp/pages/user/RegistrationHandler.php` | Parity. |
| Editor invites a reviewer who isn't yet a user | Partial | `POST /api/v1/submissions/{id}/review-rounds/{roundId}/assignments` accepts existing userId only | `OJS: lib/pkp/api/v1/invitations/InvitationController.php` (full invitation lifecycle: `invite`/`refine`/`finalize`/`cancel`/`decline`/`populate`) | Owner: `identity`. Adds `user_invitation(id, type, email, payload jsonb, status, expires_at, key_hash)`. Cost: L. |
| Bulk user import | Missing | — | `OJS: plugins/importexport/users/` | Defer — low value, can be done with a SQL admin script. |

---

## 2. Journal config

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Single-journal `JournalConfig` row | Have | V20 `journal_config` (singleton CHECK id=1) | `OJS: schemas/context.json` (per-journal context) | Conscious deviation: single-journal. |
| ISSN online + print | Have | V20 + V110 | `OJS: schemas/context.json` `onlineIssn`/`printIssn` | Parity. |
| Multilingual name, masthead, copyright, license, about | Have | V20 (JSONB) | OJS `_settings` localized rows | Parity. |
| Tagline & ornament glyph | Have | V128 | OJS `pageHeaderText` | Decorative, ours-specific. |
| Publisher / country / founding year / frequency / acronym | Have | V110 | `OJS: schemas/context.json` `publisherInstitution`/`publisherUrl` | Parity. |
| Contact email | Have | V20 `contact_email` | OJS `contactEmail`/`mailingAddress` | Parity. We don't track mailing address — decision needed. |
| Submissions open / closed flag | Have | V20 `submissions_open` | `OJS: schemas/context.json` `disableSubmissions` (inverted) | Parity. |
| Indexing memberships catalog | Have | V128 `indexing_membership` | `OJS: plugins/generic/pflPlugin/` | Different shape (we have a dedicated table; OJS has a flat list in plugin settings). Considered Have. |
| Sections (categories of submissions) | Have | V20 `journal_section` (multilingual title/abbrev/policy/identifyType, abstract_word_limit) | `OJS: schemas/section.json` | Parity. |
| Section: section editor restricted | Have | V20 `editor_restricted` | OJS `editorRestricted` | Parity. |
| Section: review form pointer | Partial | V20 `journal_section.review_form_id` (nullable, no FK because the table doesn't exist yet) | `OJS: schemas/section.json::reviewFormId` | Will be wired up by §4.2. |
| File genres (Article Text / Image / Data Set / …) | Have | V20 `journal_genre` + `GenreController` | `OJS: lib/pkp/classes/submission/Genre.php` | Parity (DOCUMENT/ARTWORK/SUPPLEMENTARY trichotomy). |
| Masthead listing | Have | V20 `journal_masthead_entry` + `MastheadController` (reorder, role label, bio override) | `OJS: lib/pkp/pages/about/AboutContextHandler.php::editorialMasthead` | Parity. |
| Privacy & ethics policy multilingual | Partial | `journal_config.about` JSONB holds free-form HTML | OJS has `privacyStatement`, `openAccessPolicy`, `disclosurePolicy`, `submissionChecklist`, `copyrightNotice` (separately localized) | Owner: `journal`. Consider splitting `about` JSONB into separate columns to mirror OJS's settings keys. **Decision needed**: which policy slots ship — `privacy`, `copyright`, `disclosure`, `peerReview`, `openAccess` would be a sensible default. Cost: S. |
| Submission checklist (acknowledgement boxes on wizard step 0) | Missing | — | `OJS: lib/pkp/classes/components/forms/submission/StartSubmission.php` (multi-checkbox of context-defined items) | Owner: `journal`. Adds `journal_config.submission_checklist JSONB` (array of `{key, label JSONB, required boolean}`) + wizard render. Cost: S. |
| Per-locale name override | Have | `journal_config.name JSONB` | OJS `name` localized | Parity. |
| Custom CSS / theme settings | Won't port | — | `OJS: plugins/themes/default/` admin options | Out of scope; we ship one designed theme. |

---

## 3. Submission

### 3.1 — Submission shell

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Submission row | Have | V35 `submission` | `OJS: classes/submission/Submission.php` | Parity. |
| Submission stages (5) | Have | `SubmissionStage` enum (`SUBMISSION`, `EXTERNAL_REVIEW`, `EDITING`, `PRODUCTION`, `PUBLISHED`) | `OJS: lib/pkp/classes/core/PKPApplication.php::WORKFLOW_STAGE_ID_*` | We deliberately omit `INTERNAL_REVIEW` (OMP-only). Parity. |
| Submission status (5) | Have | `SubmissionStatus`: `DRAFT`, `QUEUED`, `PUBLISHED`, `DECLINED`, `SCHEDULED` | `OJS: classes/submission/Submission.php::STATUS_*` | Parity. |
| Section-scoped section pick | Have | V35 `submission.section_id` + `journal_section` FK | `OJS: schemas/submission.json::sectionId` (writeOnly at create) | Parity. |
| Comments-to-editor | Have | V35 `comments_to_editor` | OJS `commentsForTheEditor` | Parity. |
| Multilingual title/abstract/keywords/disciplines | Have | V35 (JSONB) | OJS `submission_settings` rows | Parity. |
| Citations textarea (raw refs) | Have | V35 `references_raw` | OJS `Citations` form + `CitationListTokenizerFilter` | We store one block; OJS tokenises into rows. Decision: should we tokenise? **Decision needed**. |
| `progress` field (draft state machine) | Have | V35 `submission.progress` (`START`/`DETAILS`/`FILES`/`CONTRIBUTORS`/`EDITORS`/`REVIEW`/`SUBMITTED`) | OJS `submissions.submissionProgress` | Parity. |

### 3.2 — Submission wizard

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Start step (section, language, checklist, privacy consent) | Partial | `/author/submissions/new` lets the author pick a section + locale; **no checklist**, **no privacy-consent gate**, **no copyright agreement** | `OJS: lib/pkp/classes/components/forms/submission/StartSubmission.php` | Owner: `submission` + frontend. Plug in §2 `submission_checklist`. Cost: M. |
| Details step (title/abstract/keywords/disciplines) | Have | `PUT /api/v1/submissions/{id}/details` | OJS `Details` form | Parity. |
| Files step (drag-drop + genre per file) | Have | `POST /api/v1/submissions/{id}/files` | OJS `PKPSubmissionFileForm` | Parity. |
| Contributors step | Have | `submission_author` table + `SubmissionAuthorController` | OJS `Author` + `ContributorsListPanel` | Parity. |
| Reviewer suggestions step | Missing | — | `OJS: lib/pkp/api/v1/reviewers/suggestions/ReviewerSuggestionController.php` + `reviewer_suggestions` table | Owner: `submission` (or new sub-package `submission/internal/suggestion/`). Adds `reviewer_suggestion(id, submission_id, given_name, family_name, email, orcid_id, affiliation, suggestion_reason, approved_at, existing_user_id)`. **Decision needed**: feature on/off (`journal_config.reviewer_suggestions_enabled BOOLEAN`). API: `POST/GET/PUT/DELETE /api/v1/submissions/{id}/reviewer-suggestions`. Cost: M. |
| Editors step (subjects, type, languages, source, rights, dataAvailability, coverage, **categories**) | Partial | We have `keywords` and `disciplines`; no `subjects` (separate from keywords in OJS), no `type`, no `source`, no `rights`, no `dataAvailability`, no `coverage` | `OJS: lib/pkp/classes/submission/PKPSubmission.php::Schema getProperties` | Owner: `submission`. Decide which fields ship; OJS lets the journal toggle each one at context level. **Decision needed**: which metadata fields are surfaced. Cost: S–M. |
| Confirm step (review-everything + submit button) | Have | `POST /api/v1/submissions/{id}/submit` | OJS `ConfirmSubmission` | Parity. |
| Saving for later (draft persists, returnable) | Have | `submission.status='DRAFT'` + `progress` | `OJS: submissions.submissionProgress` | Parity. |
| Save-for-later mailable (`SubmissionSavedForLater`) | Missing | — | `OJS: lib/pkp/classes/mail/mailables/SubmissionSavedForLater.php` | Owner: `messaging`. Lands automatically once §10 is done. Cost: S. |
| Submission acknowledgement email | Partial | Hardcoded title/body on submission listener | `OJS: SubmissionAcknowledgement` mailable (per-locale, editable by manager) | Becomes Have once §10 lands. |

### 3.3 — Files & stages

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| File-stage enum (12 stages) | Have | `AJS: submission/api/FileStage.java` | `OJS: lib/pkp/classes/submissionFile/SubmissionFile.php::SUBMISSION_FILE_*` (15) | We omit `INTERNAL_REVIEW_FILE/REVISION` (OMP-only) and have `NOTE`+`QUERY_ATTACHMENT` collapsed where OJS has `NOTE`+`ATTACHMENT`+`QUERY`. Adequate for OJS-style flow. |
| File source-trace (revision lineage) | Have | V35 `submission_file.source_submission_file_id` (self-FK) | `OJS: submission_files.source_submission_file_id` | Parity. |
| File label + description multilingual | Have | V35 `label JSONB`/`description JSONB` | OJS `submission_file_settings` | Parity. |
| Per-file genre | Have | V35 `submission_file.genre_id` FK | OJS `submission_files.genre_id` | Parity. |
| File viewable flag | Have | V35 `viewable` | OJS `submission_files.viewable` | Parity. |
| Dependent files (e.g. images for HTML galley) | Partial | `FileStage.DEPENDENT` exists but no UI / no FK to parent file | `OJS: submission_files.assoc_type=ASSOC_TYPE_SUBMISSION_FILE, assoc_id=parentId` | Owner: `submission` + `publication`. Add `submission_file.parent_submission_file_id BIGINT REFERENCES submission_file(id)` (nullable). Surface in galley editor. Cost: S. |
| File upload presigned URL flow | Have | `POST /api/v1/submissions/{id}/files` (multipart) + S3-backed `FileStorageService` | OJS `temporaryFiles` + `submissionFiles` flow | Parity. |
| File copy across stages (PromoteFiles) | Missing | — | `OJS: lib/pkp/classes/decision/steps/PromoteFiles.php` | Owner: `editorial` + `submission`. Adds `SubmissionWorkflow.promoteFiles(submissionId, sourceStage, targetStage, fileIds)`. Cost: S. Used by decisions in §5. |
| Files API endpoints | Have | `GET /api/v1/submissions/{id}/files`, presigned download | OJS `PKPSubmissionFileController` (LIST, GET, PUT, PUT/copy, DELETE, CRUD on dependents/revisions) | Reasonably complete. Missing: `PUT {fileId}/copy` (file promotion) — see above. |

### 3.4 — Authors / contributors

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Submission author rows | Have | V35 `submission_author` | OJS `authors` table | Parity. |
| Reorder authors | Have | `POST /api/v1/submissions/{id}/authors/order` | OJS `PUT contributors/saveOrder` | Parity. |
| Primary contact / corresponding flag | Have | V35 `is_corresponding` | OJS `authors.primary_contact` | Parity. |
| Include-in-browse flag | Have | V35 `include_in_browse` | OJS `authors.includeInBrowse` | Parity. |
| **CRediT contributor roles** (NISO standard taxonomy: conceptualization, methodology, software, …) | Won't port | — | `OJS: plugins/generic/credit/` | Scope-cut 2026-05-08. |
| **Authentication of authors via ORCID at submit time** (`OrcidCollectAuthorId` mailable + email-token verification) | Partial | `submission_author.orcid_id` accepts a value but no verify-via-OAuth flow at submit time | `OJS: lib/pkp/classes/orcid/actions/AuthorizeUserData.php` + `OrcidCollectAuthorId` mailable | Owner: `integration`. Adds `submission_author.orcid_email_token`, `orcid_email_token_expires_at`. New `POST /api/v1/integration/orcid/collect-author/{authorId}` enqueues an email; landing page handles OAuth callback. Lands after §10 (needs templated email). Cost: M. |

---

## 4. Review

### 4.1 — Review rounds & assignments

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Review round per (submission, stage, round_number) | Have | V40 `review_round` | `OJS: lib/pkp/classes/submission/reviewRound/ReviewRound.php` | Parity. |
| Review-round status enum | Have | V40 `(PENDING_REVIEWERS, IN_PROGRESS, COMPLETED, CANCELLED)` | OJS `REVIEW_ROUND_STATUS_*` (8 values: SUBMITTED_FOR_REVIEW, REVISIONS_REQUESTED, RESUBMIT_FOR_REVIEW, RESUBMIT_FOR_NEW_ROUND, REVISIONS_SUBMITTED, ACCEPTED, DECLINED, PENDING_REVIEWERS, …) | Slimmer. Decision: do we want richer round-status to drive UI badges? Probably yes once §5 is wired. **Decision needed**. Cost: S to extend the enum. |
| Review assignment | Have | V40 `review_assignment` | OJS `ReviewAssignment` | Parity. |
| Review method (anonymous / double-anonymous / open) | Have | V40 `review_method` | `OJS: lib/pkp/classes/submission/reviewer/ReviewerAction.php` | Parity. |
| Reviewer recommendation enum | Have | V40 `recommendation` (`ACCEPT/REVISIONS/RESUBMIT/DECLINE/SEE_COMMENTS`) | OJS `RECOMMENDATION_*` (6: ACCEPT, PENDING_REVISIONS, RESUBMIT_HERE, RESUBMIT_ELSEWHERE, DECLINE, SEE_COMMENTS) | We collapse `RESUBMIT_HERE/ELSEWHERE` — ours is fine. |
| Reviewer comments (to editor, to author, competing interests) | Have | V40 `comments_to_editor`/`comments_to_author`/`competing_interests` | OJS `submission_comments` table + `ReviewAssignment` + `ReviewerForm` | Parity at the freetext level. |
| Reviewer assignment status machine (`AWAITING_RESPONSE → ACCEPTED → IN_PROGRESS → COMPLETED → CONFIRMED`) | Have | V40 + `ReviewerController` (`/respond`, `/submit`) | OJS `REVIEW_ASSIGNMENT_STATUS_*` (12 values incl. RESPONSE_OVERDUE, REVIEW_OVERDUE, THANKED, REQUEST_RESEND, VIEWED) | Slim. Decision: `THANKED` may be worth surfacing. **Decision needed**. |
| Manuscript anonymisation for reviewers | Have | `SubmissionLookup.findContent` deliberately excludes author identity | OJS `Submission::getMappedSerialized()` strips authors when method=ANONYMOUS/DOUBLE_ANONYMOUS | Parity. |
| Multi-round revisions | Have | `ReviewWorkflow.openNextRound` | OJS `NewExternalReviewRound` decision type | Parity. |
| Reviewer file uploads (during review) | Partial | We accept `REVIEW_ATTACHMENT` file stage but no UI / API to upload from reviewer page | OJS `PKPReviewer*` flows | Owner: `review`. New `POST /api/v1/reviewer/assignments/{id}/files` (multipart) + presigned download from author/editor side. Cost: M. |
| Reviewer reminders | Have | V40 events + `ReviewerReminderDue` (scheduling) + `ReviewerEventsListener` | OJS `ReviewReminder` task + `ReviewRemindAuto`/`ReviewResponseRemindAuto` mailables | Cron + listener wired; **email template lookup is currently hardcoded** — see §10. |
| Decline-and-resend (`REQUEST_RESEND` / `RESEND` flow) | Missing | — | OJS `ReviewerResendRequest` mailable | Owner: `review` + `messaging`. Adds `POST /api/v1/submissions/{id}/review-rounds/{roundId}/assignments/{assignmentId}/resend`. Cost: S. |
| Reinstate a reviewer who declined | Missing | — | OJS `ReviewerReinstate` mailable | Owner: `review`. Same shape. Cost: S. |
| Unassign mailable | Missing | — | OJS `ReviewerUnassign` mailable | Owner: `messaging`. Lands with §10. Cost: S. |
| Reviewer thanks | Missing | — | OJS `ReviewAcknowledgement` mailable | Owner: `messaging`. Lands with §10. Cost: S. |

### 4.2 — Review forms (NEW MODULE / NEW TABLES)

OJS lets editors design **per-section structured review forms** with
typed fields (small/large textarea, checkboxes, radio, dropdown, with
required + included flags, multilingual question + options). Reviewers
fill those out alongside the freetext comments fields. This is one of
the biggest missing pieces.

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `review_form` row | Missing | — | `OJS: lib/pkp/classes/reviewForm/ReviewForm.php` | Owner: `review`. **V150 migration** reserved. Table `review_form(id, code, title JSONB, description JSONB, is_active BOOLEAN, complete_count INT DEFAULT 0)`. Cost: M. |
| `review_form_element` row (typed) | Missing | — | `OJS: lib/pkp/classes/reviewForm/ReviewFormElement.php` (6 element types) | Table `review_form_element(id, review_form_id, seq INT, element_type VARCHAR, included BOOLEAN, required BOOLEAN, question JSONB, description JSONB, possible_responses JSONB)`. Element types: `SMALL_TEXT`, `TEXT`, `TEXTAREA`, `CHECKBOXES`, `RADIO`, `DROPDOWN`. Cost: M. |
| `review_form_response` row | Missing | — | `OJS: lib/pkp/classes/reviewForm/ReviewFormResponse.php` | Table `review_form_response(id, review_assignment_id, review_form_element_id, response_type VARCHAR, response_value JSONB)`. Cost: S. |
| Section ↔ review-form binding | Partial (column exists, no FK because table doesn't) | V20 `journal_section.review_form_id` | OJS `sections.review_form_id` | Add FK in V150. Cost: free. |
| Builder UI for editors | Missing | — | OJS `ReviewFormElementForm` + grid | Owner: frontend `apps/editorial/src/routes/admin/review-forms.tsx` (new). Drag-drop reorder, add/remove element, choose type, multilingual question. Cost: L. |
| Reviewer renderer (fill the form) | Missing | — | OJS reviewer form template | Owner: frontend `apps/editorial/src/routes/reviewer/assignments.$assignmentId.tsx` extends. Cost: M. |
| API surface | Missing | — | — | `GET /api/v1/review-forms`, `POST /api/v1/review-forms`, `GET/PUT/DELETE /api/v1/review-forms/{id}`, `POST /api/v1/review-forms/{id}/elements`, `PUT/DELETE /api/v1/review-forms/{id}/elements/{eid}`, `POST /api/v1/review-forms/{id}/elements/reorder`, `POST /api/v1/reviewer/assignments/{id}/responses` (bulk). Cost: M. |

### 4.3 — Reviewer suggestions

Already covered in §3.2 (wizard step) — same data model.

---

## 5. Editorial decisions

### 5.1 — Decision types

| Decision type | Status | Where in AJS | OJS reference |
|---|---|---|---|
| `EXTERNAL_REVIEW` (Send to review) | Have | `editorial.api.DecisionType.EXTERNAL_REVIEW` | `OJS: lib/pkp/classes/decision/types/SendExternalReview.php` |
| `SKIP_REVIEW` | Have | `SKIP_REVIEW` | `OJS: SkipExternalReview.php` |
| `INITIAL_DECLINE` | Have | `INITIAL_DECLINE` | `OJS: InitialDecline.php` |
| `ACCEPT` | Have | `ACCEPT` | `OJS: Accept.php` |
| `DECLINE` | Have | `DECLINE` | `OJS: Decline.php` |
| `REQUEST_REVISIONS` | Have | `REQUEST_REVISIONS` | `OJS: RequestRevisions.php` |
| `RESUBMIT_FOR_REVIEW` | Have | `RESUBMIT_FOR_REVIEW` | `OJS: Resubmit.php` |
| `NEW_REVIEW_ROUND` | Have | `NEW_REVIEW_ROUND` | `OJS: NewExternalReviewRound.php` |
| `CANCEL_REVIEW_ROUND` | Have | `CANCEL_REVIEW_ROUND` | `OJS: CancelReviewRound.php` |
| `SEND_TO_PRODUCTION` | Have | `SEND_TO_PRODUCTION` | `OJS: SendToProduction.php` |
| `BACK_FROM_PRODUCTION` | Have | `BACK_FROM_PRODUCTION` | `OJS: BackFromProduction.php` |
| `BACK_FROM_COPYEDITING` | Have | `BACK_FROM_COPYEDITING` | `OJS: BackFromCopyediting.php` |
| `REVERT_DECLINE` | Missing | — | `OJS: RevertDecline.php` (un-decline) |
| `REVERT_INITIAL_DECLINE` | Missing | — | `OJS: RevertInitialDecline.php` |
| `RECOMMEND_ACCEPT` (section editor → editor) | Missing | — | `OJS: RecommendAccept.php` |
| `RECOMMEND_DECLINE` | Missing | — | `OJS: RecommendDecline.php` |
| `RECOMMEND_REVISIONS` | Missing | — | `OJS: RecommendRevisions.php` |
| `RECOMMEND_RESUBMIT` | Missing | — | `OJS: RecommendResubmit.php` |

Reverts (2) and Recommendations (4) are missing — adds 6 enum values
and 6 handler classes. Owner: `editorial`. Cost: M.

For **recommendations**, the section editor's stage assignment needs a
`recommend_only BOOLEAN` flag that gates visibility of the
"Recommend" actions vs the "Decide" actions. This implies §5.3 below.

### 5.2 — Decision steps (Email / PromoteFiles / Form)

OJS models a decision as a **wizard with 1+ typed steps**: an Email
step (composes mail to author/reviewer), a PromoteFiles step (moves
files), a Form step (captures editor's note for recommendations). We
currently take the decision in one POST.

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Decision wizard data model | Missing | — | `OJS: lib/pkp/classes/decision/Step.php`, `Steps.php`, `steps/Email.php`, `steps/PromoteFiles.php`, `steps/Form.php` | Owner: `editorial`. Adds a `DecisionDraft` ephemeral object (not persisted), shape `{decisionType, steps: [{type, payload}]}`, plus a 2-phase API: `POST /api/v1/submissions/{id}/decisions/preview` returns step list and pre-filled values, `POST /api/v1/submissions/{id}/decisions` commits. Cost: L. |
| Email step UI (recipient/template/locale/subject/body) | Missing | — | OJS `EmailComposer` | Owner: frontend. Cost: M. |
| PromoteFiles step UI (which review-revision files become Final?) | Missing | — | OJS `PromoteFilesForm` | Owner: frontend. Cost: M. |
| Form step (recommendation editor's note) | Missing | — | OJS `Form` step | Owner: frontend. Cost: S. |

### 5.3 — Stage assignments

Right now the editor identity is implicit (whoever takes the
decision). OJS persists an explicit **stage_assignment** (user × stage
× user_group_id × can_change_metadata × recommend_only).

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Per-stage participant rows | Missing | — | `OJS: lib/pkp/classes/stageAssignment/StageAssignment.php` (table `stage_assignments`) | Owner: new package `editorial/internal/staging/` + V165 (free slot). Adds `stage_assignment(id, submission_id, stage VARCHAR, user_id BIGINT, role VARCHAR, can_change_metadata BOOLEAN, recommend_only BOOLEAN, date_assigned)`. Used by Participants panel + decision authorization. Cost: M. |
| Participants panel API | Missing | — | OJS `submissions/{id}/participants/{stageId}` | `GET /api/v1/submissions/{id}/participants` (current stage) + `GET .../participants/{stage}`. Cost: S. |
| Assign editor / section editor / production staff to a submission | Missing | — | OJS workflow page | UI: frontend new section on `editor/submissions.$id.tsx`. Cost: M. |

### 5.4 — Decision history

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `editorial_decision` log | Have | V45 + `EditorialDecisionController` | OJS `edit_decisions` table | Parity. |
| Decision history endpoint | Have | `GET /api/v1/submissions/{id}/decisions` | OJS `GET submissions/{id}/decisions` | Parity. |
| Decision-completed message string | Partial | summary field | OJS `getCompletedMessage()` per type | Mostly cosmetic. |

---

## 6. Discussions / queries (NEW MODULE)

OJS has per-stage **threaded discussions** between editors / authors /
reviewers / production staff, with file attachments and per-thread
participant lists. Used for "send copyedits back to author", "ask
author to clarify Figure 3", "production team handoff". We have **no
equivalent** today — these conversations currently live entirely in
emails outside the system.

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `discussion` thread row | Missing | — | `OJS: lib/pkp/classes/query/Query.php` (`queries` table) | **V160 migration** reserved. New `discussion` module. Table `discussion(id, submission_id, stage VARCHAR, seq INT, subject VARCHAR(512), date_started, date_modified, closed BOOLEAN, version, created_at, updated_at)`. Cost: M. |
| `discussion_message` (note) row | Missing | — | `OJS: lib/pkp/classes/note/Note.php` | Table `discussion_message(id, discussion_id, author_user_id, body TEXT, posted_at, version, created_at, updated_at)`. The first message is the head. Cost: S. |
| `discussion_participant` join | Missing | — | OJS `query_participants` | Table `discussion_participant(discussion_id, user_id, PRIMARY KEY (discussion_id, user_id))`. Cost: S. |
| File attachments on a message | Missing | — | `OJS: submission_files.assoc_type=ASSOC_TYPE_NOTE, file_stage=SUBMISSION_FILE_NOTE/QUERY` | We already have `FileStage.NOTE` and `QUERY_ATTACHMENT`. Add `submission_file.discussion_message_id BIGINT REFERENCES discussion_message(id)` (nullable). Cost: S. |
| Module package | Missing | — | — | Owner: new top-level `discussion` module. `package-info.java` allowedDependencies: `shared`, `submission::api`, `identity::api`, `storage::api`. Emits `DiscussionStarted`, `MessagePosted`. |
| API surface | Missing | — | — | `GET /api/v1/submissions/{id}/discussions[?stage=X]`, `POST /api/v1/submissions/{id}/discussions`, `GET/PATCH/DELETE /api/v1/discussions/{id}`, `POST /api/v1/discussions/{id}/messages`, `PATCH/DELETE /api/v1/discussions/{id}/messages/{mid}`, `POST /api/v1/discussions/{id}/participants`, `DELETE /api/v1/discussions/{id}/participants/{userId}`, `POST /api/v1/discussions/{id}/close`. Cost: M. |
| Notifications (open / new message / closed) | Partial (need new types) | — | OJS `NEW_QUERY`, `QUERY_ACTIVITY` notification types | Owner: `messaging`. Add `NotificationType.DISCUSSION_OPENED`, `DISCUSSION_REPLY`, `DISCUSSION_CLOSED`. Cost: S. |
| UI | Missing | — | OJS workflow Discussions tab | Owner: frontend. Add a `Discussions` panel to `editor/submissions.$id.tsx`, `author/submissions.$id.tsx`, `reviewer/assignments.$assignmentId.tsx`. Cost: L. |
| Mailables: `DiscussionSubmission`, `DiscussionReview`, `DiscussionCopyediting`, `DiscussionProduction` | Missing | — | OJS same | Lands with §10. Cost: S each. |

---

## 7. Editing & production stages

### 7.1 — Copyediting

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| File stage `COPYEDIT` | Have | `FileStage.COPYEDIT` | OJS `SUBMISSION_FILE_COPYEDIT=9` | Parity. |
| File stage `FINAL` (clean copy ready for production) | Have | `FileStage.FINAL` | OJS `SUBMISSION_FILE_FINAL=6` | Parity. |
| Copyediting discussions | Missing | — | OJS `Query` with stage=editing | Lands with §6. |
| Copyeditor assignment | Missing | — | OJS stage_assignment with role=ASSISTANT, stage=EDITING | Lands with §5.3. |
| Copyediting UI tab | Missing | — | OJS workflow page | Owner: frontend. Editor sees uploaded copyedit files, can promote to FINAL. Cost: M. |

### 7.2 — Production

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| File stage `PRODUCTION_READY` | Have | `FileStage.PRODUCTION_READY` | OJS same | Parity. |
| File stage `PROOF` | Have | `FileStage.PROOF` | OJS `SUBMISSION_FILE_PROOF=10` | Parity (no UI yet). |
| Production discussions | Missing | — | OJS `DiscussionProduction` mailable | Lands with §6. |
| Layout/production-staff assignment | Missing | — | OJS stage_assignment | Lands with §5.3. |
| Galley creation flow inside the Production tab | Partial | `POST /api/v1/publications` exists; uploaded via galley API; no in-workflow shortcut | OJS workflow page Production tab → galleys inline | Cost: M. |
| Approve-galley toggle (gates publication) | Have | `POST /api/v1/publications/{id}/galleys/{gid}/approve` | OJS galley `is_approved` | Parity. |

---

## 8. Publication

### 8.1 — Versioning

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Publication row + `version_number` | Have | V50 + V125 | `OJS: lib/pkp/classes/publication/Publication.php` | Parity. |
| Versioned URL (`/articles/{slug}/versions`) | Have | `GET /api/v1/articles/{slugOrId}/versions` | OJS `submissions/{id}/publications` | Parity. |
| Cloning metadata into a new version | Have | `POST /api/v1/publications/{id}/versions` | OJS `POST submissions/{id}/publications/{publicationId}/version` | Parity. |
| Version DOIs (each version a unique DOI) | Partial | `doi_id` is per-publication, but the registration listener doesn't differentiate per-version | `OJS: schemas/context.json::doiVersioning` | **Decision needed**: do we want a unique DOI per version or one shared canonical? Cost: S. |
| Section identification per publication | Have | V50 `publication.section_id` | OJS publication.sectionId | Parity. |
| Per-publication URL slug | Have | V50 `url_path` (unique) | OJS `publications.url_path` | Parity. |

### 8.2 — Publication metadata

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Multilingual title/abstract/keywords/disciplines | Have | V50 (JSONB) | OJS `publication_settings` localized | Parity. |
| `pages` field | Have | V50 | OJS `pages` | Parity. |
| License URL + copyright holder + copyright year | Have | V50 `license_url`, `copyright_holder`, `copyright_year` | OJS Permissions form | Parity. |
| Categories | Missing | — | `OJS: lib/pkp/classes/category/Category.php` (hierarchical, `path`, `image`, `sortOption`, multilingual title) | **NEW MODULE / V155.** See §15. |
| `hideAuthor` flag (editorials) | Missing | — | `OJS: schemas/publication.json::hideAuthor` | Owner: `publication`. Add `publication.hide_authors BOOLEAN DEFAULT FALSE`. Cost: S. |
| Subjects / type / source / rights / coverage / data-availability | Missing | — | OJS `Publication` schema | See §3.2 — same set of fields. |
| Funding sources | Missing | — | `OJS: plugins/generic/credit/` and `submission_fundings` | Owner: `publication`. Add `publication_funding(id, publication_id, funder_name, grant_id, doi)`. Cost: M. |
| **CRediT roles per author** | Won't port | — | `OJS: plugins/generic/credit/` | Scope-cut 2026-05-08 — see §3.4. |

### 8.3 — Galleys

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Galley row | Have | V75 | OJS `galleys` table | Parity. |
| Galley = file or remote URL | Have | V75 CHECK constraint | OJS galleys (submissionFileId XOR remoteURL) | Parity. |
| Galley label multilingual | Have | V75 `label JSONB` | OJS `galley_settings::label` | Parity. |
| Galley locale | Have | V75 `locale` | OJS `galleys.locale` | Parity. |
| `is_approved` gate | Have | V75 + GalleyController | OJS `galleys.is_approved` | Parity. |
| Galley sequencing | Have | V75 `seq` | OJS `galleys.seq` | Parity. |
| Galley DOI | Have | V75 `galley.doi_id` | OJS galleys + dois | Parity. |
| Inline PDF viewer (pdf.js) | Partial | We embed a `<iframe>` to the presigned URL; native browser viewer | `OJS: plugins/generic/pdfJsViewer/` | Owner: `frontend/apps/public-site`. Add `react-pdf` + on-page viewer. Cost: M. |
| Inline JATS reader (lensGalley) | Won't port | — | `OJS: plugins/generic/lensGalley/` | Lens is dead. If we want JATS-on-page later, build a simple JATS-to-HTML transformer. |
| HTML galley with dependent assets | Partial | `FileStage.DEPENDENT` exists, no rendering | `OJS: plugins/generic/htmlArticleGalley/` | Cost: M. |
| `urlPath` per galley | Have | V75 `url_path` | OJS galleys.url_path | Parity. |
| `pub-id::publisher-id` (external publisher id) | Missing | — | `OJS: schemas/galley.json::pub-id::publisher-id` | Owner: `publication`. Add `publication_galley.publisher_id VARCHAR(64)`. Cost: S. |

### 8.4 — DOIs

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `doi` first-class table | Have | V75 | `OJS: lib/pkp/classes/doi/Doi.php` (`dois` table) | Parity. |
| DOI status enum | Have | V75 `(NOT_REGISTERED, SUBMITTED, REGISTERED, ERROR)` | OJS `STATUS_*` (5 values incl. STALE) | Add `STALE`. Cost: S. |
| Auto-mint DOI from suffix pattern | Partial | Caller sets explicit DOI string | `OJS: lib/pkp/classes/doi/DoiGenerator.php` (`%j.v%vi%i.%a.g%g` patterns + check digit) | Owner: `publication` + `journal`. Add `journal_config.doi_prefix`, `doi_suffix_pattern_publication`, `doi_suffix_pattern_galley`, `doi_suffix_pattern_issue`. New `DoiMinter` service. Cost: M. |
| DOI on issues | Have | V75 `issue.doi_id` FK | OJS `issues.doi_id` | Parity. |
| DOI on galleys | Have | V75 `publication_galley.doi_id` | OJS `galleys.doi_id` | Parity. |
| Bulk deposit / bulk mark stale / bulk re-register | Missing | — | OJS `_dois/BackendDoiController.php` (`PUT submissions/deposit`, `PUT submissions/markStale`, etc.) | Owner: `integration` + `publication`. Adds admin "DOI manager" page. Cost: M. |
| Crossref deposit | Have | `CrossRefClient`/`DepositService` | OJS `plugins/generic/crossref/` | Parity. |
| **DataCite deposit** as alternative agency | Missing | — | `OJS: plugins/generic/datacite/` + `plugins/importexport/datacite/` | Owner: `integration`. **Decision needed**: do we ever need DataCite, or is Crossref enough? Skip unless requested. |

---

## 9. Issues

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Issue row | Have | V55 | `OJS: classes/issue/Issue.php` | Parity. |
| Volume / number / year, multilingual title/description | Have | V55 (JSONB) | OJS issue + issue_settings | Parity. |
| Show-volume / show-number / show-year / show-title flags | Have | V55 | OJS issue.showVolume/etc. | Parity. |
| Cover image (file-backed via stored_file) | Have | V105 `issue.cover_file_id` | OJS `issue_files` table | Parity (we use one stored_file). |
| `url_path` slug | Have | V55 | OJS issue.url_path | Parity. |
| Access status (OPEN / RESTRICTED) | Have | V55 + `open_access_date` for delayed-OA | OJS `issue.access_status` + `open_access_date` | Parity. |
| Drag-drop article curation per issue | Have | V125 + `PATCH /api/v1/issues/{id}/articles` | OJS `manageIssues/ManageIssuesHandler.php` | Parity. |
| Move article between sections within issue | Have | `POST /api/v1/issues/{id}/articles/{publicationId}/section` | OJS same | Parity. |
| Combined-issue PDF builder | Have | `GET /api/v1/issues/{id}/pdf` (PDFBox merge) | OJS none — not a built-in (custom plugins do this) | Ours-specific Have. |
| Publish / unpublish issue | Have | `POST /api/v1/issues/{id}/publish`/`unpublish` | OJS same | Parity. |
| Issue publish triggers `OpenAccessNotification` | Missing | — | `OJS: classes/tasks/OpenAccessNotification.php` + mailable | Owner: `messaging` + `issue`. Listener on `IssuePublished` enqueues notification when `access_status='OPEN'`; on `IssueUpdated` if `open_access_date` rolls over, send `OpenAccessNotify`. Cost: S. |
| Issue style file (custom CSS per issue) | Won't port | — | `OJS: schemas/issue.json::styleFileName` | Niche. |
| Issue galleys (whole-issue PDF galley with own DOI) | Partial | We have combined-issue PDF endpoint but no `issue_galley` row + DOI | `OJS: classes/issue/IssueGalley.php` | Owner: `issue`. Add `issue_galley(id, issue_id, label, submission_file_id?, remote_url?, locale, doi_id?, seq)`. Cost: M. |

---

## 10. Email templates (V145 — biggest single hole)

Today every email body and subject is a Java string literal hardcoded
in `messaging/internal/listener/*.java` (e.g.
`SubmissionEventsListener.java:18`). One generic Thymeleaf template
(`src/main/resources/templates/email/notification.html`) wraps the
title/body with the journal name. There is **no per-event templating,
no localization, no manager-editable copy**.

OJS ships ~50 canonical mailables (each a `Mailable` class with a
unique `EMAIL_KEY`, multilingual subject/body, variable substitution,
and a manager UI to edit the templates per-context).

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `email_template` table | Missing | — | `OJS: lib/pkp/classes/emailTemplate/` (`email_templates`, `email_template_settings`) | **V145 reserved.** Table `email_template(id, key VARCHAR(64) UNIQUE, is_custom BOOLEAN, enabled BOOLEAN, version, created_at, updated_at)` + `email_template_locale(template_id, locale, subject, body, PRIMARY KEY (template_id, locale))`. Cost: M. |
| Seed of canonical keys | Missing | — | OJS bundles them via `lib/pkp/locale/en/emails.po` and the Mailable subclasses | Initial migration seeds the keys + EN bodies. **Decision needed**: which templates ship by default (full list below). Cost: M. |
| Mustache / Thymeleaf rendering with named variables | Partial | One generic Thymeleaf template, no per-template contexts | OJS `Mailable` subclasses declare typed variable lists (`SUBMISSION`, `RECIPIENT`, `SENDER`, `CONTEXT`, `DECISION_DESCRIPTION`, `RECOMMENDATION`, `REVIEWER_FILES`, …) | Owner: `messaging`. New `MailRenderer` resolving `{{submission.title}}`, `{{recipient.givenName}}`, `{{decision.description}}`, etc. Use Mustache (industry default — one of our hard rules) so editors can write templates safely. Cost: M. |
| Template variable catalog | Missing | — | `OJS: lib/pkp/classes/mail/variables/` | Define a flat list of variables our system supports. **Decision needed**: which variables ship — propose `journal.name`, `journal.url`, `recipient.givenName`, `recipient.familyName`, `recipient.email`, `sender.givenName`, `sender.familyName`, `submission.id`, `submission.title`, `submission.url`, `decision.description`, `decision.url`, `dueDate`, `reviewUrl`, `discussion.title`, `discussion.url`. Cost: S. |
| Manager UI to edit templates per-locale | Missing | — | `OJS: lib/pkp/api/v1/emailTemplates/PKPEmailTemplateController.php` + `lib/pkp/pages/management/PKPToolsHandler.php` | Owner: frontend `apps/editorial/src/routes/admin/email-templates.tsx` (new). Locale tabs, monaco-style editor, preview pane. Cost: L. |
| Manager API | Missing | — | OJS same | `GET /api/v1/email-templates`, `GET /api/v1/email-templates/{key}`, `PUT /api/v1/email-templates/{key}` (updates one locale), `POST /api/v1/email-templates/{key}/restore-defaults`, `DELETE /api/v1/email-templates/{key}` (drop custom override, fall back to seed). Cost: S. |
| Wiring listeners through the renderer | Partial | Listeners build draft + email today via hardcoded title/body | OJS each Mailable is queued via `Mail::send()` | Replace `NotificationDraft` direct-string usage with `EmailTemplate.render(key, vars)`. Cost: M. |
| In-app notification still keeps short title; only **TASK** notifications fan out to email | Have | `MailService.sendForNotification` early-returns on TRIVIAL | OJS `NotificationManager` honours user subs | Parity once user subscription settings ship (§1.2). |

### 10.1 — Canonical email-template keys we should ship

Curated subset (drop OJS-specific ones we don't need: subscription
flows, payment flows). All keys lowercase-camel for our system; we
**don't** copy OJS naming verbatim.

**Submission lifecycle**

- `submission.acknowledgement` (to author)
- `submission.acknowledgement.coAuthor` (to other listed authors)
- `submission.acknowledgement.notAuthor` (to user submitting on behalf)
- `submission.savedForLater` (draft saved)
- `submission.needsEditor` (managers see fresh queue)

**Editorial**

- `editorial.editorAssigned` (to assigned editor)
- `editorial.reminder` (monthly stale-task digest to editors)
- `editorial.statisticsReport` (monthly summary)

**Decision**

- `decision.accept.notifyAuthor`
- `decision.decline.notifyAuthor`
- `decision.initialDecline.notifyAuthor`
- `decision.requestRevisions.notifyAuthor`
- `decision.resubmit.notifyAuthor`
- `decision.newReviewRound.notifyAuthor`
- `decision.cancelReviewRound.notifyAuthor`
- `decision.sendExternalReview.notifyAuthor`
- `decision.skipExternalReview.notifyAuthor`
- `decision.sendToProduction.notifyAuthor`
- `decision.backFromProduction.notifyAuthor`
- `decision.backFromCopyediting.notifyAuthor`
- `decision.revertDecline.notifyAuthor`
- `decision.notifyOtherAuthors`
- `decision.notifyReviewer`
- `decision.recommendation.notifyEditor`

**Review**

- `review.request` (initial reviewer invite)
- `review.requestSubsequent` (re-invite for revisions round)
- `review.confirm` (reviewer accepted)
- `review.decline` (reviewer declined)
- `review.acknowledgement` (post-submit thank-you)
- `review.remind` (manual reminder)
- `review.remindAuto` (cron reminder)
- `review.responseRemindAuto` (cron, awaiting accept/decline)
- `review.unassign`
- `review.reinstate`
- `review.resendRequest`
- `review.editReviewNotify` (editor edited the assignment)
- `review.completeNotifyEditors` (review done, ping deciders)
- `review.revisedVersionNotify` (revisions filed)
- `review.publicationVersionNotify` (new version of accepted work)

**Discussions**

- `discussion.submission`
- `discussion.review`
- `discussion.copyediting`
- `discussion.production`

**Publication**

- `issue.publishedNotify` (open-access readers list)
- `issue.openAccessNotify` (delayed-OA window opens)

**Identity**

- `identity.passwordResetRequested` (delegated to Keycloak today;
  template stays for later if we host our own)
- `identity.userCreated` (admin creates user, sets a temp pwd)
- `identity.roleAssignmentInvitation`
- `identity.roleEndNotify`
- `identity.mastheadUpdateNotify`

**Announcements**

- `announcement.notify` (members opted-in)

**ORCID**

- `orcid.collectAuthorId` (verify-by-email handshake)
- `orcid.requestUpdateScope` (re-prompt for `/activities/update`)

That's ~50 keys. The user signs off the final list before §10
implementation.

---

## 11. Notifications

### 11.1 — In-app notifications

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `notification` row | Have | V60 | `OJS: lib/pkp/classes/notification/Notification.php` | Parity. |
| Per-user listing + unread count | Have | `GET /api/v1/notifications` + `unread-count` | OJS dashboard banners | Parity. |
| Mark read / mark all read | Have | `POST /api/v1/notifications/{id}/read`/`/read-all` | OJS read-receipts on banners | Parity. |
| Notification levels (`TRIVIAL`/`NORMAL`/`TASK`) | Have | V60 | OJS NOTIFICATION_LEVEL_TRIVIAL/NORMAL/TASK | Parity. |
| Notification type catalog | Partial | `NotificationType.java` has 10 types | OJS ~60 types | Owner: `messaging`. Add `DISCUSSION_OPENED`, `DISCUSSION_REPLY`, `DISCUSSION_CLOSED`, `REVIEWER_REMINDER`, `REVIEW_OVERDUE`, `EDITORIAL_REMINDER`, `OPEN_ACCESS`, `ANNOUNCEMENT_POSTED`, `RECOMMENDATION_FILED`, `STAGE_REASSIGNED`. Cost: S. |
| Email fanout for TASK notifications | Have (with caveat) | `NotificationEmailListener` | OJS sends mailable per notification type | Currently hardcoded body — fixes itself once §10 lands. |
| Per-user opt-out matrix | Missing | — | `OJS: lib/pkp/classes/notification/NotificationSubscriptionSettingsDAO.php` | See §1.2. |
| `assoc_type` / `assoc_id` for clicking-through | Have | V60 | OJS ASSOC_TYPE_SUBMISSION / ASSOC_TYPE_QUERY | Parity. |
| Per-event filters on `/notifications` page | Have | Filter rail (All / Unread / Decisions / Reviews / Discussions / Submissions / System) | OJS filter UI | Parity. |
| Realtime push (SSE / websocket) | Won't port | — | OJS polls | Defer until we feel the need. |

### 11.2 — Editorial reminder / digest

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Monthly editorial reminder digest | Missing | — | `OJS: lib/pkp/classes/task/EditorialReminders.php` + `EditorialReminder` mailable | Owner: `scheduling` + `messaging`. New `@Scheduled(cron="0 0 8 1 * *")` sweep computes per-editor stale tasks (submissions w/o decision, overdue rounds, abandoned drafts) and emits one digest mail. Cost: M. |
| Statistics report (monthly admin digest) | Missing | — | `OJS: lib/pkp/classes/task/StatisticsReport.php` + `StatisticsReportNotify` | Owner: `scheduling` + `dashboard` + `messaging`. Cost: M. |

### 11.3 — Open-access notification

Already covered §9.

### 11.4 — ORCID collect-author handshake

Already covered §3.4.

---

## 12. Audit log

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Append-only `event_log` | Have | V65 + `AuditController` + `AuditAdminController` | `OJS: lib/pkp/classes/log/EmailLogEntry.php` + various event-log tables | Wider — we log all major events, not just emails. |
| Per-submission timeline endpoint | Have | `GET /api/v1/submissions/{id}/event-log` | OJS workflow page activity feed | Parity. |
| Admin audit log endpoint | Have | `GET /api/v1/admin/audit-log` | OJS site-wide log | Parity. |
| Email log (separate from event log) | Partial | We log a generic `EMAIL_SENT` event | `OJS: lib/pkp/classes/log/EmailLogEntry.php` (with subject + recipient + status) | Owner: `audit` or `messaging`. **Decision needed**: do we want a typed email log or stick with generic events? Cost: S. |
| Submission log entry types (matching OJS `SubmissionEmailLogEventType`) | Partial | We have a string event_type | OJS enum (~30 values) | Mostly cosmetic. Decision needed. |

---

## 13. Public site

### 13.1 — Reading screens

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Homepage (cover stack + featured + 3-up panel + open call) | Have | `apps/public-site/app/page.tsx` | `OJS: pages/index/IndexHandler.php` | Richer than OJS default theme. |
| `/current` issue detail | Have | `apps/public-site/app/current/page.tsx` | OJS current issue | Parity+. |
| `/archive` (issue list) + `/archive/[slug]` (issue detail) | Have | `apps/public-site/app/archive/` | `OJS: pages/issue/IssueHandler.php::archive` | Parity. |
| `/articles/[slug]` reading view (drop-cap + galleys rail + cite popover + 7 citation formats) | Have | `apps/public-site/app/articles/[slug]/page.tsx` | `OJS: pages/article/ArticleHandler.php` | Parity+. |
| `/articles/[slug]/stats` (KPI + 90-day double sparkline) | Have | `apps/public-site/app/articles/[slug]/stats/page.tsx` | OJS `pages/stats/StatsHandler.php` | Parity. |
| `/search` (facets + mark-highlights + pagination) | Have | `apps/public-site/app/search/page.tsx` | OJS `pages/search/SearchHandler.php` | Parity+. |
| `/announcements` | Have | `apps/public-site/app/announcements/page.tsx` | OJS announcements | Parity. |
| `/editorial` (board) | Have | `apps/public-site/app/editorial/page.tsx` | OJS `editorialMasthead` | Parity. |
| `/contact` | Have | `apps/public-site/app/contact/page.tsx` | OJS `contact` | Parity. |
| `/about`, `/policies`, `/for-authors`, `/call-for-papers` static pages | Won't port | Hardcoded MDX/markdown in `apps/public-site/app/` is the resting state | `OJS: plugins/generic/staticPages/` (manager-editable) | Scope-cut 2026-05-08. Copy edits go through git PRs. |
| Sign-in page | Have | `apps/public-site/app/sign-in/page.tsx` | OJS `LoginHandler` | Parity (Keycloak Direct-Grant). |

### 13.2 — OAI-PMH

Scope-cut 2026-05-08. Aggregators that need our metadata pull from
CrossRef (DOIs), DOAJ (when we onboard, §19), and the public RSS feed.
No `Identify`/`ListRecords`/`GetRecord` endpoint, no `oai_dc` or
`jats` OAI metadata format. See top-of-doc Won't-port list.

### 13.3 — RSS / Atom

Already covered Have at top of doc (`feed.xml` route).

If we ever want **Atom 1.0** alongside RSS 2.0 (some aggregators
prefer it), add `feed.atom/route.ts`. Cost: S.

### 13.4 — Sitemap

Already covered Have. The current Next.js sitemap covers homepage,
current issue, archive index, every published article. Match parity.

### 13.5 — Static pages CMS

Already covered §13.1 row.

### 13.6 — Reading tools (Cite / Save / Share / Recommend)

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Cite popover (7 formats) | Have | reading view | `OJS: plugins/generic/citationStyleLanguage/` | Parity+. |
| Save (per-user library) | Have | V135 | — | Ours-specific. |
| Share (Twitter/X, Mastodon, mailto, copy-link) | Partial | Copy-link present, social buttons not (yet) | OJS theme footer | Cost: S. |
| Recommend by author | Missing | — | `OJS: plugins/generic/recommendByAuthor/` | Owner: `publication` or `search`. Adds `GET /api/v1/articles/{slugOrId}/recommendations/by-author?limit=5` (most-read articles by overlapping author ORCIDs). Cost: M. |
| Recommend by similarity | Missing | — | `OJS: plugins/generic/recommendBySimilarity/` | Owner: `search`. Adds `GET /api/v1/articles/{slugOrId}/recommendations/similar?limit=5` (keyword-overlap query against `published_search_index`). Cost: M. |
| Print-friendly view | Missing | — | OJS print stylesheet | Owner: frontend `@media print` CSS pass on the article page. Cost: S. |

### 13.7 — Embedded metadata for crawlers

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Dublin Core `<meta name="DC.*">` tags | Missing | — | `OJS: plugins/generic/dublinCoreMeta/` | Owner: frontend `apps/public-site/app/articles/[slug]/page.tsx` `generateMetadata`. Cost: S. |
| Highwire / Google Scholar `<meta name="citation_*">` tags | Missing | — | `OJS: plugins/generic/googleScholar/` | Same place. Cost: S. |
| OpenGraph / Twitter card | Partial | We emit basic OG via Next defaults | OJS none | Cost: S. |
| Schema.org `Article` JSON-LD | Missing | — | OJS none | Owner: frontend. Cost: S. |
| Sitemap news-XML extension | Won't port | — | — | Niche. |

---

## 14. Search

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Full-text index | Have | V70 `published_search_index` (tsvector) | `OJS: lib/pkp/classes/search/SubmissionSearchIndex.php` (table-based inverted index) | We use Postgres tsvector — better. |
| Keyword tokenisation + stopwords + diacritic-folding | Have | V1 `unaccent` extension + tsvector | OJS stopword files | Parity. |
| Year + section facet | Have | V70 + V130 | OJS sets | Parity. |
| Article-type + open-access facet | Have | V130 | OJS none | Ours-specific. |
| `+keyword`/`-keyword`/`"phrase"` syntax | Partial | tsquery supports `&|! :*` — different syntax | OJS `+kw -kw "phrase"` | Decision: do we surface tsquery-style or translate to OJS-style? Probably translate to friendly `+kw -kw` syntax in `SearchService`. Cost: S. |
| Galley full-text indexing (PDF / HTML body content) | Missing | We index title/abstract/keywords only | OJS `SearchFileParser` extracts PDF text | Owner: `search`. Add `published_search_index.fulltext_text TEXT` populated by Apache PDFBox text extraction on galley approve. Cost: L. |
| Author search | Partial | `keywords` covers some; no dedicated author search | OJS `SUBMISSION_SEARCH_AUTHOR=1` | Owner: `search`. Add `published_search_index.authors_text` populated from publication authors. Cost: S. |
| Highlight snippets (`<mark>`) | Have | `ts_headline` returning `highlightedSnippet` | OJS theme rendering | Parity. |

---

## 15. Categories (NEW MODULE / V155)

OJS has hierarchical, multilingual **categories** (Mathematics > Algebra
> Group Theory) that publications opt into. Public site groups
articles by category for browsing. We have **none**.

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| `category` table | Missing | — | `OJS: lib/pkp/classes/category/Category.php` | **V155 reserved.** New `category` module. Allowed deps: `shared`, `storage::api` (for category cover image). Table `category(id, parent_id BIGINT REFERENCES category(id), code VARCHAR(64) UNIQUE, sequence FLOAT, path VARCHAR(255), title JSONB, description JSONB, image_file_id BIGINT REFERENCES stored_file(id), sort_option VARCHAR(32), version, created_at, updated_at)`. Cost: M. |
| `publication_category` join | Missing | — | OJS `publication_categories` | `publication_category(publication_id, category_id, PRIMARY KEY (publication_id, category_id))`. Cost: S. |
| Admin CRUD | Missing | — | OJS category admin grid | `GET/POST/PUT/DELETE /api/v1/categories`, `POST /api/v1/categories/reorder`. Cost: M. |
| Submission wizard category picker | Missing | — | OJS step 4 | Owner: frontend. Cost: S. |
| Public browse by category | Missing | — | `OJS: pages/catalog/` | Owner: frontend `apps/public-site/app/categories/[slug]/page.tsx`. Cost: M. |
| Category cover image | Missing | — | OJS `categories.image` | Optional. Cost: S. |

---

## 16. Highlights / featured

OJS recently added a **highlights** feature: short editor-curated
"things to read" cards on the homepage, each pointing to a publication
or external URL.

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Featured-articles strip on homepage | Have | hardcoded query (top-3 most recent) | `OJS: lib/pkp/classes/highlight/Highlight.php` (`highlights` table) | Cosmetic parity. |
| Manager-editable highlight cards | Missing | — | `OJS: lib/pkp/api/v1/highlights/HighlightsController.php` | Owner: `journal` or new `highlight` module. Adds `highlight(id, sort_order, title JSONB, description JSONB, url, image_file_id, target_publication_id, version, created_at, updated_at)` + admin CRUD. Cost: M. **Decision needed**: do we keep hardcoded "most recent" or let editors pin? |

---

## 17. Site-wide announcements

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Announcement table | Have | V85 + V127 | `OJS: lib/pkp/classes/announcement/Announcement.php` | Parity. |
| Announcement types (CALL_FOR_PAPERS / SPECIAL_ISSUE / POLICY / GENERAL) | Have | V85 | OJS announcement_types table | More structured (typed via enum). |
| `cta_label` / `cta_url` / `guest_editors` | Have | V127 | OJS HTML body | Ours-specific structured slots for the homepage hero. |
| Public listing | Have | `apps/public-site/app/announcements/page.tsx` | OJS `pages/announcement/` | Parity. |
| Manager UI (CRUD) | Have | `apps/editorial/src/routes/admin/announcements.tsx` | OJS announcements admin grid | Parity. |
| Announcement notifications (members opt-in to email) | Missing | — | `OJS: AnnouncementNotify` mailable | Lands with §10. Cost: S. |
| Announcement subscribers (visitors who opted in) | Missing | — | OJS subscription-style | **Decision needed**: do we want anonymous-email opt-in? If yes, add `announcement_subscriber(email, locale, verified_at, unsubscribe_token, created_at)`. Cost: M. |

---

## 18. Statistics

### 18.1 — Editorial / admin stats

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Admin Statistics overview (KPIs) | Have | `GET /api/v1/admin/stats/overview` + frontend `/admin/stats` | `OJS: pages/stats/StatsHandler.php` | Parity. |
| Monthly submission flow chart | Have | `GET /api/v1/admin/stats/monthly-flow` | OJS editorial stats | Parity. |
| Decisions by section / type | Have | `decisions`, `sections` endpoints | OJS same | Parity. |
| Time-to-decision percentiles (P50/P90/mean) | Have | `EditorialLookup.timeToDecisionDaysSample` | OJS editorial stats | Parity. |
| Reading-impact (most-viewed / most-cited) | Have | `reading-impact` endpoint | OJS stats | Parity. |
| Per-issue stats | Have | `issues` endpoint | OJS `pages/stats/StatsHandler.php::issues` | Parity. |

### 18.2 — Per-publication stats

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Per-publication metrics row | Have | V100 | OJS `metrics` aggregator | Parity. |
| Per-publication daily rollup | Have | V115 + V120 (backfill) | OJS `usage_stats` daily agg | Parity. |
| Per-publication time-series API | Have | `GET /api/v1/publications/{id}/metrics/timeseries` | OJS `api/v1/stats/publications/{id}/timeline` | Parity. |
| Top-viewed list | Have | `GET /api/v1/metrics/top-viewed` | OJS leaderboards | Parity. |

### 18.3 — COUNTER R5 / SUSHI

| Item | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| COUNTER R5 reports (TR, TR_J3, IR, IR_A1, PR, PR_P1) | Missing | — | `OJS: classes/sushi/` | Owner: new `sushi` module or extension on `metrics`. Adds 6 report endpoints under `/api/v1/sushi/r5/{report}` returning JSON or TSV. **Decision needed**: do we ever onboard a library that needs SUSHI access? Likely defer until requested. Cost: XL (full COUNTER R5 spec compliance). |
| Geo-IP tracking | Missing | — | `OJS: classes/sushi/...` + `UpdateIPGeoDB` task | Owner: `metrics`. Adds country-code stamping on each view event. Cost: M. |

---

## 19. Scheduled tasks

| Task | Status | Where in AJS | OJS reference | Notes |
|---|---|---|---|---|
| Reviewer reminders (response & complete) | Have | `scheduling::api.ReviewerReminderDue` + listener | `OJS: lib/pkp/classes/task/ReviewReminder.php` | Parity. |
| Editorial reminder (monthly digest) | Missing | — | `OJS: lib/pkp/classes/task/EditorialReminders.php` | Lands with §11.2. |
| Open-access notification (delayed-OA window opens) | Missing | — | `OJS: classes/tasks/OpenAccessNotification.php` | Lands with §9. |
| DOI deposit dispatcher | Have | `DepositDispatchJob` | `OJS: lib/pkp/classes/task/DepositDois.php` | Parity. |
| Stale DOI mark task | Missing | — | `OJS: depositAll → markStale` | Owner: `integration`. Add `@Scheduled` weekly job that flips long-pending DOIs to `STALE`. Cost: S. |
| ROR registry refresh | Won't port | — | `OJS: lib/pkp/classes/task/UpdateRorRegistryDataset.php` | Scope-cut 2026-05-08. |
| Statistics report (monthly admin digest) | Missing | — | `OJS: lib/pkp/classes/task/StatisticsReport.php` | Lands with §11.2. |
| Failed-job sweep | Partial | Spring's outbox archives completed events | OJS `RemoveFailedJobs` | Outbox does most of this — log into archive after success. Cost: S to add a cron that prunes old archive rows (e.g. > 90 days). |
| Expired invitations cleanup | Missing | — | `OJS: lib/pkp/classes/task/RemoveExpiredInvitations.php` | Lands with §1.3 (invitation infra). Cost: S. |
| Search index refresh / reconciliation | Missing | — | OJS none built-in (manual rebuild) | Owner: `search`. Weekly job that re-derives `published_search_index` from `publication` + `submission` to repair drift. Cost: S. |

---

## 20. Plugins-equivalent (lookup)

| OJS plugin | Status | Notes |
|---|---|---|
| `announcementFeed` | Have | Built-in RSS at `/feed.xml`. |
| `webFeed` | Have | Same as above. |
| `citationStyleLanguage` | Have | 7 formats via `CitationFormatter`. |
| `credit` | Won't port | Scope-cut 2026-05-08. |
| `crossref` (gen + import/export) | Have | §8.4. |
| `customBlockManager` | Won't port | We don't expose sidebar-block customisation. |
| `datacite` | Missing | §8.4 — defer. |
| `driver` | Won't port | Listed at top. |
| `dublinCoreMeta` | Missing | §13.7. |
| `googleAnalytics` | Won't port | Privacy-hostile by default; users add their own GA / Plausible / Fathom snippet via `journal_config.analytics_snippet TEXT` if desired. **Decision needed**. Cost: S if added. |
| `googleScholar` | Missing | §13.7. |
| `htmlArticleGalley` | Partial | §8.3. |
| `jatsTemplate` | Have | `JatsGenerator`. |
| `lensGalley` | Won't port | Listed. |
| `pdfJsViewer` | Partial | §8.3. |
| `pflPlugin` | Won't port | Replaced by §2 indexing memberships. |
| `recommendByAuthor` | Missing | §13.6. |
| `recommendBySimilarity` | Missing | §13.6. |
| `staticPages` | Won't port | Scope-cut 2026-05-08. Static pages stay as MDX. |
| `tinymce` | Won't port | Listed. |
| `usageEvent` | Won't port | Listed. |
| `pubIds/urn` | Missing | Owner: `publication`. Add `publication_urn(publication_id, urn VARCHAR(255) UNIQUE)`. **Decision needed**: do we have a partner that needs URN? Defer unless asked. |
| `oaiMetadataFormats/dc` | Won't port | Scope-cut 2026-05-08 — no OAI server. |
| `oaiMetadataFormats/oaiJats` | Won't port | Scope-cut 2026-05-08 — no OAI server. |
| `oaiMetadataFormats/marc/marcxml/rfc1807` | Won't port | Listed. |
| `importexport/native` | Missing | Owner: new `nativexml` package or `journal/internal/exporter/`. CLI + admin button to export full archive as XML for backup / migration. Cost: L. |
| `importexport/users` | Missing | §1.3. |
| `importexport/doaj` | Missing | Owner: `integration`. Adds DOAJ deposit (POST to `https://doaj.org/api/v2/applications`) on publication. Cost: M. |
| `importexport/pubmed` | Won't port for now | Specialty target; defer until requested. |
| `blocks/browse` | Have | Public homepage / archive serve this. |
| `blocks/languageToggle` | Have | `LanguageSwitcher` primitive. |
| `blocks/makeSubmission` | Have | Public-site CTA + utility-bar. |
| `blocks/information` | Partial | `for-authors`/`policies` pages fill the slot. |
| `blocks/developedBy` | Won't port | Out of scope. |
| `blocks/subscription` | Won't port | No subscriptions. |

---

## 21. Implementation plan

Goals for this plan:
1. Land the **biggest user-visible holes first** (templated emails,
   discussions, review forms) because those compound on every other
   feature.
2. **Atomic commits, push after each phase.** No single phase exceeds
   16 hours; if it does, slice further at `/gsd:plan-phase` time.
3. **Honour modulith dependency rules.** Every cross-module read goes
   through a Lookup; every cross-module write goes through a typed
   Service interface. New modules add `package-info.java` first.
4. **No fake data.** Empty-state UIs are required for every new screen.
5. **Decision-shaped values come from the user.** Each phase below
   lists what to ask before implementation begins.

23 phases, originally 27 — Phases for static-pages CMS, OAI-PMH,
affiliations/ROR and CRediT were dropped on 2026-05-08 (see Won't
port). Numbering below is the post-cut sequence.

### Phase 1 — Email templates (V145) · size **L**

Owner module: `messaging`. Why first: every other phase wants to send
an email and we're hardcoding strings today.

- V145 migration: `email_template`, `email_template_locale` tables.
- Seed canonical keys (full list in §10.1) with EN bodies.
- New `MailRenderer` (Mustache) + variable catalog.
- `EmailTemplateService` (`renderForUser(key, locale, vars)`) +
  fallback chain: user.locale → journal default → EN.
- Replace every hardcoded title/body in `messaging/internal/listener/`
  with a template lookup.
- Manager API: `GET/PUT /api/v1/email-templates`,
  `POST /api/v1/email-templates/{key}/restore-defaults`.
- Frontend: `apps/editorial/src/routes/admin/email-templates.tsx`
  (locale tabs, variable picker, preview).
- Acceptance: workflow events render the correct seeded template; the
  admin UI saves a custom override and the next event uses it; resetting
  restores the seed.

**Ask before starting**: final list of 50 canonical keys, default EN
copy for each (1-line subject + body draft), variable catalog scope.

### Phase 2 — Per-user notification subscription matrix · size **M**

Owner module: `messaging` + `identity`.

- V146: `notification_subscription_setting(user_id, setting_key, blocked BOOLEAN, created_at, updated_at, PRIMARY KEY (user_id, setting_key))`.
- `MailService.sendForNotification` honours the matrix.
- `GET /api/v1/me/notification-preferences`, `PUT /api/v1/me/notification-preferences/{key}`.
- Frontend: profile tab `Notifications` with checkbox grid.
- Acceptance: opting out of `decision.accept` stops the email but
  keeps the in-app alert.

**Ask**: which keys are user-controllable. Propose: every key in §10.1
except identity admin notifications.

### Phase 3 — Stage assignments · size **M**

Owner module: `editorial`. Prereq for Phase 4 (decision wizard) and
Phase 5 (recommendations).

- V165: `stage_assignment(id, submission_id, stage VARCHAR, user_id, role VARCHAR, can_change_metadata, recommend_only, date_assigned, version, created_at, updated_at)` + uniqueness on (submission_id, stage, user_id, role).
- Seed assignments from existing decisions (whoever decided last gets the assignment).
- `EditorialLookup.participantsOf(submissionId, stage)`.
- `POST /api/v1/submissions/{id}/participants`, `DELETE …/{userId}`.
- Frontend: Participants panel on `editor/submissions.$id.tsx`.

**Ask**: do we always auto-add the submitter as `AUTHOR` participant?
Probably yes.

### Phase 4 — Decision wizard (multi-step) · size **L**

Owner module: `editorial`. Depends on Phase 1 (mailables exist) and
Phase 3 (participants known).

- New `DecisionDraft` shape + validation.
- `POST /api/v1/submissions/{id}/decisions/preview` returns
  `{steps:[{type:"email"|"promoteFiles"|"form", payload:…}]}`.
- `POST /api/v1/submissions/{id}/decisions` (commit; adds Email +
  PromoteFiles steps to the per-decision-type config).
- Surface each existing decision type's step list (Accept = email author
  + email reviewers + promote `REVIEW_REVISION` → `FINAL`; Decline =
  email author; …).
- Frontend: replace the current single-button decision flow with a
  drawer wizard.

**Ask**: do we want the editor to be able to skip the email step?
(OJS lets them.) If yes, expose `canSkip` per step.

### Phase 5 — Recommendation + revert decision types · size **M**

Owner module: `editorial`. Depends on Phase 3.

- Add `RECOMMEND_ACCEPT`, `RECOMMEND_DECLINE`, `RECOMMEND_REVISIONS`,
  `RECOMMEND_RESUBMIT`, `REVERT_DECLINE`, `REVERT_INITIAL_DECLINE` to
  `DecisionType` enum + handler classes.
- Update V45 CHECK to include the 6 new values (Flyway repeatable
  migration via constraint drop+add — V165.x).
- Gate "Decide" vs "Recommend" actions in the UI based on the editor's
  stage_assignment.recommend_only flag.

### Phase 6 — Review forms (V150) · size **L**

Owner module: `review`. Depends on Phase 1 (no email dep at runtime
but will eventually want notifications when forms change).

- V150: `review_form`, `review_form_element`, `review_form_response`
  tables.
- Wire FK from `journal_section.review_form_id`.
- API surface in §4.2.
- Frontend admin builder (`/admin/review-forms`).
- Frontend reviewer renderer (form fields above the freetext fields on
  `reviewer/assignments.$assignmentId.tsx`).
- Acceptance: section-bound review form is displayed to reviewer;
  responses persist; editor sees structured + freetext on workflow page.

**Ask**: do all 6 element types ship in v1, or just textarea + radio +
dropdown? Recommend full set — element types are cheap.

### Phase 7 — Discussions module (V160) · size **L**

Owner module: new `discussion`. Depends on Phase 1 (mailables).

- New top-level package with `package-info.java`. allowedDependencies:
  `shared`, `submission::api`, `identity::api`, `storage::api`.
- V160: `discussion`, `discussion_message`, `discussion_participant`
  tables; FK column on `submission_file.discussion_message_id`.
- API surface in §6.
- 4 mailables (`discussion.submission`/`review`/`copyediting`/`production`)
  + 3 new notification types.
- Frontend Discussions panel on three pages (editor/author/reviewer).

**Ask**: do reviewers see discussions on submissions they aren't
assigned to? (No — restrict to participants.)

### Phase 8 — Reviewer suggestions · size **M**

Owner module: `submission`. Independent of others.

- Migration (free slot, V175): `reviewer_suggestion(id, submission_id,
  given_name, family_name, email, orcid_id, affiliation,
  suggestion_reason, approved_at, existing_user_id, version,
  created_at, updated_at)`.
- `journal_config.reviewer_suggestions_enabled BOOLEAN`.
- API surface (CRUD per submission).
- Submission wizard step (under feature flag).
- Editor view in workflow page (turn a suggestion into a real
  reviewer assignment).

**Ask**: enabled by default? Likely yes.

### Phase 9 — Reviewer file uploads + missing review actions · size **M**

Owner module: `review` + `messaging`.

- New `POST /api/v1/reviewer/assignments/{id}/files` endpoint
  (uploads to `REVIEW_ATTACHMENT` stage).
- `POST .../resend`, `POST .../reinstate` endpoints + mailables.
- Reviewer thanks mailable on assignment status `CONFIRMED`.

### Phase 10 — Categories module (V155) · size **M**

Owner module: new `category`. Depends on Phase 1 (no, but template
notifications when categories change).

- Module skeleton, `package-info.java`.
- V155: `category`, `publication_category` tables.
- API surface.
- Submission-wizard category picker.
- Public site `/categories/[slug]/page.tsx`.

**Ask**: hierarchical (parent_id) or flat? Recommend hierarchical.

### Phase 11 — Submission wizard polish · size **M**

Owner module: `submission` + `journal`.

- `journal_config.submission_checklist JSONB` + Start step UI.
- Privacy / copyright / disclosure policy slots in `journal_config`.
- Decide which extra metadata fields ship (subjects/type/source/rights/
  coverage/dataAvailability) and surface on the Editors step.

**Ask**: which metadata fields. Locked-list recommend: `subjects`,
`languages`, `dataAvailability`. The rest defer.

### Phase 12 — Embedded crawler metadata + recommend-by · size **M**

Owner module: frontend + `search`.

- `<meta name="DC.*">` and `<meta name="citation_*">` tags on
  article/issue pages via `generateMetadata`.
- `GET /api/v1/articles/{slug}/recommendations/by-author` and `/similar`.
- "Read next" strip on the article page.

### Phase 13 — Editorial reminders + statistics report · size **M**

Owner module: `scheduling` + `messaging` + `dashboard`.

- Monthly cron emits `editorial.reminder` to every editor with stale
  tasks.
- Monthly `editorial.statisticsReport` to admin with KPIs from
  `dashboard::api`.

### Phase 14 — Galley enhancements (HTML viewer + dependent files + pdf.js) · size **M**

Owner module: `publication` + frontend.

- `submission_file.parent_submission_file_id` FK.
- HTML galley template with dependent-asset URL rewriting.
- pdf.js viewer on the article page.
- `publication_galley.publisher_id` field.

### Phase 15 — DOI minter + stale sweep · size **M**

Owner module: `journal` + `publication` + `integration`.

- DOI suffix patterns on `journal_config`.
- `DoiMinter` service generates `dois.doi` automatically when a
  publication is approved.
- DOI status `STALE` value + weekly sweep.
- DOI manager admin page (bulk re-deposit, mark stale).

### Phase 16 — Issue galleys · size **M**

Owner module: `issue`.

- V200: `issue_galley` table + DOI link.
- Admin upload UI on the issue editor.

### Phase 17 — Highlights / featured cards · size **M**

Owner module: `journal` (or new `highlight` module).

- V205: `highlight` table.
- Admin CRUD.
- Homepage replaces hardcoded "most recent" with editor-curated cards.

**Ask**: hardcoded fallback if no highlights set?

### Phase 18 — Native XML export · size **L**

Owner module: new `nativexml` (or `journal/internal/exporter/`).

- CLI + admin button: export every published submission, publication,
  issue, galley, file as one zip with manifest.xml + content/ tree.
- Acceptance: round-trip with `nativexml import` re-creates the
  archive.

### Phase 19 — DOAJ deposit · size **M**

Owner module: `integration`.

- POST per published article to DOAJ (when journal is on DOAJ).
- New deposit target enum value `DOAJ`.

### Phase 20 — Invitations module · size **L**

Owner module: extension on `identity`.

- V210: `user_invitation(id, type, email, payload, status, key_hash, expires_at, created_by_user_id, created_at)`.
- API: `POST/GET/PUT/DELETE /api/v1/invitations`, `PUT
  /api/v1/invitations/{key}/finalize`.
- Mailable hookup.
- Use case: invite a reviewer who isn't yet a user.

### Phase 21 — Email log promotion · size **S**

Owner module: `audit` or `messaging`.

- Decide between typed `email_log` table or generic `event_log` rows
  with structured payload. **Decision needed**.

### Phase 22 — Search galley full-text indexing · size **L**

Owner module: `search`.

- PDFBox text extraction on galley approve.
- Add `published_search_index.fulltext_text` column + tsvector update.
- Acceptance: searching a phrase that exists only inside a PDF body
  surfaces the article.

### Phase 23 — COUNTER R5 / SUSHI (deferred) · size **XL**

Owner module: new `sushi`. **Skip until a library asks.**

---

### Sequencing notes

- Phases 1 → 2 must come first; everything else benefits.
- Phases 3 → 4 → 5 are a natural decision-engine arc.
- Phase 6 (review forms) is parallelisable with the decision arc.
- Phase 7 (discussions) is parallelisable but pairs nicely with
  Phase 1 finished.
- Phases 8, 10, 11 are independent; can run in any order.
- Phases 18 (native XML) and 19 (DOAJ) are interop work; do late.
- Phase 23 (SUSHI) is on ice unless there's demand.

### Migration number reservations (extending the existing reservation list)

- **V145** — email templates (Phase 1)
- **V146** — notification subscription settings (Phase 2)
- **V150** — review forms (Phase 6)
- **V155** — categories (Phase 10)
- **V160** — discussions (Phase 7)
- **V165** — stage assignments (Phase 3)
- **V175** — reviewer suggestions (Phase 8)
- **V200** — issue galleys (Phase 16)
- **V205** — highlights (Phase 17)
- **V210** — invitations (Phase 20)

V170, V180, V185, V190, V195 are intentionally left free — those
slots originally held the four cancelled phases and are now spare
room for ad-hoc fixes that must land before V200.

---

End of GAP.md. Sign-off needed before any phase begins.
