package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.publication.api.GalleyApproved;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * Auto-mints a DOI for a publication the first time any of its galleys
 * is approved. No-op if the journal hasn't configured a prefix or has
 * disabled the auto-mint flag, or if the publication already carries a
 * DOI.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class DoiMinter {

    private final JournalLookup journalLookup;
    private final PublicationLookup publicationLookup;
    private final PublicationRepository publicationRepository;
    private final DoiService doiService;

    @ApplicationModuleListener
    @Transactional
    public void on(GalleyApproved event) {
        JournalConfigSummary cfg = journalLookup.getConfig();
        if (cfg == null || !cfg.doiAutoMint() || cfg.doiPrefix() == null
                || cfg.doiPrefix().isBlank()) {
            return;
        }
        PublicationSummary pub = publicationLookup.findById(event.publicationId()).orElse(null);
        if (pub == null) return;
        Publication entity = publicationRepository.findById(pub.id()).orElse(null);
        if (entity == null || entity.getDoiId() != null) return;

        String suffix = expandSuffix(cfg.doiSuffixPattern(), pub);
        String doi = cfg.doiPrefix() + "/" + suffix;
        try {
            doiService.assignToPublication(pub.id(), doi);
            log.info("doi-minter: assigned {} to publication {}", doi, pub.id());
        } catch (Exception e) {
            log.warn("doi-minter: failed to mint {} for publication {}: {}",
                    doi, pub.id(), e.getMessage());
        }
    }

    static String expandSuffix(String pattern, PublicationSummary pub) {
        String year = pub.datePublished() == null
                ? String.valueOf(OffsetDateTime.now().getYear())
                : String.valueOf(pub.datePublished().atZone(ZoneId.systemDefault()).getYear());
        return pattern
                .replace("{publicationId}", String.valueOf(pub.id()))
                .replace("{year}", year);
    }
}
