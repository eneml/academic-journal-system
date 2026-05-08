-- =================================================================
-- Review forms — structured questionnaires the editorial team builds
-- once and binds to one or more journal sections. Reviewers fill them
-- out alongside the freetext "comments to author / editor / competing
-- interests" fields already on review_assignment.
--
-- Three tables:
--   review_form           a named questionnaire (per-section binding
--                         lives on journal_section.review_form_id)
--   review_form_element   one input on the form: text / textarea /
--                         radio / checkbox / dropdown
--   review_form_response  one reviewer's answer to one element on
--                         one assignment
-- =================================================================

CREATE TABLE review_form (
    id              BIGSERIAL    PRIMARY KEY,
    code            VARCHAR(64)  NOT NULL UNIQUE,
    title           JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description     JSONB        NOT NULL DEFAULT '{}'::jsonb,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    complete_count  INTEGER      NOT NULL DEFAULT 0,
    version         BIGINT       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT review_form_code_format
        CHECK (code ~ '^[a-z][a-zA-Z0-9_-]+$')
);

CREATE INDEX idx_review_form_active ON review_form (is_active) WHERE is_active;

CREATE TABLE review_form_element (
    id                  BIGSERIAL    PRIMARY KEY,
    review_form_id      BIGINT       NOT NULL
                        REFERENCES review_form(id) ON DELETE CASCADE,
    seq                 INTEGER      NOT NULL DEFAULT 0,
    element_type        VARCHAR(32)  NOT NULL,
    included            BOOLEAN      NOT NULL DEFAULT TRUE,
    required            BOOLEAN      NOT NULL DEFAULT FALSE,
    question            JSONB        NOT NULL DEFAULT '{}'::jsonb,
    description         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    possible_responses  JSONB        NOT NULL DEFAULT '[]'::jsonb,
    version             BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT review_form_element_type_check
        CHECK (element_type IN ('SMALL_TEXT','TEXT','TEXTAREA','CHECKBOXES','RADIO','DROPDOWN'))
);

CREATE INDEX idx_review_form_element_form
    ON review_form_element (review_form_id, seq, id);

CREATE TABLE review_form_response (
    id                       BIGSERIAL    PRIMARY KEY,
    review_assignment_id     BIGINT       NOT NULL
                             REFERENCES review_assignment(id) ON DELETE CASCADE,
    review_form_element_id   BIGINT       NOT NULL
                             REFERENCES review_form_element(id) ON DELETE CASCADE,
    response_value           TEXT,
    version                  BIGINT       NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT review_form_response_unique
        UNIQUE (review_assignment_id, review_form_element_id)
);

CREATE INDEX idx_review_form_response_assignment
    ON review_form_response (review_assignment_id);

-- ----------------------------------------------------------------
-- Wire the FK that V20 left dangling: journal_section.review_form_id
-- already exists as a nullable BIGINT — we add the proper REFERENCES
-- now that the target table is in place. ON DELETE SET NULL so an
-- admin who deletes a form doesn't cascade-break sections.
-- ----------------------------------------------------------------

ALTER TABLE journal_section
    ADD CONSTRAINT journal_section_review_form_fk
        FOREIGN KEY (review_form_id) REFERENCES review_form(id) ON DELETE SET NULL;
