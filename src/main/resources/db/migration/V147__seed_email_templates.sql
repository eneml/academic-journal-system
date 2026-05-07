-- =================================================================
-- Default EN + RO subject + body for every canonical email template
-- key bootstrap creates on startup. Idempotent on re-run via
-- ON CONFLICT DO NOTHING — operators who edited a row through the
-- admin UI keep their copy. The bootstrap routine guarantees the
-- email_template parent rows exist before this migration runs in
-- fresh installs (it's a JPA application runner that fires after
-- Flyway).
--
-- We deliberately mark these rows as is_custom=FALSE so the admin
-- table shows them as "default" and the operator can tell at a glance
-- which they've never customised.
-- =================================================================

-- ----------------------------------------------------------------
-- ensure parent rows exist for every canonical key. The bootstrap
-- runner does this on startup, but a fresh database needs the rows
-- in place *before* the locale rows below land — so we upsert.
-- ----------------------------------------------------------------
INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('submission.acknowledgement',                       'Sent to the corresponding author once a submission is finalised.',                              TRUE, FALSE),
    ('submission.needsEditor',                           'Sent to managers + editors when a fresh submission lands in the queue.',                       TRUE, FALSE),
    ('decision.accept.notifyAuthor',                     'Sent to the author when an editor accepts the manuscript.',                                    TRUE, FALSE),
    ('decision.decline.notifyAuthor',                    'Sent to the author when an editor declines after review.',                                     TRUE, FALSE),
    ('decision.initialDecline.notifyAuthor',             'Sent to the author when a desk-rejection happens before review.',                              TRUE, FALSE),
    ('decision.requestRevisions.notifyAuthor',           'Sent to the author when revisions are requested in the same round.',                           TRUE, FALSE),
    ('decision.resubmit.notifyAuthor',                   'Sent to the author when a resubmission with a new round is required.',                         TRUE, FALSE),
    ('decision.newReviewRound.notifyAuthor',             'Sent to the author when a new external review round opens.',                                   TRUE, FALSE),
    ('decision.cancelReviewRound.notifyAuthor',          'Sent to the author when an open review round is cancelled.',                                   TRUE, FALSE),
    ('decision.sendToProduction.notifyAuthor',           'Sent to the author when the manuscript moves into production.',                                TRUE, FALSE),
    ('decision.backFromProduction.notifyAuthor',         'Sent to the author when a manuscript is reverted out of production.',                          TRUE, FALSE),
    ('decision.backFromCopyediting.notifyAuthor',        'Sent to the author when a manuscript is reverted out of copyediting.',                         TRUE, FALSE),
    ('decision.skipReview.notifyAuthor',                 'Sent to the author when an editor accepts without external review.',                           TRUE, FALSE),
    ('decision.generic.notifyAuthor',                    'Generic editorial update — used as the fallback key for novel decision types.',                TRUE, FALSE),
    ('review.request',                                   'Sent to a reviewer with the initial assignment invitation.',                                   TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;


-- ================================================================
-- EN locale rows
-- ================================================================

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'We received your submission to {{journal.name}}',
$$Dear {{recipient.givenName}},

Thank you for submitting "{{submission.title}}" to {{journal.name}}. Your manuscript is now in our editorial queue. An editor will be assigned shortly and you can follow the workflow at any time here:

  {{submission.url}}

If you need to update the file or add information, you can do so from the same page until an editor is assigned.

The Editorial Team
{{journal.name}}
{{journal.url}}$$
FROM email_template WHERE key = 'submission.acknowledgement'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'New submission needs an editor: "{{submission.title}}"',
$$Hello {{recipient.givenName}},

A new manuscript has just landed in the editorial queue:

  Title: {{submission.title}}
  Submission ID: {{submission.id}}

Please open the editor view to assign yourself or another editor and start the triage:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'submission.needsEditor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Your manuscript "{{submission.title}}" has been accepted',
$$Dear {{recipient.givenName}},

We are pleased to confirm that your manuscript "{{submission.title}}" has been accepted for publication in {{journal.name}}.

Your submission now moves into the copyediting and production stages. We will be in touch with the next steps; you can follow progress here at any time:

  {{submission.url}}

Congratulations, and thank you for choosing {{journal.name}} for your work.

{{sender.fullName}}
Editorial Team — {{journal.name}}
{{journal.url}}$$
FROM email_template WHERE key = 'decision.accept.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Editorial decision on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

After careful consideration of the reviewers' reports, we regret to inform you that your manuscript "{{submission.title}}" cannot be accepted for publication in {{journal.name}}.

The full decision and the reviewers' comments are available here:

  {{submission.url}}

We thank you for considering {{journal.name}} for your work and wish you the best with your research.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.decline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Editorial decision on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

After an initial editorial review, we have decided not to send your manuscript "{{submission.title}}" out for external peer review. The reasons for this decision and any feedback the editor wished to share are available on the submission page:

  {{submission.url}}

This decision relates only to fit with {{journal.name}}; it does not preclude submission elsewhere. We thank you for considering us.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.initialDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Revisions requested on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

The reviewers have completed their assessment of "{{submission.title}}" and a decision of "revisions requested" has been recorded. Please address the comments from the reviewers and the editor, then upload your revised manuscript on the submission page:

  {{submission.url}}

The same review round will continue once your revision is submitted, so the same reviewers may be invited back to assess your changes.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.requestRevisions.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Resubmission requested for "{{submission.title}}"',
$$Dear {{recipient.givenName}},

Following the reviewers' assessment of "{{submission.title}}", the editor has asked for substantive changes that warrant a fresh review round once your revised manuscript is uploaded.

Please prepare a revised version that addresses the reviewers' and editor's comments, then submit it on the same page:

  {{submission.url}}

A new round of external review will be opened once we receive the resubmission.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.resubmit.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'A new review round has started for "{{submission.title}}"',
$$Dear {{recipient.givenName}},

A new round of external peer review has been opened for your manuscript "{{submission.title}}". You will hear from us once the new reviewers' reports are in. You can follow the progress at any time here:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.newReviewRound.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Review round cancelled for "{{submission.title}}"',
$$Dear {{recipient.givenName}},

The current review round on "{{submission.title}}" has been cancelled. The editor will follow up on the next steps; in the meantime no action is required from you.

You can follow the workflow status here:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.cancelReviewRound.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       '"{{submission.title}}" is moving into production',
$$Dear {{recipient.givenName}},

Copyediting on your manuscript "{{submission.title}}" is complete and we are now moving the article into production. You will be contacted once proofs are ready for review.

Workflow status:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.sendToProduction.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Workflow update on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

Your manuscript "{{submission.title}}" has been moved back from production to the copyediting stage so the editorial team can address some final issues. We will resume production once those are resolved.

Workflow status:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.backFromProduction.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Workflow update on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

Your manuscript "{{submission.title}}" has been moved back from copyediting so the editorial team can address some final issues with the accepted version. Copyediting will resume once those are resolved.

Workflow status:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.backFromCopyediting.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Your manuscript "{{submission.title}}" has been accepted',
$$Dear {{recipient.givenName}},

After an initial editorial review, we are pleased to accept your manuscript "{{submission.title}}" for publication in {{journal.name}}. Given the scope and quality of the work the editor has accepted it without external peer review.

Your submission now moves into the copyediting and production stages. We will be in touch with the next steps; you can follow progress here:

  {{submission.url}}

Congratulations, and thank you for choosing {{journal.name}}.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.skipReview.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Editorial update on "{{submission.title}}"',
$$Dear {{recipient.givenName}},

There has been an editorial update on your manuscript "{{submission.title}}" ({{decision.type}}). Please open the submission page for the full details:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.generic.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Review request from {{journal.name}}',
$$Dear {{recipient.givenName}},

You have been invited to review a manuscript for {{journal.name}}. The editor selected you because of your expertise in the subject area and we would be very grateful for your assessment.

Please respond to the invitation — accept or decline — at the link below. If you accept, the manuscript files and the review form will be available there:

  {{assignment.url}}

If you have any questions before deciding, please reply to this email.

With thanks,
The Editorial Team
{{journal.name}}$$
FROM email_template WHERE key = 'review.request'
ON CONFLICT (template_id, locale) DO NOTHING;


-- ================================================================
-- RO locale rows
-- ================================================================

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Am primit articolul dumneavoastră pentru {{journal.name}}',
$$Bună ziua, {{recipient.givenName}},

Vă confirmăm primirea articolului „{{submission.title}}" la {{journal.name}}. Manuscrisul se află acum în coada redacțională. Un editor vă va fi alocat în scurt timp și puteți urmări fluxul în orice moment aici:

  {{submission.url}}

Dacă mai trebuie să actualizați fișierul sau să adăugați informații, o puteți face din aceeași pagină până la alocarea unui editor.

Cu stimă,
Echipa redacțională
{{journal.name}}
{{journal.url}}$$
FROM email_template WHERE key = 'submission.acknowledgement'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Articol nou în coada de triaj: „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

Tocmai a fost depus un manuscris nou în coada redacțională:

  Titlu: {{submission.title}}
  ID articol: {{submission.id}}

Deschideți vederea de editor pentru a vă aloca pe dumneavoastră sau un alt editor și a începe triajul:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'submission.needsEditor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Manuscrisul „{{submission.title}}" a fost acceptat',
$$Bună ziua, {{recipient.givenName}},

Avem plăcerea să vă confirmăm că manuscrisul „{{submission.title}}" a fost acceptat pentru publicare în {{journal.name}}.

Articolul intră acum în etapele de copyediting și producție. Veți fi contactat în privința pașilor următori; puteți urmări evoluția aici, în orice moment:

  {{submission.url}}

Felicitări și mulțumim că ați ales {{journal.name}} pentru munca dumneavoastră.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}
{{journal.url}}$$
FROM email_template WHERE key = 'decision.accept.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Decizie redacțională privind „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

După analiza atentă a rapoartelor recenzorilor, regretăm să vă comunicăm că manuscrisul „{{submission.title}}" nu poate fi acceptat pentru publicare în {{journal.name}}.

Decizia integrală și comentariile recenzorilor sunt disponibile aici:

  {{submission.url}}

Vă mulțumim că ați luat în considerare {{journal.name}} pentru munca dumneavoastră și vă urăm succes în continuarea cercetării.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.decline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Decizie redacțională privind „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

În urma evaluării redacționale inițiale, am decis să nu trimitem manuscrisul „{{submission.title}}" la peer review extern. Motivele acestei decizii și eventualele observații pe care editorul a dorit să le împărtășească sunt disponibile pe pagina articolului:

  {{submission.url}}

Această decizie privește exclusiv potrivirea cu {{journal.name}} și nu împiedică în niciun fel depunerea în alte reviste. Vă mulțumim că ne-ați luat în considerare.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.initialDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Revizii solicitate pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

Recenzorii au finalizat evaluarea articolului „{{submission.title}}", iar decizia înregistrată este „revizii solicitate". Vă rugăm să adresați comentariile recenzorilor și ale editorului, apoi să încărcați manuscrisul revizuit pe pagina articolului:

  {{submission.url}}

Aceeași rundă de evaluare va continua după depunerea reviziei, deci este posibil ca aceiași recenzori să fie invitați să vă evalueze modificările.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.requestRevisions.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Repunere solicitată pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

În urma evaluării recenzorilor pentru „{{submission.title}}", editorul a solicitat modificări substanțiale care justifică o nouă rundă de evaluare după depunerea manuscrisului revizuit.

Vă rugăm să pregătiți o versiune revizuită care răspunde comentariilor recenzorilor și ale editorului, apoi să o încărcați pe aceeași pagină:

  {{submission.url}}

O nouă rundă de peer review extern va fi deschisă după primirea repunerii.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.resubmit.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'O nouă rundă de evaluare a fost deschisă pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

A fost deschisă o nouă rundă de peer review extern pentru manuscrisul „{{submission.title}}". Vă vom contacta din nou când vor fi gata noile rapoarte. Puteți urmări evoluția în orice moment aici:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.newReviewRound.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Runda de evaluare anulată pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

Runda curentă de evaluare pentru „{{submission.title}}" a fost anulată. Editorul vă va contacta privind pașii următori; deocamdată nu este nevoie de nicio acțiune din partea dumneavoastră.

Puteți urmări starea fluxului redacțional aici:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.cancelReviewRound.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       '„{{submission.title}}" intră în producție',
$$Bună ziua, {{recipient.givenName}},

Etapa de copyediting pentru manuscrisul „{{submission.title}}" s-a încheiat și articolul intră în producție. Veți fi contactat când șpaltul este pregătit pentru verificare.

Stare flux redacțional:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.sendToProduction.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Actualizare flux redacțional pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

Manuscrisul dumneavoastră „{{submission.title}}" a fost readus din producție în etapa de copyediting pentru ca echipa redacțională să rezolve câteva probleme finale. Producția va fi reluată după soluționarea acestora.

Stare flux redacțional:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.backFromProduction.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Actualizare flux redacțional pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

Manuscrisul dumneavoastră „{{submission.title}}" a fost readus din copyediting pentru ca echipa redacțională să rezolve câteva probleme finale ale versiunii acceptate. Copyeditingul va fi reluat după soluționarea acestora.

Stare flux redacțional:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.backFromCopyediting.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Manuscrisul „{{submission.title}}" a fost acceptat',
$$Bună ziua, {{recipient.givenName}},

În urma evaluării redacționale inițiale, avem plăcerea să acceptăm manuscrisul „{{submission.title}}" pentru publicare în {{journal.name}}. Având în vedere domeniul și calitatea lucrării, editorul l-a acceptat fără peer review extern.

Articolul intră acum în etapele de copyediting și producție. Veți fi contactat în privința pașilor următori; puteți urmări evoluția aici:

  {{submission.url}}

Felicitări și mulțumim că ați ales {{journal.name}}.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.skipReview.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Actualizare redacțională pentru „{{submission.title}}"',
$$Bună ziua, {{recipient.givenName}},

A fost înregistrată o actualizare redacțională asupra manuscrisului „{{submission.title}}" ({{decision.type}}). Vă rugăm să deschideți pagina articolului pentru detalii complete:

  {{submission.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'decision.generic.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Invitație la evaluare din partea {{journal.name}}',
$$Bună ziua, {{recipient.givenName}},

Sunteți invitat(ă) să evaluați un manuscris pentru {{journal.name}}. Editorul v-a selectat datorită expertizei dumneavoastră în domeniu și v-am fi recunoscători pentru o evaluare.

Vă rugăm să răspundeți invitației — accept sau refuz — la linkul de mai jos. Dacă acceptați, fișierele articolului și formularul de evaluare vor fi disponibile acolo:

  {{assignment.url}}

Dacă aveți întrebări înainte de a decide, vă rugăm să răspundeți la acest email.

Cu mulțumiri,
Echipa redacțională
{{journal.name}}$$
FROM email_template WHERE key = 'review.request'
ON CONFLICT (template_id, locale) DO NOTHING;
