-- =================================================================
-- Phase 21 — typed email log. Each outbound mail attempt persists a row
-- so admins can audit what went out, to whom, with which template.
--   template_key:  matches email_template.key (nullable for direct sends)
--   recipient:     the resolved address (citext to match user emails)
--   subject:       rendered subject line
--   status:        SENT | FAILED | SKIPPED — failures keep error_message
--   user_id:       optional FK to app_user when the recipient is on file
--   notification_id: optional FK so the audit row links back to the
--                    in-app notification it accompanied
-- =================================================================

CREATE TABLE email_log (
    id              BIGSERIAL    PRIMARY KEY,
    template_key    VARCHAR(128),
    recipient       CITEXT       NOT NULL,
    subject         TEXT         NOT NULL,
    status          VARCHAR(16)  NOT NULL,
    error_message   TEXT,
    user_id         BIGINT       REFERENCES app_user(id) ON DELETE SET NULL,
    notification_id BIGINT       REFERENCES notification(id) ON DELETE SET NULL,
    sent_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT email_log_status_check
        CHECK (status IN ('SENT','FAILED','SKIPPED'))
);

CREATE INDEX idx_email_log_recipient_sent   ON email_log (recipient, sent_at DESC);
CREATE INDEX idx_email_log_template_sent    ON email_log (template_key, sent_at DESC);
CREATE INDEX idx_email_log_status_sent      ON email_log (status, sent_at DESC);
