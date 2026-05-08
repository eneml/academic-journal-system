-- =================================================================
-- Phase 13 — monthly editorial reminder (to editors with open work)
-- and statistics report (to admins, KPIs from dashboard::api).
-- =================================================================

INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('editorial.reminder',
     'Monthly nudge to editors with open editorial work.',
     TRUE, FALSE),
    ('editorial.statisticsReport',
     'Monthly KPI digest sent to admins.',
     TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------
-- EN
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Editorial digest from {{journal.name}}',
$$Hello {{recipient.givenName}},

This is the monthly nudge from {{journal.name}}. Editorial work is waiting in your queue:

  {{editorial.dashboardUrl}}

Some items move faster when an editor checks in — assignments, decisions to record, discussions with authors. If everything's already in order, you can ignore this email.

Thank you for your service to peer review.

— {{journal.name}}$$
FROM email_template WHERE key = 'editorial.reminder'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       '{{journal.name}} — monthly statistics report',
$$Hello {{recipient.givenName}},

Here is this month's digest of editorial activity for {{journal.name}}:

  Submissions year-to-date:           {{stats.submissionsYtd}}
  Articles published year-to-date:    {{stats.articlesPublishedYtd}}
  Acceptance rate (closed decisions): {{stats.acceptanceRatePct}}%
  Active reviewers (last 90 days):    {{stats.activeReviewers}}
  Total decisions considered:         {{stats.totalDecisions}}

Detailed breakdowns are available on the admin Statistics page:

  {{editorial.statsUrl}}

— {{journal.name}}$$
FROM email_template WHERE key = 'editorial.statisticsReport'
ON CONFLICT (template_id, locale) DO NOTHING;

-- ----------------------------------------------------------------
-- RO
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Raport editorial de la {{journal.name}}',
$$Bună ziua, {{recipient.givenName}},

Acesta este reminder-ul lunar de la {{journal.name}}. Există lucrări editoriale care vă așteaptă în coadă:

  {{editorial.dashboardUrl}}

Unele articole avansează mai repede când un editor verifică — atribuiri, decizii de înregistrat, discuții cu autorii. Dacă totul e deja în ordine, puteți ignora acest mesaj.

Vă mulțumim pentru contribuția la procesul de peer review.

— {{journal.name}}$$
FROM email_template WHERE key = 'editorial.reminder'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       '{{journal.name}} — raport lunar de statistici',
$$Bună ziua, {{recipient.givenName}},

Iată raportul lunar al activității editoriale pentru {{journal.name}}:

  Manuscrise primite anul curent:       {{stats.submissionsYtd}}
  Articole publicate anul curent:       {{stats.articlesPublishedYtd}}
  Rata de acceptare (decizii închise):  {{stats.acceptanceRatePct}}%
  Recenzori activi (ultimele 90 zile):  {{stats.activeReviewers}}
  Decizii totale considerate:           {{stats.totalDecisions}}

Detalii suplimentare sunt disponibile pe pagina admin Statistics:

  {{editorial.statsUrl}}

— {{journal.name}}$$
FROM email_template WHERE key = 'editorial.statisticsReport'
ON CONFLICT (template_id, locale) DO NOTHING;
