-- =================================================================
-- Plumb the canonical email-template key through the notification row
-- so the mail dispatcher can ask the subscription matrix whether the
-- recipient has opted out *for this specific category* before sending.
-- Nullable on purpose — older rows + ad-hoc system notifications that
-- aren't tied to a templated event keep flowing.
-- =================================================================

ALTER TABLE notification
    ADD COLUMN template_key VARCHAR(64);

CREATE INDEX idx_notification_user_template
    ON notification (user_id, template_key)
    WHERE template_key IS NOT NULL;
