-- =================================================================
-- Branding fields surfaced on the admin Settings page (Identity tab):
-- acronym, multilingual subtitle, founding year, publication frequency,
-- publisher, country of publication.
-- =================================================================

ALTER TABLE journal_config
    ADD COLUMN acronym                VARCHAR(32),
    ADD COLUMN subtitle               JSONB        NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN founding_year          INTEGER,
    ADD COLUMN frequency              VARCHAR(64),
    ADD COLUMN publisher              VARCHAR(256),
    ADD COLUMN country_of_publication VARCHAR(2);

ALTER TABLE journal_config
    ADD CONSTRAINT journal_config_country_iso2_check
        CHECK (country_of_publication IS NULL
               OR country_of_publication ~ '^[A-Z]{2}$');

ALTER TABLE journal_config
    ADD CONSTRAINT journal_config_founding_year_check
        CHECK (founding_year IS NULL
               OR (founding_year BETWEEN 1500 AND 9999));
