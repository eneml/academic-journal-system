# SPEC — Design handoff `design_handoff_academic_journal-1`

**Status:** awaiting sign-off. Do not start `/plan` until user confirms.

## 0. Reading list & ground truth

- Handoff folder is at `/Users/eml/Desktop/journal/design_handoff_academic_journal-1/` (sibling of repo, not inside it as the brief said). All references below use that path.
- README is the summary. Hi-fi truth lives in:
  - `tokens.css` (479 lines)
  - `primitives.jsx` (Icon set, StageStepper, OrcidBadge, DoiChip, CoverArt, Placeholder, RecBadge)
  - `public-site.jsx` (PublicHeader, PublicFooter, PublicHomepage, Sparkline)
  - `article-reading.jsx` (ArticleReading)
  - `public-extra.jsx` (IssueDetail, SearchResults, EditorialBoard)
  - `editorial-shell.jsx` (EditorialShell + role-aware sidebar + EditorQueue)
  - `editorial-screens.jsx` (EditorWorkflow, AuthorWizard, ReviewerFormCompact, AuthorDashboard)
  - `editorial-extra.jsx` (AdminUsers, AdminEmailTemplates, AdminReviewForm, ProductionView)
  - `stats-screens.jsx` (AdminStats, ArticleStats, IssueCuration)
  - `final-screens.jsx` (Notifications, ProfilePage, JournalConfig, AdminAnnouncements, AuditLog, Integrations, ReviewerForm full)
- Existing primitives in `@ajs/ui`: `Button`, `Badge`, `Card*`, `Input`, `Separator`, `DropdownMenu`, `Tooltip`, `LanguageSwitcher`, `UserMenu`, `Icon`, `StageStepper`. Tokens at [tokens.css](frontend/packages/ui/src/tokens.css).
- Existing editorial sidebar groups (`AppShell.tsx`): Home → Authoring → Reviewing → Editorial → Administration → Account. **Do not rename or reorder.**
- Flyway head is `V120`. Next migration block: `V125`.

## 1. Token diff (handoff → ours)

The handoff is the **Premium edition** of our existing palette: same hue families, deeper extremes, more layered shadows, more typographic utilities. **Adopt every value verbatim**, do not blend.

| Token | Ours | Handoff | Action |
|---|---|---|---|
| `--bg` | `oklch(99% 0.003 90)` | `oklch(98.6% 0.004 88)` | **replace** |
| `--bg-tint` | `oklch(98% 0.005 90)` | `oklch(97.8% 0.006 86)` | **replace** |
| `--bg-deep` | — | `oklch(96.5% 0.008 84)` | **add** |
| `--paper` | — | `oklch(99.2% 0.003 92)` | **add** |
| `--surface` | `oklch(97% 0.006 90)` | `oklch(96.8% 0.007 88)` | **replace** |
| `--surface-2` | `oklch(95% 0.008 90)` | `oklch(94.8% 0.010 88)` | **replace** |
| `--surface-3` | — | `oklch(92.5% 0.012 88)` | **add** |
| `--border` | `oklch(91% 0.008 90)` | `oklch(90.5% 0.010 88)` | **replace** |
| `--border-strong` | `oklch(85% 0.012 90)` | `oklch(83% 0.014 88)` | **replace** |
| `--border-ink` | — | `oklch(72% 0.018 88)` | **add** |
| `--fg` / `--fg-2` | 20%/35% | 18%/34% | **replace** |
| `--fg-3` | — | `oklch(46% 0.018 270)` | **add** |
| `--ink` | — | `oklch(14% 0.025 268)` | **add** (used by masthead/footer) |
| `--cobalt` family | base + deep + soft | + `--cobalt-darker`, `--cobalt-tint` | **add 2** |
| `--amber` family | base + deep + soft | + `--amber-darker`, `--amber-tint` | **add 2** |
| `--r-1`/`--r-2`/`--r-3` | 4/6/10 | 4/6/10 | keep |
| `--r-4` | — | 14 | **add** (used on `Open Call` card) |
| Shadows | flat 1/2/3 | + `--shadow-press`, `--shadow-cover`, `--shadow-lift` | **add 3** |
| `--grain` | — | inline-SVG turbulence | **add** (paper texture) |

New utility classes the prototype relies on (must port to `@ajs/ui` tokens.css):

- `.tnum`, `.lnum`, `.onum` (font-variant-numeric)
- `.sc`, `.sc-lg` (small-caps eyebrows; we have `.sc` partially — extend)
- `.marginalia-num`, `.folio` (numbered marginalia + page-number folio)
- `.rule`, `.rule-strong`, `.rule-ink`, `.double-rule`, `.triple-rule` (we have first three)
- `.btn` ladder: `.btn`, `.btn-primary`, `.btn-amber` (new), `.btn-ghost`, `.btn-sm`, `.btn-lg` (new)
- `.chip` ladder: `.chip-mono`, `.chip-cobalt`, `.chip-amber`, `.chip-green`, `.chip-red`, `.chip-ink` (new), `.chip-dot`
- `.avatar`
- `.reading` (already present, but handoff version is richer: `text-align: justify`, `text-indent`, `h2`/`h3` size bumps, `blockquote`, sup.fnref) — replace
- `.reading.dropcap`
- `.paper`, `.cover-paper`, `.ink-bg` (paper-texture surfaces — used on homepage hero, masthead, footer)
- `.fleuron` (centered ornament divider)
- `.lift`, `.toc-row` (hover transitions)
- `.spark-bar` (CSS-only sparkline) — duplicate of SVG `Sparkline`, keep both
- `.oa-badge` (Open Access pill with green bullet)
- `.numeral` (Roman numeral display)
- `.cite-pill` (mono pill — DOI/citation)
- `@keyframes rise`, `@keyframes shimmer`, `.rise` (reveal-on-load)

**Buttons must gain layered gradients** (`.btn-primary` is a 3-stop linear-gradient, `.btn-amber` similarly). Our current `.btn-primary` is flat `var(--cobalt)`. Diff is intentional — the design wants a subtly raised press feel.

## 2. Primitive deltas

Components we already have but need extending:

| Primitive | Current shape | Required additions |
|---|---|---|
| `Button` | size: default/sm; variants default/secondary/outline/ghost/link/destructive/invert | add `size="lg"` (11px×18px, 14px font); add variant `amber` (gradient) |
| `Badge` | variants default/cobalt/amber/success/danger/outline/ghost/mono | add `ink` variant; verify `chip-dot`-style left bullet works |
| `LanguageSwitcher` | dropdown w/ flag + native name + check, EN/RO only | new contract: trigger renders `Globe icon · EN · · RO · DE · FR · chevronDown` (active code highlighted, others muted in tail). Locale set is **decision needed** — keep at EN/RO or expand to EN/RO/DE/FR/ES? |
| `UserMenu` | chip + badge variants | add the right-aligned compact variant the editorial sidebar shows (avatar+name+role+`MoreH`) |
| `Icon` | lucide subset | extend with handoff icons not yet present (rss, history, panel, sparkles, layers, target, cmd, type, mail, workflow, badgeCheck, alert, info, quoteBlock, arrowDown/Up). Keep using `lucide-react` — no need to fork. |
| `StageStepper` | done | unchanged (matches handoff `lg` variant via existing `size="lg"`) |

New primitives to add to `@ajs/ui`:

- `OrcidBadge` (mono "iD" green dot + 16-digit ORCID, mono font)
- `DoiChip` (mono pill, blue "DOI" label + separator + DOI string)
- `CoverArt` (gradient + decorative rules + label) — already exists in public-site as `CoverArt.tsx`; **lift to shared** so editorial issue-curation can use it
- `Sparkline` (SVG line+area, last-point dot) — already at `apps/public-site/components/ArticleStats.tsx` per repo; lift to shared
- `Spark`, `Bars`, `LineChart`, `HBar` (stats visualisations, only used in admin/article stats — keep them inside the editorial app, do not pollute `@ajs/ui` unless reused)
- `UtilityBar` — the top utility row from the handoff `PublicHeader` (ISSN · OA badge · Peer Reviewed · indexing · | · RSS · LanguageSwitcher · Sign in / UserMenu). **Mount on both apps** (public site + top of `EditorialShell`). Lifts language switcher into a single instance.
- `Fleuron` (centered ornament divider with `❦` glyph)

## 3. Screen inventory — every screen × what exists vs what changes

For each screen: **route** (existing, do not rename), **existing component**, **handoff source**, **delta**.

### Public site

| # | Route | Existing file | Handoff JSX | Delta |
|---|---|---|---|---|
| 1 | `/` | `apps/public-site/app/page.tsx` | `PublicHomepage` | Full visual rebuild: hero with cover stack + folio dots + `triple-rule` divider; aside `In this issue` + filter checkboxes + Citation Trail; featured-articles grid with marginalia numerals + per-article sparkline + cite/alt counters; three-up panel (Scope / Editorial board / Indexing) wrapped in `var(--border)`-grid; full-width Open Call card on `ink-bg`. |
| 2 | `/articles/[slug]` | `apps/public-site/app/articles/[slug]/page.tsx` (ArticleToc + ArticleToolbar exist) | `ArticleReading` | Reading-progress hairline bar; breadcrumb + version chip; 3-col layout (sticky TOC + 720px reading + sticky figures/refs/versions rail); cite-popover with BibTeX/RIS/EndNote/APA/MLA/Chicago/Vancouver tabs; right rail with Reference[1] popover, Figures grid, Versions list. Uses `.reading.dropcap`. |
| 3 | `/current` | `apps/public-site/app/current/page.tsx` | `IssueDetail` | 2-col masthead (cover stack + 5-stat strip + actions), `double-rule` divider, sections-aside + grouped TOC with `marginalia-num` left margin and "current article" amber-soft highlight. |
| 4 | `/archive/[slug]` | exists | `IssueDetail` | Same component as `/current`, fed by slug. Shared component. |
| 5 | `/archive` | exists | (not in handoff) | **Decision needed:** apply visual style consistent with new tokens; no specific design. Suggest: cover-grid by year. |
| 6 | `/search` | `apps/public-site/app/search/page.tsx` (SearchInput, SearchFilters exist) | `SearchResults` | New filter sidebar shape (Year / Section / Type / Open Access groups, count per option, checked state); `<mark>` highlights in title + excerpt; pagination with cobalt-active page. |
| 7 | `/editorial` | `apps/public-site/app/editorial/page.tsx` | `EditorialBoard` | Centered intro + Senior editors grid (avatar gradient card + name + role + ORCID + tenure) + Associate editors stripe + Editorial advisory board 3-column flowing list. |
| 8 | `/articles/[slug]/stats` (NEW) | — | `ArticleStats` | KPI strip (5 cards w/ sparklines), big `LineChart` views vs downloads, two-col (Geographic + Discovery sources + Audience by discipline/career), Citations table. **New public route.** Add as `apps/public-site/app/articles/[slug]/stats/page.tsx`. |
| 9 | `/announcements` | exists | (uses public-site styles only — not in handoff) | apply token refresh. |
| 10 | `/about`, `/for-authors`, `/policies`, `/contact`, `/call-for-papers`, `/sign-in` | exist | (use static copy — not redesigned in handoff) | Token refresh + new `PublicHeader` only. |

### Editorial workspace (all screens reuse `AppShell` — sidebar stays, top utility-bar lifted)

| # | Route | Existing file | Handoff JSX | Delta |
|---|---|---|---|---|
| 11 | `/` | `routes/index.tsx` | (no dedicated dashboard in handoff — `AuthorDashboard` + `EditorQueue` are the role-flavoured equivalents) | Show role-flavoured landing (existing). Apply token refresh + role-aware StageStepper KPIs. |
| 12 | `/author/submissions` | `author/submissions.tsx` | `AuthorDashboard` | 3-card grid with `StageStepper` per card; amber halo + glow on action-needed card; "Recent activity" feed with monogram avatar. |
| 13 | `/author/submissions/new` | `author/submissions.new.tsx` (wizard exists) | `AuthorWizard` | 6-step horizontal stepper with check-pill; per-step requirements panel; i18n EN/RO toggle pill on Title / Abstract / Bio fields; tip card on cobalt-soft. |
| 14 | `/author/submissions/$id` | `author/submissions.$id.tsx` | (folded into `EditorWorkflow` — author view of same workflow) | Apply same 9-tab strip but with author-permitted tabs only; reuse the workflow scaffold. |
| 15 | `/reviewer/assignments` | exists | (handoff sidebar shows it as `Inbox · Assignments`) | Apply token refresh; queue table with countdown. |
| 16 | `/reviewer/assignments/$assignmentId` | exists | `ReviewerForm` (full) + `ReviewerFormCompact` | Use `ReviewerForm` (5-step: Recommendation / Comments / Confidential / Files / Confirm) with rich-text toolbar, star scale, anonymous-banner, sidebar with submission summary. |
| 17 | `/editor/queue` | `editor/queue.tsx` | `EditorQueue` | 5-stage stat strip with StageStepper inside each; quick-filter chips (`All N`, `Needs decision N`…); table grid `id+stepper / manuscript / section / reviewers+round+rec-dots / status / days / kebab`. |
| 18 | `/editor/submissions` | exists | (broader version of `EditorQueue`) | Same look, no stage filter. |
| 19 | `/editor/submissions/$id` | exists | `EditorWorkflow` | 9-tab strip (Workflow / Submission / Review / Editing / Production / Publication / Participants / Discussions / History); right column `StageStepper size=lg showLabels` plus editor/section-editor/decision-due card; per-round reviewer cards with `RecBadge` and excerpt blockquote; Decision Pending amber alert + Recommendations summary + Activity feed. |
| 20 | `/editor/issues` | exists | (no list view in handoff; new sub-route below for curation) | Apply token refresh; existing list. |
| 21 | `/editor/issues/$id/curate` (NEW) | — | `IssueCuration` | Drag-drop sectioned columns + Unassigned tray (dashed amber border) + sidebar with cover, metadata, pre-publish checklist. **Add a child route under `editor/issues`.** |
| 22 | `/editor/deposits` | exists | (not in handoff) | Token refresh only. |
| 23 | `/editor/publications/$id` | exists | `ProductionView` | 9-tab strip (Production active); 2-col: production-checklist + identifiers + galleys aside / JATS XML editor with side-by-side rendered HTML preview. |
| 24 | `/admin/announcements` | exists | `AdminAnnouncements` | 4-tab quick filter + 2-col grid of cards with `published`/`draft` chip, accent stripe at top of card, eye-icon view count. |
| 25 | `/admin/users` | exists | `AdminUsers` | Search bar + role-pill quick filter + table with avatar, name+email, role chips, affiliation italic, ORCID link/dash, status chip. |
| 26 | `/admin/stats` | exists (`stats.tsx`) | `AdminStats` | Five KPI cards w/ sparklines; LineChart submissions vs decisions; donut decision outcomes; HBar by section; Bars time-to-decision histogram + P50/P90/Mean/SLA; reviewer pool stats; geo HBar; reading-impact + indexing-health table. |
| 27 | `/admin/audit-log` | exists | `AuditLog` | Filter row + auto-refresh badge + dense table (timestamp · actor · action · detail · IP) with action token in mono coloured by type. |
| 28 | `/admin/settings` | exists | `JournalConfig` | Left-rail sub-nav (Identity / Branding / Publication / Sections / Genres / Languages / License & policies / DOI / Contact); Identity form (acronym/subtitle/founding year/frequency/publisher/country — already in V110 ✓); Sections table (drag handle, abbrev, title, review form, words-max, status, kebab); File genres grid; Languages chip row. |
| 29 | `/admin/email-templates` (NEW) | — | `AdminEmailTemplates` | Add as sub-route inside `/admin/settings/email-templates` (the only "missing" admin screen — language tabs EN/RO/FR/DE/ES, variable side-rail). **Decision needed**: introduce as a new sidebar item under Administration, or nest under Settings? README rule says don't add new top-level sidebar items unless feature exists — so nest under Settings. |
| 30 | `/admin/review-forms` (NEW) | — | `AdminReviewForm` | Same — nest under Settings. Drag-drop palette + form canvas + settings sidebar. |
| 31 | `/admin/integrations` (NEW) | — | `Integrations` | Cards for Crossref / ORCID / OAI-PMH / Google Scholar / DOAJ / Plaudit. Nest under Settings. |
| 32 | `/notifications` | exists | `Notifications` | Two-col: filter rail (All / Unread / Decisions / Reviews / Discussions / Submissions / System) + feed list with role-coloured icon tiles + unread blue-dot. |
| 33 | `/profile` | exists | `ProfilePage` | 3-col: photo + headline stats / personal-info form + affiliations card list + bio (EN/RO toggle) / identifiers + linked accounts + roles. |
| 34 | `/login`, `/register` | exist | (not in handoff) | Token refresh only. |

### Already-present primitives the handoff uses heavily

`StageStepper` (we have it), `Badge` (we have variants), `DropdownMenu` (Radix), `Tooltip` (Radix), `Icon` (lucide). All ready.

## 4. Backend gaps

> Modulith rule: every new endpoint/method goes in the owning module. Cross-module access via `Lookup` interface, never direct `Repository` import.

### 4.1 — Drag-drop issue ordering

- **Migration `V125__publication_issue_order.sql`**:
  ```sql
  ALTER TABLE publication
    ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX idx_publication_issue_order ON publication (issue_id, display_order)
    WHERE issue_id IS NOT NULL;
  ```
- **Endpoint** in `issue` module: `PATCH /api/v1/issues/{id}/articles { order: [publicationId, ...] }` — atomic transaction, validates all publications belong to the issue, sets `display_order` to the array position.
- **Endpoint** in `issue` module: `PATCH /api/v1/issues/{id}/articles/{publicationId}/section { sectionId }` — moves an article between sections within the same issue (curation also drags between sections).
- **Lookup**: `IssueLookup.listOrderedArticles(issueId)` — used by `publication` and `dashboard` modules. Returns `(publicationId, sectionId, displayOrder, pageStart, pageEnd, status)`.
- Existing `/current/page.tsx` and `/archive/[slug]/page.tsx` must consume the ordered list, not the unordered default.

### 4.2 — Search facets

`search` module already has `published_search_index` with `section_id`, `year`, `date_published`. Missing: `type` (Article/Book Review/Letter — comes from section metadata), `oa_flag` (always true today since journal is OA — but make it explicit), and faceted aggregation.

- **Migration `V130__search_facets.sql`**:
  ```sql
  ALTER TABLE published_search_index
    ADD COLUMN article_type VARCHAR(32) NOT NULL DEFAULT 'ARTICLE',
    ADD COLUMN open_access  BOOLEAN     NOT NULL DEFAULT TRUE;
  CREATE INDEX idx_search_index_type ON published_search_index (article_type);
  CREATE INDEX idx_search_index_oa ON published_search_index (open_access);
  ```
  Then backfill `article_type` from `journal_section.section_kind` (we may need to add `section_kind` enum to `journal_section`; check before — likely can derive from existing `abbrev`).
- **Endpoint**: `GET /api/v1/search?q={text}&year={list}&section={list}&type={list}&oa={bool}&from={n}&size={n}` — returns `{ hits: [...], facets: { year: {value, count}, section: {…}, type: {…}, oa: {true: n, false: n} }, total }`.
- Highlight snippets: PostgreSQL `ts_headline` with `<mark>…</mark>` markers — `SearchHit` already has the shape needed but needs a `highlightedSnippet` field.

### 4.3 — Citation export

- **Endpoint** in `publication` module: `GET /api/v1/publications/{id}/citation?format={bibtex|ris|endnote|apa|mla|chicago|vancouver}` — server-side rendering using `journal_config` + `publication` + `submission_author`. Returns `text/plain` with right `Content-Disposition` for downloads.
- All formats are deterministic from existing data (DOI, authors, title, year, issue, volume, pages). No new column needed.

### 4.4 — Library / save article (per-user reading list)

- **Migration `V135__user_library.sql`**:
  ```sql
  CREATE TABLE user_library_item (
      id           BIGSERIAL PRIMARY KEY,
      user_id      BIGINT      NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
      publication_id BIGINT    NOT NULL REFERENCES publication(id) ON DELETE CASCADE,
      saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      note         TEXT,
      UNIQUE (user_id, publication_id)
  );
  CREATE INDEX idx_library_user ON user_library_item (user_id, saved_at DESC);
  ```
- **Owning module**: new `library` module under `com.eneml.ajs.library` with `api/`, `internal/`, `package-info.java` and an `allowedDependencies = { identity, publication }`.
- **Endpoints**:
  - `POST /api/v1/me/library { publicationId, note? }`
  - `DELETE /api/v1/me/library/{publicationId}`
  - `GET /api/v1/me/library?from=&size=`
- `Save` button on article reading page calls these.

### 4.5 — Notifications feed

Existing: `/api/v1/notifications/unread-count` (Topbar uses it). Missing: full feed.

- Likely the messaging or audit module already emits the events — check before designing. **Decision needed:** is there a `notification` table, or is the feed derived on-the-fly from audit events filtered by `actor_id = current_user`?
- If brand-new:
  - **Migration `V140__notifications.sql`** — `notification(id, user_id, kind, title, body, ref_url, created_at, read_at, severity)`.
  - **Endpoints**:
    - `GET /api/v1/notifications?from=&size=&filter={all|unread|decisions|reviews|...}`
    - `POST /api/v1/notifications/{id}/read`
    - `POST /api/v1/notifications/read-all`

### 4.6 — Locale persistence on user

`app_user.locale VARCHAR(8) NOT NULL DEFAULT 'en'` **already exists** (V25). The handoff calls it `preferred_locale` — we keep ours. No migration needed.

- **Endpoint** `PATCH /api/v1/me/preferences { locale: "ro" }` in `identity` module — exists? **Verify before adding.** If missing, add.
- Resolution order on every request, server-side: `?lang=` → cookie → `app_user.locale` → `Accept-Language` → `en`. Implement in `apps/public-site/lib/locale.ts` (already has `resolveLocale()` — extend) and in editorial app via TanStack Router beforeLoad.

### 4.7 — Alternate-hreflang on public pages

- `apps/public-site/app/layout.tsx` `generateMetadata` must emit `<link rel="alternate" hreflang="en">`/`<link rel="alternate" hreflang="ro">` for every page that has a localized version. Since static copy lives only in EN/RO right now, `x-default` → EN.

### 4.8 — Editorial board, Indexing list, ISSN, Founding year, etc.

The handoff homepage and footer use a mix of fictional and config-derived strings:

- `ISSN 2069-3417` — **already in journal_config** (`onlineIssn` from V110). Use it.
- `EST. MCMLXXXVII · BUCHAREST` — Roman numeral of `foundingYear` + `cityOfPublication`. We have `foundingYear` (V110) and `countryOfPublication` (V110) but **no city** — `cityOfPublication` would be a new column. **Decision needed:** add it, or hide that line if not configured?
- `Vol. XII · № 4 · December 2026` — derived from current issue (`issue` module).
- Editorial board cards (`Elena Marinescu` etc.) — comes from `masthead` module which is already wired. Use real data.
- Indexing chips (Scopus / WoS / DOAJ / Crossref / DBLP / EBSCO / PubMed / Google Scholar) — **no model today**. New `indexing_membership(id, name, label, url, quartile, badge_color, sort_order)` table or enum. **Decision needed:** is this important enough to data-model, or is hard-coded list in `journal_config.indexed_in JSON` good enough?
- `MEMENTO · Q · LECTURIS` (footer eyebrow ornament) — fictional Latin tagline. **Decision needed:** keep as decorative (config-driven `journal_config.tagline`) or remove?
- `DOI Foundation Member · COPE Signatory · OAI-PMH 2.0` (footer right) — currently true facts about us; can be hard-coded in `PublicFooter` as static text since they're not user-decision-shaped.

### 4.9 — Publication metrics (already done — verify)

Article-stats KPIs (views / downloads / citations / altmetric / Mendeley) and time-series. We have `publication_metrics` + `publication_metric_daily` (V115/V120). Existing endpoints `/api/v1/publications/{id}/metrics`, `/api/v1/admin/stats/articles/timeseries`, `/details` cover most of it. **Likely missing:**
- Geo breakdown by country
- Discovery-source attribution (Google Scholar / Direct / Twitter / arXiv / …)
- Audience breakdown (Mendeley discipline / career stage)

These need either (a) a real analytics integration (Plausible / Matomo / Mendeley API) or (b) a simpler local-only model. **Decision needed.** Pragmatic option: stub the geo/discovery/audience tabs with explanatory copy until integration is wired (do not invent fake data on the live UI).

### 4.10 — Email templates, Review forms, Integrations admin screens

These are **builder UIs** for backend features:

- `email_template` — exists in `messaging` module? If yes, surface CRUD in admin. If no, new table.
- `review_form` builder — `review` module already has review forms (per-section). Surface as drag-drop builder.
- `integrations` health page — read existing module status (`integration` module). Endpoint: `GET /api/v1/admin/integrations/health`.

**Decision needed:** which of these three are in-scope for this redesign or do we ship them as "phase 2"? My recommendation: ship the **screens**, wire to existing data; if the data model isn't there, render a "Not yet configured — see settings" state. Don't invent new admin features under the design pretext.

## 5. UtilityBar / shared header surface

Per the handoff, the **same** utility row sits on both apps:

```
[ ISSN xxxx · OPEN ACCESS · Peer Reviewed · Indexed Scopus · WoS · Q1 ] ……  [ RSS  |  EN · · RO · DE · FR ⌄  |  Sign in / UserMenu ]
```

- New shared component `@ajs/ui/UtilityBar.tsx`. Props: `{ issn, indexing[], rssHref, signInHref, user?, onSignOut, locale, onLocaleChange }`.
- Public-site uses it as the top row of `PublicHeader`.
- Editorial: mount full-width above the `grid-cols-[244px_1fr]` of `AppShell`, so the utility row spans across the sidebar and topbar. Means restructuring `AppShell` from a two-column grid to a flex column wrapping (utility) + grid (sidebar+topbar+main).

Right-side switcher: `LanguageSwitcher` must be re-skinned to render the inline tail (`EN · · RO · DE · FR ⌄`) when `variant="inline"`. Existing dropdown variant (`Button` trigger) stays for editorial topbar fallback / mobile.

## 6. Locked decisions (signed off 2026-05-07)

1. **Locale set:** EN/RO only. `LanguageSwitcher` shows muted tail (`· DE · FR`) **as decorative visual only** — DE/FR/ES are not selectable until translations exist. Picking one is a no-op (or shows a "coming soon" tooltip).
2. **`cityOfPublication`:** **NO** new column. The eyebrow line `EST. {romanFoundingYear} · {city}` is replaced by `EST. {romanFoundingYear}` only. We compute the Roman numeral client-side from `foundingYear` (already in `journal_config` from V110). If `foundingYear` is null, hide the line entirely.
3. **Indexing memberships:** **YES** — proper data model. New migration `V128__indexing_memberships.sql` with table `indexing_membership(id, code, label, url, quartile_or_metric, sort_order, is_active)`. Owning module: `journal` (alongside masthead/sections). CRUD endpoint at `/api/v1/journal/indexing` (admin-only). Public site reads via `JournalLookup.listActiveIndexing()`.
4. **`tagline`:** **YES** — config field. Add `tagline VARCHAR(120)` and `tagline_ornament VARCHAR(60)` (e.g. `❦`) to `journal_config` in `V128` (same migration). Footer eyebrow + masthead taglines read from config; if null, hide that ornament strip.
5. **Drop-cap:** **YES** — apply `.reading.dropcap` to every published article body. No section gating.
6. **Per-article geo / discovery / audience:** No fake data. KPI strip + main views/downloads chart render fully (we have `publication_metrics` + `publication_metric_daily`). Geo / Discovery / Audience cards render an empty-state component "Detailed analytics not yet available — see overview metrics above." Don't ship Mendeley/Twitter/etc. until a real integration is wired.
7. **Open Call card on homepage:** Extend `announcement` table — `V127__announcement_call.sql` adds `kind VARCHAR(16) NOT NULL DEFAULT 'NEWS'` (values `NEWS`/`OPEN_CALL`/`POLICY`/`ACK`), `deadline_at TIMESTAMPTZ`, `cta_label VARCHAR(64)`, `cta_url VARCHAR(512)`, `guest_editors TEXT`. Homepage queries `latest published announcement WHERE kind='OPEN_CALL' AND deadline_at > now()` from `announcement` module via existing `AnnouncementLookup` (extend it).
8. **Email templates / Review forms / Integrations** admin screens: ship **full** implementation. Each existing module already has the data model — `messaging` has email templates, `review` has review forms, `integration` has health checks. Surface them in admin. If a specific gap surfaces during build, add a minor migration in that module's namespace (V14x range reserved).
9. **Editorial sidebar additions:** Confirmed approach. Nest under `/admin/settings/{email-templates|review-forms|integrations|sections}`. Skip Discussions / Production Schedule / Reviewers (no backing modules — would be inventing features under design pretext).

### Other locked-in defaults

- **Token replacement vs additive:** Replace existing token values where names collide (small but intentional bump), add all new tokens. No `--bg-premium` parallel namespace.
- **Issue curation route:** `/editor/issues/$id/curate` (TanStack file `editor/issues.$id.curate.tsx`).
- **`ArticleStats` route:** Public, lives at `/articles/[slug]/stats`.
- **PR/commit cadence:** One PR per phase (A–H), 6–10 atomic commits inside each. Push after each phase. English commit subjects, < 60 chars, no `Co-Authored-By: Claude`.
- **Migration version reservations:** V125 (publication.display_order), V127 (announcement call kinds), V128 (indexing + journal_config tagline), V130 (search facets), V135 (user_library), V140 (notifications, only if missing).

## 7. Order of work — atomic commits

Aim is one logical change per commit, short imperative subject (< 60 chars), no `Co-Authored-By: Claude`. Push after each phase.

### Phase A — Foundations (no UI change yet)

1. `port handoff tokens to packages/ui/tokens.css` — overwrite all values, add new ones, no class additions yet.
2. `add typography utilities (sc/folio/marginalia/numeral/cite-pill)` — class additions only.
3. `add reading typography overrides + dropcap + blockquote`
4. `add ornaments — fleuron, triple-rule, paper, ink-bg, cover-paper, grain`
5. `add btn ladder — btn-amber, btn-lg + gradients on btn-primary`
6. `add chip ladder — chip-ink, chip-mono variants`

### Phase B — Primitive deltas

7. `extend Button with size=lg + amber variant`
8. `extend Badge with ink variant`
9. `lift CoverArt + Sparkline + OrcidBadge + DoiChip into @ajs/ui`
10. `add UtilityBar primitive in @ajs/ui`
11. `extend LanguageSwitcher with inline-tail variant`
12. `add icons missing from lucide subset (rss/history/panel/sparkles/...)`

### Phase C — Shared header surface

13. `mount UtilityBar across public site PublicHeader`
14. `mount UtilityBar above editorial AppShell — restructure shell layout`

### Phase D — Public site rebuild (one screen per commit)

15. `rebuild public homepage hero + cover stack`
16. `add featured articles list with sparklines + marginalia`
17. `add three-up scope/board/indexing panel`
18. `add ink-bg open call card`
19. `redesign public footer with masthead ornament`
20. `rebuild article reading page — 3-col + dropcap`
21. `add cite popover with format tabs`
22. `add article right rail — figures grid, references popover, versions`
23. `rebuild issue detail page — masthead + grouped TOC`
24. `redesign search results — facets + mark highlights + pagination`
25. `rebuild editorial board page`
26. `add /articles/[slug]/stats route`

### Phase E — Editorial workspace rebuild

27. `port editorial sidebar visual upgrade — keep nav data, restyle rows`
28. `rebuild author dashboard — 3-card grid + activity feed`
29. `rebuild author wizard — step strip + i18n field toggle`
30. `rebuild reviewer queue + reviewer form 5-step`
31. `rebuild editor queue — stage strip + table`
32. `rebuild editor workflow detail — 9-tab + reviewer cards`
33. `add /editor/issues/$id/curate route + drag-drop component (frontend wired to mock)`
34. `rebuild publication production view — JATS side-by-side`

### Phase F — Backend gaps

35. `V125 — publication.display_order + index`
36. `add issue article ordering endpoints`
37. `wire issue curation drag-drop to backend`
38. `V130 — search facets columns + index`
39. `expand SearchService with facets + ts_headline`
40. `wire search page to faceted backend`
41. `add citation export endpoint (bibtex/ris/endnote/apa/mla/chicago/vancouver)`
42. `wire cite popover to backend`
43. `V135 — user_library + library module skeleton`
44. `add library endpoints + Save button wiring`
45. `add notifications feed endpoint (or wire to existing audit feed)`
46. `wire notifications page to backend`
47. `add PATCH /api/v1/me/preferences { locale }` (verify if missing)
48. `extend resolveLocale order — query → cookie → user → accept-language → en`
49. `add hreflang alternates to public-site generateMetadata`

### Phase G — Admin screens

50. `rebuild admin/users page`
51. `rebuild admin/announcements page`
52. `rebuild admin/audit-log page`
53. `rebuild admin/stats dashboard with new charts`
54. `add admin/settings sub-nav + journal config`
55. `add admin/settings/email-templates route` (only if module supports)
56. `add admin/settings/review-forms route` (only if module supports)
57. `add admin/settings/integrations route` (read existing integration module)

### Phase H — Polish & QA

58. `axe-core a11y pass — run pnpm preview + verify WCAG 2.2 AA on every page`
59. `verify EN/RO copy on every new screen via i18n keys`
60. `validate no existing route renamed or deleted (diff route tree)`
61. `validate no module boundary violations (./mvnw modulith verify or similar)`

## 8. Hard constraints I'll enforce

- **No route renames or deletions.** Every existing path in `apps/editorial/src/routes/` and `apps/public-site/app/` continues to resolve.
- **No new top-level sidebar items unless feature exists.** Email templates / review forms / integrations nest under `/admin/settings/*`.
- **No OJS / PKP attribution** in code or comments.
- **Atomic commits, English subjects, < 60 chars.**
- **Backend cross-module:** add a `Lookup` method, never import another module's repo.
- **Tests stay green:** `pnpm type-check && pnpm build` and `mvn -q compile` before each commit.
- **WCAG 2.2 AA** verified on each screen before push.
- **No fake data.** If backend is missing, render "Not yet available" state, don't invent.
- **Industry defaults OK** (`postgres:17-alpine`, BCP-47 regexes), **user-decision values asked** (locale set, ISSN, board names, tagline).
- **Frontend dev:** stage explicit paths under `frontend/` and `src/main/`, never `git add -A`.
- **Java 25** at `/Users/eml/Library/Java/JavaVirtualMachines/jdk-25.0.3+9/Contents/Home` — do not downgrade.
- **Spring boot main class:** `JournalApplication` (NOT `AjsApplication`).
- **Login form preview:** `admin@journal.local / rootroot` + `document.querySelector('form').requestSubmit()`.

## 9. Open questions to resolve before `/plan`

1. Confirm the 9 decision points in §6.
2. Confirm I should put the new admin screens (email-templates / review-forms / integrations) under `/admin/settings/*` and not under their own top-level sidebar items.
3. Confirm `IssueCuration` route as `/editor/issues/$id/curate` (TanStack file route `editor/issues.$id.curate.tsx`) — alternative is `/editor/issues/$id` (single page with curation as default tab).
4. Confirm whether `/articles/[slug]/stats` is a public route (handoff implies it is, since `PublicHeader`+`PublicFooter` wrap it) or admin-only.
5. Confirm scope: should I implement the Email Templates / Review Forms / Integrations admin screens fully now (including missing backend), or as visual stubs only with copy "Configuration coming soon"?
6. Token replacement vs additive: I will **replace** existing token values with handoff values where a name collides (since the diff is small but intentional), and **add** all new tokens. Confirm — the alternative is shipping `--bg-premium` etc. side-by-side, which I think is wrong.
7. Number of phases (A–H) is 8. OK as bundles of commits, or do you want each phase as a separate PR?

---

**Stop here.** Awaiting your sign-off / corrections before `/plan` of Phase A.
