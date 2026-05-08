-- =================================================================
-- Seed EN + RO copy for the three reviewer-action email keys
-- introduced in Phase 9.
--   - review.acknowledgement: editor confirms a completed review
--   - review.unassign:        reviewer removed from an open assignment
--   - review.reinstate:       a previously declined assignment is
--                             reopened (status flips back to AWAITING)
-- Mirrors the V147/V172/V174 pattern.
-- =================================================================

INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('review.acknowledgement',
     'Sent to the reviewer when an editor confirms a completed review.',
     TRUE, FALSE),
    ('review.unassign',
     'Sent to the reviewer when their assignment is unassigned by an editor.',
     TRUE, FALSE),
    ('review.reinstate',
     'Sent to the reviewer when a previously declined assignment is reinstated.',
     TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------
-- EN
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Thank you for your review',
$$Dear {{recipient.givenName}},

Thank you for completing your review for {{journal.name}}. Your evaluation has been received and confirmed by the editor.

We greatly appreciate the time and expertise you contributed. The decision letter to the author will reflect the recommendations from this round of review.

If you would like to access your submitted review again, you can do so here:

  {{assignment.url}}

With our thanks,
The Editorial Team
{{journal.name}}$$
FROM email_template WHERE key = 'review.acknowledgement'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Review assignment withdrawn',
$$Dear {{recipient.givenName}},

We are writing to let you know that your review assignment for {{journal.name}} has been withdrawn by the editor. No further action is required from you on this manuscript.

Thank you for the time you set aside to consider this review. We hope to be in touch again with another invitation in the future.

With thanks,
The Editorial Team
{{journal.name}}$$
FROM email_template WHERE key = 'review.unassign'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Review invitation reopened',
$$Dear {{recipient.givenName}},

Your previously declined review assignment for {{journal.name}} has been reinstated by the editor. We would be very grateful if you would reconsider taking on this review.

Please respond to the invitation — accept or decline — at the link below. If you accept, the manuscript files and the review form will be available there:

  {{assignment.url}}

If circumstances make it impossible for you to take on the review, simply decline at the link above and you will not be contacted further about this manuscript.

With thanks,
The Editorial Team
{{journal.name}}$$
FROM email_template WHERE key = 'review.reinstate'
ON CONFLICT (template_id, locale) DO NOTHING;

-- ----------------------------------------------------------------
-- RO
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Vă mulțumim pentru evaluare',
$$Bună ziua, {{recipient.givenName}},

Vă mulțumim pentru finalizarea evaluării pentru {{journal.name}}. Evaluarea dumneavoastră a fost primită și confirmată de către editor.

Apreciem foarte mult timpul și expertiza pe care le-ați investit. Decizia comunicată autorului va reflecta recomandările din această rundă de evaluare.

Dacă doriți să accesați din nou evaluarea pe care ați trimis-o, o puteți face aici:

  {{assignment.url}}

Cu mulțumiri,
Echipa redacțională
{{journal.name}}$$
FROM email_template WHERE key = 'review.acknowledgement'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Atribuirea de evaluator a fost retrasă',
$$Bună ziua, {{recipient.givenName}},

Vă comunicăm că atribuirea dumneavoastră ca evaluator pentru {{journal.name}} a fost retrasă de către editor. Nu este necesară nicio acțiune din partea dumneavoastră asupra acestui manuscris.

Vă mulțumim pentru timpul alocat pentru a lua în considerare această evaluare. Sperăm să vă contactăm din nou cu o altă invitație în viitor.

Cu mulțumiri,
Echipa redacțională
{{journal.name}}$$
FROM email_template WHERE key = 'review.unassign'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Invitația la evaluare a fost redeschisă',
$$Bună ziua, {{recipient.givenName}},

Atribuirea dumneavoastră ca evaluator pentru {{journal.name}}, anterior refuzată, a fost reînnoită de către editor. V-am fi recunoscători dacă ați reconsidera acceptarea acestei evaluări.

Vă rugăm să răspundeți invitației — accept sau refuz — la linkul de mai jos. Dacă acceptați, fișierele articolului și formularul de evaluare vor fi disponibile acolo:

  {{assignment.url}}

Dacă circumstanțele nu vă permit să acceptați evaluarea, refuzați pur și simplu la linkul de mai sus și nu veți mai fi contactat(ă) în legătură cu acest manuscris.

Cu mulțumiri,
Echipa redacțională
{{journal.name}}$$
FROM email_template WHERE key = 'review.reinstate'
ON CONFLICT (template_id, locale) DO NOTHING;
