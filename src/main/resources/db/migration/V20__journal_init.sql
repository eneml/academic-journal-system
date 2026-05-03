-- =================================================================
-- journal module — singleton config, sections, genres, masthead
-- =================================================================

-- ----------------------------------------------------------------
-- journal_config: singleton row (id = 1) holding journal-wide settings
-- ----------------------------------------------------------------
CREATE TABLE journal_config (
    id                BIGINT       PRIMARY KEY DEFAULT 1,
    name              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    issn_print        VARCHAR(9),
    issn_online       VARCHAR(9),
    default_locale    VARCHAR(8)   NOT NULL DEFAULT 'en',
    supported_locales JSONB        NOT NULL DEFAULT '["en"]'::jsonb,
    contact_email     VARCHAR(254),
    masthead_text     JSONB        NOT NULL DEFAULT '{}'::jsonb,
    copyright_notice  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    license_url       VARCHAR(2048),
    about             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    submissions_open  BOOLEAN      NOT NULL DEFAULT TRUE,
    version           BIGINT       NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT journal_config_singleton CHECK (id = 1)
);

INSERT INTO journal_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- journal_section: editorial sections (Articles, Reviews, ...)
-- ----------------------------------------------------------------
CREATE TABLE journal_section (
    id                  BIGSERIAL    PRIMARY KEY,
    code                VARCHAR(64)  NOT NULL UNIQUE,
    seq                 INTEGER      NOT NULL DEFAULT 0,
    review_form_id      BIGINT,
    editor_restricted   BOOLEAN      NOT NULL DEFAULT FALSE,
    meta_indexed        BOOLEAN      NOT NULL DEFAULT TRUE,
    meta_reviewed       BOOLEAN      NOT NULL DEFAULT TRUE,
    abstracts_required  BOOLEAN      NOT NULL DEFAULT TRUE,
    hide_title          BOOLEAN      NOT NULL DEFAULT FALSE,
    hide_author         BOOLEAN      NOT NULL DEFAULT FALSE,
    inactive            BOOLEAN      NOT NULL DEFAULT FALSE,
    abstract_word_limit INTEGER,
    title               JSONB        NOT NULL DEFAULT '{}'::jsonb,
    abbrev              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    policy              JSONB        NOT NULL DEFAULT '{}'::jsonb,
    identify_type       JSONB        NOT NULL DEFAULT '{}'::jsonb,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_section_active_seq
    ON journal_section (seq, id) WHERE NOT inactive;

INSERT INTO journal_section (code, seq, title, abbrev) VALUES
    ('articles',   10, '{"en":"Articles","ro":"Articole"}'::jsonb,  '{"en":"ART","ro":"ART"}'::jsonb),
    ('reviews',    20, '{"en":"Reviews","ro":"Recenzii"}'::jsonb,    '{"en":"REV","ro":"REC"}'::jsonb),
    ('editorials', 30, '{"en":"Editorials","ro":"Editoriale"}'::jsonb,'{"en":"EDI","ro":"EDI"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------
-- journal_genre: file-type taxonomy (Article Text, Image, Data Set)
-- ----------------------------------------------------------------
CREATE TABLE journal_genre (
    id            BIGSERIAL    PRIMARY KEY,
    code          VARCHAR(64)  NOT NULL UNIQUE,
    seq           INTEGER      NOT NULL DEFAULT 0,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    category      VARCHAR(32)  NOT NULL,
    dependent     BOOLEAN      NOT NULL DEFAULT FALSE,
    supplementary BOOLEAN      NOT NULL DEFAULT FALSE,
    required      BOOLEAN      NOT NULL DEFAULT FALSE,
    name          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT journal_genre_category_check
        CHECK (category IN ('DOCUMENT', 'ARTWORK', 'SUPPLEMENTARY'))
);

CREATE INDEX idx_journal_genre_enabled_seq
    ON journal_genre (seq, id) WHERE enabled;

INSERT INTO journal_genre (code, seq, category, dependent, supplementary, required, name) VALUES
    ('article-text',         10, 'DOCUMENT',      FALSE, FALSE, TRUE,  '{"en":"Article Text","ro":"Text articol"}'::jsonb),
    ('research-instrument',  20, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Research Instrument","ro":"Instrument de cercetare"}'::jsonb),
    ('research-materials',   30, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Research Materials","ro":"Materiale de cercetare"}'::jsonb),
    ('research-results',     40, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Research Results","ro":"Rezultate de cercetare"}'::jsonb),
    ('transcripts',          50, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Transcripts","ro":"Transcrieri"}'::jsonb),
    ('data-analysis',        60, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Data Analysis","ro":"Analiza datelor"}'::jsonb),
    ('data-set',             70, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Data Set","ro":"Set de date"}'::jsonb),
    ('source-texts',         80, 'SUPPLEMENTARY', FALSE, TRUE,  FALSE, '{"en":"Source Texts","ro":"Texte sursa"}'::jsonb),
    ('image',                90, 'ARTWORK',       FALSE, FALSE, FALSE, '{"en":"Image","ro":"Imagine"}'::jsonb),
    ('html-stylesheet',     100, 'DOCUMENT',      TRUE,  FALSE, FALSE, '{"en":"HTML Stylesheet","ro":"Foaie de stil HTML"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------
-- journal_masthead_entry: editorial board listing for the public site.
-- user_id is a logical reference to identity::api (no FK across modules).
-- ----------------------------------------------------------------
CREATE TABLE journal_masthead_entry (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    role_label    JSONB        NOT NULL DEFAULT '{}'::jsonb,
    bio_override  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    display_order INTEGER      NOT NULL DEFAULT 0,
    visible       BOOLEAN      NOT NULL DEFAULT TRUE,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_masthead_visible_order
    ON journal_masthead_entry (display_order, id) WHERE visible;
