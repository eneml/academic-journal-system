package com.eneml.ajs.search.internal.application;

import com.eneml.ajs.publication.api.GalleyApproved;
import com.eneml.ajs.publication.api.GalleyLookup;
import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.search.internal.persistence.SearchIndexRepository;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.submission.api.SubmissionFileSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Optional;

/**
 * On galley approval: pull the underlying PDF out of storage, run it
 * through PDFBox, and stuff the extracted text into the search index
 * row's tsvector. No-op for galleys backed by a remote URL (we don't
 * reach across the public internet to fetch text) and for non-PDF
 * uploads.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class GalleyFullTextListener {

    private final GalleyLookup galleyLookup;
    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;
    private final FileStorageService storage;
    private final PdfTextExtractor extractor;
    private final SearchIndexRepository repository;

    @ApplicationModuleListener
    public void on(GalleyApproved event) {
        Optional<GalleySummary> galley = galleyLookup.findById(event.galleyId());
        if (galley.isEmpty()) return;
        GalleySummary g = galley.get();
        if (g.submissionFileId() == null) return; // remote-URL galley, skip

        // Resolve the storedFileId via SubmissionLookup.filesOf — there's no
        // submission::api by-id getter for files, but the list is small.
        SubmissionFileSummary file = findFile(g);
        if (file == null) {
            log.debug("galley {} approved but submission_file {} not found",
                    g.id(), g.submissionFileId());
            return;
        }

        StoredFileMetadata meta = storage.findById(file.storedFileId()).orElse(null);
        if (meta == null) return;
        String contentType = meta.contentType() == null ? "" : meta.contentType().toLowerCase();
        if (!contentType.contains("pdf")) {
            log.debug("galley {} approved with non-PDF content type {}; skipping FTS",
                    g.id(), meta.contentType());
            return;
        }

        try (InputStream stream = storage.openInputStream(file.storedFileId())) {
            String text = extractor.extract(stream);
            if (text != null && !text.isBlank()) {
                int updated = repository.updateFulltext(g.publicationId(), text);
                if (updated == 1) {
                    log.info("indexed {} chars of full-text for publication {}",
                            text.length(), g.publicationId());
                } else {
                    log.debug("publication {} not in search index — full-text skipped",
                            g.publicationId());
                }
            }
        } catch (Exception e) {
            log.warn("full-text indexing failed for galley {}: {}",
                    g.id(), e.getMessage());
        }
    }

    private SubmissionFileSummary findFile(GalleySummary g) {
        if (g.submissionFileId() == null) return null;
        PublicationSummary pub = publicationLookup.findById(g.publicationId()).orElse(null);
        if (pub == null) return null;
        return submissionLookup.filesOf(pub.submissionId()).stream()
                .filter(f -> g.submissionFileId().equals(f.id()))
                .findFirst()
                .orElse(null);
    }
}
