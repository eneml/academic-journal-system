-- =================================================================
-- Phase 11 — Submission wizard polish.
--   journal_config: per-locale privacy + competing-interests policies,
--                   plus a submission checklist authors must agree to
--                   before the manuscript can be submitted.
--   submission:     three new bibliographic fields surfaced on the
--                   author wizard's metadata step — subjects (per-locale
--                   keyword-style strings), languages (BCP-47 tags), and
--                   a free-text data-availability statement.
-- All defaults are empty so existing rows stay valid under
-- ddl-auto: validate.
-- =================================================================

ALTER TABLE journal_config
    ADD COLUMN submission_checklist        JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN privacy_statement           JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN competing_interests_policy  JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Seed a sensible default checklist so a fresh install has something the
-- author wizard can render. The admin can edit/replace it via /admin/settings.
UPDATE journal_config
SET submission_checklist = $$[
  {"id": "not-published",         "label": {"en": "The submission has not been previously published, nor is it before another journal for consideration.", "ro": "Lucrarea nu a fost publicată anterior și nu este în curs de evaluare la o altă revistă."}},
  {"id": "format",                "label": {"en": "The file format is OpenDocument, Microsoft Word, or PDF.",                                                "ro": "Fișierul este în format OpenDocument, Microsoft Word sau PDF."}},
  {"id": "anonymous-references",  "label": {"en": "All references include URLs / DOIs where available.",                                                       "ro": "Toate referințele includ URL-uri / DOI-uri acolo unde sunt disponibile."}},
  {"id": "single-spaced",         "label": {"en": "The text is single-spaced; uses a 12-point font; employs italics rather than underlining.",                  "ro": "Textul este la un rând; folosește font de 12; cursive în loc de subliniere."}},
  {"id": "guidelines",            "label": {"en": "I have followed the journal's submission guidelines.",                                                       "ro": "Am respectat ghidul de transmitere a manuscriselor al revistei."}}
]$$::jsonb
WHERE id = 1 AND submission_checklist = '[]'::jsonb;

ALTER TABLE submission
    ADD COLUMN subjects          JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN languages         JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN data_availability JSONB NOT NULL DEFAULT '{}'::jsonb;
