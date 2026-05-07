-- =================================================================
-- Seed EN + RO copy for the two revert decision keys introduced in
-- Phase 5. The bootstrap runner creates the parent rows on startup;
-- this migration just lays in the locale rows. Idempotent — operators
-- who edited a row through the admin UI keep their copy.
-- =================================================================

INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('decision.revertDecline.notifyAuthor',
     'Sent to the author when a previous decline is reversed and the submission re-enters review.',
     TRUE, FALSE),
    ('decision.revertInitialDecline.notifyAuthor',
     'Sent to the author when a previous desk-rejection is reversed and the submission re-enters the queue.',
     TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------
-- EN
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Your manuscript "{{submission.title}}" is back in review',
$$Dear {{recipient.givenName}},

We are writing to let you know that the previous decline of your manuscript "{{submission.title}}" has been reversed. The submission is back under editorial review at {{journal.name}}.

You can follow the workflow at any time here:

  {{submission.url}}

We apologise for the back-and-forth and will be in touch with the next steps shortly.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.revertDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'Your manuscript "{{submission.title}}" is back in the queue',
$$Dear {{recipient.givenName}},

We are writing to let you know that the previous desk decision on your manuscript "{{submission.title}}" has been reversed. Your submission is back in the editorial queue at {{journal.name}} for a fresh look.

You can follow the workflow at any time here:

  {{submission.url}}

We apologise for the back-and-forth and will be in touch with the next steps shortly.

{{sender.fullName}}
Editorial Team — {{journal.name}}$$
FROM email_template WHERE key = 'decision.revertInitialDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

-- ----------------------------------------------------------------
-- RO
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Manuscrisul „{{submission.title}}" revine în evaluare',
$$Bună ziua, {{recipient.givenName}},

Vă scriem pentru a vă informa că respingerea anterioară a manuscrisului „{{submission.title}}" a fost retrasă. Articolul revine în evaluarea redacțională la {{journal.name}}.

Puteți urmări fluxul în orice moment aici:

  {{submission.url}}

Ne cerem scuze pentru această ezitare și vă vom contacta în scurt timp cu pașii următori.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.revertDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Manuscrisul „{{submission.title}}" revine în coadă',
$$Bună ziua, {{recipient.givenName}},

Vă scriem pentru a vă informa că decizia redacțională inițială asupra manuscrisului „{{submission.title}}" a fost retrasă. Articolul revine în coada redacțională la {{journal.name}} pentru o nouă evaluare.

Puteți urmări fluxul în orice moment aici:

  {{submission.url}}

Ne cerem scuze pentru această ezitare și vă vom contacta în scurt timp cu pașii următori.

{{sender.fullName}}
Echipa redacțională — {{journal.name}}$$
FROM email_template WHERE key = 'decision.revertInitialDecline.notifyAuthor'
ON CONFLICT (template_id, locale) DO NOTHING;
