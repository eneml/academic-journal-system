-- =================================================================
-- Phase 9 — reviewer-uploaded attachments need a genre row to land
-- through the existing SubmissionFileService, which validates the
-- genre against journal_genre. SUPPLEMENTARY category so it shows up
-- alongside the manuscript's other supporting material in the files
-- panel; not required (a reviewer often submits comments without an
-- attachment).
-- =================================================================

INSERT INTO journal_genre (code, seq, category, dependent, supplementary, required, name)
VALUES
    ('reviewer-attachment', 110, 'SUPPLEMENTARY', FALSE, TRUE, FALSE,
     '{"en":"Reviewer Attachment","ro":"Atașament evaluator"}'::jsonb)
ON CONFLICT (code) DO NOTHING;
