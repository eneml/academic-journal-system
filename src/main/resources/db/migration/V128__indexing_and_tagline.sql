-- Indexing memberships (Scopus, WoS, DOAJ, Crossref, ...) shown on the public
-- homepage and footer. Surfaced through journal_config CRUD admin screen.
CREATE TABLE indexing_membership (
    id           BIGSERIAL    PRIMARY KEY,
    code         VARCHAR(32)  NOT NULL UNIQUE,
    label        VARCHAR(128) NOT NULL,
    url          VARCHAR(2048),
    quartile     VARCHAR(16),
    sort_order   INTEGER      NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_indexing_membership_active_sort
    ON indexing_membership (is_active, sort_order);

-- Footer / masthead motto strip — purely decorative. Kept short so it fits
-- between the flanking hairlines in PublicFooter / PublicHeader.
ALTER TABLE journal_config
    ADD COLUMN tagline           VARCHAR(120),
    ADD COLUMN tagline_ornament  VARCHAR(8);
