-- =================================================================
-- Phase 20 — invitation mail. One template per type so the wording can
-- diverge if reviewers vs editors get invited; for now the same body
-- with the type interpolated.
-- =================================================================

INSERT INTO email_template (key, description, enabled, is_custom)
VALUES
    ('invitation.created',
     'Sent when an editor invites a non-user to join the journal in some role.',
     TRUE, FALSE)
ON CONFLICT (key) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'en',
       'You have been invited to {{journal.name}}',
$$Hello,

The editors at {{journal.name}} have invited you to join the journal as a {{invitation.type}}. Click the link below to accept the invitation and finish setting up your account:

  {{invitation.acceptUrl}}

The link is valid until {{invitation.expiresAt}}. If you don't recognise this invitation or no longer want to participate, you can decline here:

  {{invitation.declineUrl}}

— {{journal.name}}$$
FROM email_template WHERE key = 'invitation.created'
ON CONFLICT (template_id, locale) DO NOTHING;

INSERT INTO email_template_locale (template_id, locale, subject, body)
SELECT id, 'ro',
       'Sunteți invitat(ă) la {{journal.name}}',
$$Bună ziua,

Redacția {{journal.name}} v-a invitat să vă alăturați revistei în rolul de {{invitation.type}}. Apăsați linkul de mai jos pentru a accepta invitația și a vă finaliza contul:

  {{invitation.acceptUrl}}

Linkul este valabil până la {{invitation.expiresAt}}. Dacă nu recunoașteți această invitație sau nu mai doriți să participați, o puteți refuza aici:

  {{invitation.declineUrl}}

— {{journal.name}}$$
FROM email_template WHERE key = 'invitation.created'
ON CONFLICT (template_id, locale) DO NOTHING;
