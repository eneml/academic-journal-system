-- Extra metadata for CALL_FOR_PAPERS / SPECIAL_ISSUE announcements: a
-- pre-rendered CTA pair and a guest-editor by-line. Plain text on purpose;
-- the public homepage hero treats these as opaque copy.

ALTER TABLE announcement
    ADD COLUMN cta_label      VARCHAR(64),
    ADD COLUMN cta_url        VARCHAR(512),
    ADD COLUMN guest_editors  TEXT;
