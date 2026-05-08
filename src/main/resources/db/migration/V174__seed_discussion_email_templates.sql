-- =================================================================
-- Seed EN + RO copy for the two discussion email keys introduced
-- in Phase 7. Mirrors the V147/V172 pattern.
-- =================================================================

INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('discussion.opened',
     'Sent to participants when a workflow discussion is opened.',
     TRUE, FALSE),
    ('discussion.message',
     'Sent to participants when a new message is posted to a workflow discussion.',
     TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------
-- EN
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'New discussion: {{discussion.subject}}',
$$Hello {{recipient.givenName}},

{{sender.fullName}} has opened a new discussion on the manuscript "{{submission.title}}":

  Subject: {{discussion.subject}}

You are listed as a participant. Open the thread here to read and reply:

  {{discussion.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'discussion.opened'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'New message in: {{discussion.subject}}',
$$Hello {{recipient.givenName}},

{{sender.fullName}} posted a new message in the discussion "{{discussion.subject}}" on the manuscript "{{submission.title}}".

Open the thread to read and reply:

  {{discussion.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'discussion.message'
ON CONFLICT (template_id, locale) DO NOTHING;

-- ----------------------------------------------------------------
-- RO
-- ----------------------------------------------------------------

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Discuție nouă: {{discussion.subject}}',
$$Bună ziua, {{recipient.givenName}},

{{sender.fullName}} a deschis o nouă discuție privind manuscrisul „{{submission.title}}":

  Subiect: {{discussion.subject}}

Sunteți listat ca participant. Deschideți discuția aici pentru a citi și răspunde:

  {{discussion.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'discussion.opened'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Mesaj nou în: {{discussion.subject}}',
$$Bună ziua, {{recipient.givenName}},

{{sender.fullName}} a postat un mesaj nou în discuția „{{discussion.subject}}" privind manuscrisul „{{submission.title}}".

Deschideți discuția pentru a citi și răspunde:

  {{discussion.url}}

— {{journal.name}}$$
FROM email_template WHERE key = 'discussion.message'
ON CONFLICT (template_id, locale) DO NOTHING;
