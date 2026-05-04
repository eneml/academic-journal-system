package com.eneml.ajs.issue.internal.application;

import com.eneml.ajs.issue.internal.domain.Issue;
import com.eneml.ajs.issue.internal.persistence.IssueRepository;
import com.eneml.ajs.publication.api.GalleyLookup;
import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.io.IOUtils;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Builds a single combined-issue PDF on demand by merging every approved PDF
 * galley of every publication in the issue, in TOC order.
 *
 * <p>Each publication's first approved PDF galley (lowest {@code seq}) is
 * included; HTML / JATS galleys are ignored. Articles without any PDF
 * galley are silently skipped — better to ship the partial issue PDF than
 * fail the whole download because one article is HTML-only.
 *
 * <p>The result is held in memory. For typical issues (10-20 articles, a
 * few MB each) this is fine; we log size so the inflection point at which
 * we'd want to switch to a temp-file pipeline is visible.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IssuePdfService {

    private final IssueRepository issueRepository;
    private final PublicationLookup publicationLookup;
    private final GalleyLookup galleyLookup;
    private final FileStorageService fileStorage;

    /**
     * Build the combined PDF for an issue. Throws {@link NotFoundException}
     * if the issue isn't published. Returns {@link IssuePdfResult#isEmpty()}
     * when no article in the issue has a PDF galley yet — controllers
     * should turn that into a 404 so users don't get a 0-byte file.
     */
    @Transactional(readOnly = true)
    public IssuePdfResult build(long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> NotFoundException.of("Issue", issueId));
        if (!issue.isPublished()) {
            throw NotFoundException.of("Issue", issueId);
        }

        List<PublicationSummary> articles = publicationLookup.publishedInIssue(issueId);
        if (articles.isEmpty()) {
            return IssuePdfResult.empty(issue);
        }

        PDFMergerUtility merger = new PDFMergerUtility();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        merger.setDestinationStream(out);

        int merged = 0;
        for (PublicationSummary pub : articles) {
            GalleySummary pdfGalley = pickPdfGalley(pub);
            if (pdfGalley == null || pdfGalley.submissionFileId() == null) {
                log.debug("Issue {} merge: skipping publication {} (no PDF galley)",
                        issueId, pub.id());
                continue;
            }
            byte[] pdfBytes = readGalleyBytes(pdfGalley);
            if (pdfBytes == null) {
                continue;
            }
            try {
                // PDFBox 3.x: addSource(RandomAccessRead) — wrap the bytes
                // in a buffer so PDFBox can seek (S3 stream isn't seekable).
                merger.addSource(new RandomAccessReadBuffer(pdfBytes));
                merged++;
            } catch (Exception e) {
                log.warn("Issue {} merge: failed to add galley {} for publication {}: {}",
                        issueId, pdfGalley.id(), pub.id(), e.getMessage());
            }
        }

        if (merged == 0) {
            return IssuePdfResult.empty(issue);
        }

        try {
            // null streamCacheCreateFunction => PDFBox uses the in-memory default,
            // which matches our in-memory destination stream above.
            merger.mergeDocuments(null);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to merge issue " + issueId + " PDFs", e);
        }

        byte[] bytes = out.toByteArray();
        log.info("Built issue {} PDF: {} articles merged, {} KB total",
                issueId, merged, bytes.length / 1024);
        return new IssuePdfResult(issue, bytes, merged);
    }

    private byte[] readGalleyBytes(GalleySummary galley) {
        try (InputStream in = fileStorage.openInputStream(galley.submissionFileId())) {
            return IOUtils.toByteArray(in);
        } catch (IOException | RuntimeException e) {
            log.warn("Issue PDF merge: could not read galley {} (file {}): {}",
                    galley.id(), galley.submissionFileId(), e.getMessage());
            return null;
        }
    }

    /** First approved PDF galley for a publication, or null if none. */
    private GalleySummary pickPdfGalley(PublicationSummary pub) {
        return galleyLookup.approvedGalleysOfPublication(pub.id()).stream()
                .filter(IssuePdfService::looksLikePdf)
                .min((a, b) -> Integer.compare(a.seq(), b.seq()))
                .orElse(null);
    }

    /** Heuristic: a galley is "the PDF" if any localized label contains "pdf". */
    private static boolean looksLikePdf(GalleySummary g) {
        Map<String, String> label = g.label();
        if (label == null || label.isEmpty()) {
            return false;
        }
        return label.values().stream()
                .filter(s -> s != null)
                .anyMatch(s -> s.toLowerCase(Locale.ROOT).contains("pdf"));
    }

    public record IssuePdfResult(Issue issue, byte[] pdf, int articleCount) {
        public boolean isEmpty() {
            return pdf == null || pdf.length == 0;
        }
        public static IssuePdfResult empty(Issue issue) {
            return new IssuePdfResult(issue, new byte[0], 0);
        }
    }
}
