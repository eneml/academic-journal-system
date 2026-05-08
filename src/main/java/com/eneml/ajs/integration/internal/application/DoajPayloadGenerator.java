package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Builds the JSON body DOAJ expects when creating an article via
 * {@code POST /api/articles}. The shape matches the public DOAJ schema —
 * minimal viable: title, abstract, language, authors, identifiers
 * (DOI), journal title + ISSN, full-text URL.
 */
@Service
@RequiredArgsConstructor
public class DoajPayloadGenerator {

    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;
    private final JournalLookup journalLookup;
    private final DoiLookup doiLookup;
    private final IntegrationProperties properties;
    private final ObjectMapper json = new ObjectMapper();

    public String generate(Long publicationId) {
        PublicationSummary p = publicationLookup.findById(publicationId)
                .orElseThrow(() -> NotFoundException.of("Publication", publicationId));
        JournalConfigSummary cfg = journalLookup.getConfig();

        ObjectNode root = json.createObjectNode();
        ObjectNode bibjson = root.putObject("bibjson");

        bibjson.put("title", pickLocalized(p.title(), p.locale(),
                cfg == null ? "en" : cfg.defaultLocale()));
        if (p.abstractText() != null) {
            String abs = pickLocalized(p.abstractText(), p.locale(),
                    cfg == null ? "en" : cfg.defaultLocale());
            if (abs != null && !abs.isBlank()) {
                bibjson.put("abstract", abs);
            }
        }
        if (p.locale() != null) {
            ArrayNode langs = bibjson.putArray("language");
            langs.add(p.locale());
        }
        if (p.keywords() != null && !p.keywords().isEmpty()) {
            ArrayNode kw = bibjson.putArray("keywords");
            for (String k : p.keywords()) kw.add(k);
        }

        // Authors
        ArrayNode authors = bibjson.putArray("author");
        for (SubmissionAuthorSummary a : submissionLookup.authorsOf(p.submissionId())) {
            ObjectNode an = authors.addObject();
            String name = (a.givenName() == null ? "" : a.givenName())
                    + (a.familyName() == null ? "" : " " + a.familyName());
            an.put("name", name.trim());
            if (a.affiliation() != null && !a.affiliation().isBlank()) {
                an.put("affiliation", a.affiliation());
            }
            if (a.orcidId() != null && !a.orcidId().isBlank()) {
                an.put("orcid_id", a.orcidId());
            }
        }

        // Journal block — DOAJ uses "journal" inside bibjson
        ObjectNode journal = bibjson.putObject("journal");
        if (cfg != null) {
            String name = pickLocalized(cfg.name(), null, cfg.defaultLocale());
            if (name != null) journal.put("title", name);
            if (cfg.issnPrint() != null || cfg.issnOnline() != null) {
                ArrayNode issns = journal.putArray("issns");
                if (cfg.issnPrint() != null) issns.add(cfg.issnPrint());
                if (cfg.issnOnline() != null) issns.add(cfg.issnOnline());
            }
        }
        journal.put("language", p.locale() == null
                ? (cfg == null ? "en" : cfg.defaultLocale()) : p.locale());

        // Identifiers
        ArrayNode ids = bibjson.putArray("identifier");
        if (p.doiId() != null) {
            DoiSummary doi = doiLookup.findById(p.doiId()).orElse(null);
            if (doi != null) {
                ObjectNode idEntry = ids.addObject();
                idEntry.put("type", "doi");
                idEntry.put("id", doi.doi());
            }
        }

        // Full-text link
        ArrayNode links = bibjson.putArray("link");
        ObjectNode lnk = links.addObject();
        lnk.put("type", "fulltext");
        lnk.put("url", properties.publicBaseUrl() + "/articles/" + p.urlPath());
        lnk.put("content_type", "text/html");

        try {
            return json.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialise DOAJ payload", e);
        }
    }

    private static String pickLocalized(Map<String, String> map, String preferred, String fallback) {
        if (map == null || map.isEmpty()) return null;
        if (preferred != null && map.containsKey(preferred)
                && map.get(preferred) != null && !map.get(preferred).isBlank()) {
            return map.get(preferred);
        }
        if (fallback != null && map.containsKey(fallback)
                && map.get(fallback) != null && !map.get(fallback).isBlank()) {
            return map.get(fallback);
        }
        for (Map.Entry<String, String> e : new LinkedHashMap<>(map).entrySet()) {
            if (e.getValue() != null && !e.getValue().isBlank()) return e.getValue();
        }
        return null;
    }
}
