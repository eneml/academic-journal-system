package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;

/**
 * Renders an ORCID 3.0 {@code <work>} XML payload for a single
 * publication. Sent to {@code PUT /v3.0/{orcid}/work} with the user's
 * OAuth bearer token.
 */
@Service
@RequiredArgsConstructor
public class OrcidWorkXmlGenerator {

    private final PublicationLookup publicationLookup;
    private final IssueLookup issueLookup;
    private final JournalLookup journalLookup;
    private final DoiLookup doiLookup;
    private final IntegrationProperties properties;

    public String generate(Long publicationId) {
        PublicationSummary pub = publicationLookup.findById(publicationId)
                .orElseThrow(() -> NotFoundException.of("Publication", publicationId));
        JournalConfigSummary config = journalLookup.getConfig();
        String locale = !pub.locale().isBlank() ? pub.locale() : config.defaultLocale();
        String journalTitle = pickLocale(config.name(), locale, config.defaultLocale());
        Optional<DoiSummary> doi = pub.doiId() != null ? doiLookup.findById(pub.doiId()) : Optional.empty();
        Optional<com.eneml.ajs.issue.api.IssueSummary> issue = pub.issueId() != null
                ? issueLookup.findById(pub.issueId()) : Optional.empty();

        StringBuilder out = new StringBuilder(1024);
        out.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        out.append("<work:work xmlns:common=\"http://www.orcid.org/ns/common\" ")
           .append("xmlns:work=\"http://www.orcid.org/ns/work\">\n");

        // Title
        String title = pickLocale(pub.title(), locale, config.defaultLocale());
        out.append("  <work:title>\n");
        out.append("    <common:title>").append(escape(title)).append("</common:title>\n");
        out.append("  </work:title>\n");

        // Journal title
        out.append("  <work:journal-title>").append(escape(journalTitle))
           .append("</work:journal-title>\n");

        // Short description (first 1500 chars of abstract — ORCID's limit)
        String abs = pickLocale(pub.abstractText(), locale, config.defaultLocale());
        if (!abs.isBlank()) {
            String snippet = abs.length() > 1500 ? abs.substring(0, 1500) : abs;
            out.append("  <work:short-description>")
               .append(escape(snippet))
               .append("</work:short-description>\n");
        }

        out.append("  <work:type>journal-article</work:type>\n");

        // Publication date
        if (pub.datePublished() != null) {
            LocalDate date = pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate();
            out.append("  <common:publication-date>\n");
            out.append("    <common:year>").append(date.getYear()).append("</common:year>\n");
            out.append("    <common:month>")
               .append(String.format("%02d", date.getMonthValue()))
               .append("</common:month>\n");
            out.append("    <common:day>")
               .append(String.format("%02d", date.getDayOfMonth()))
               .append("</common:day>\n");
            out.append("  </common:publication-date>\n");
        }

        // External identifiers (DOI + journal-issn placeholder)
        out.append("  <common:external-ids>\n");
        doi.ifPresent(d -> {
            out.append("    <common:external-id>\n");
            out.append("      <common:external-id-type>doi</common:external-id-type>\n");
            out.append("      <common:external-id-value>").append(escape(d.doi()))
               .append("</common:external-id-value>\n");
            out.append("      <common:external-id-url>https://doi.org/")
               .append(escape(d.doi()))
               .append("</common:external-id-url>\n");
            out.append("      <common:external-id-relationship>self</common:external-id-relationship>\n");
            out.append("    </common:external-id>\n");
        });
        // Backstop URL pointing at the public site landing page
        String landing = landingUrl(pub);
        out.append("    <common:external-id>\n");
        out.append("      <common:external-id-type>uri</common:external-id-type>\n");
        out.append("      <common:external-id-value>").append(escape(landing))
           .append("</common:external-id-value>\n");
        out.append("      <common:external-id-relationship>self</common:external-id-relationship>\n");
        out.append("    </common:external-id>\n");
        out.append("  </common:external-ids>\n");

        out.append("  <work:url>").append(escape(landing)).append("</work:url>\n");
        out.append("</work:work>\n");
        return out.toString();
    }

    private String landingUrl(PublicationSummary pub) {
        String base = properties.publicBaseUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        String slug = pub.urlPath() != null && !pub.urlPath().isBlank()
                ? pub.urlPath() : String.valueOf(pub.id());
        return base + "/articles/" + slug;
    }

    private static String pickLocale(Map<String, String> values, String preferred, String fallback) {
        if (values == null || values.isEmpty()) return "";
        String v = values.get(preferred);
        if (v != null && !v.isBlank()) return v;
        v = values.get(fallback);
        if (v != null && !v.isBlank()) return v;
        return values.values().stream().filter(s -> s != null && !s.isBlank()).findFirst().orElse("");
    }

    private static String escape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&'  -> sb.append("&amp;");
                case '<'  -> sb.append("&lt;");
                case '>'  -> sb.append("&gt;");
                case '"'  -> sb.append("&quot;");
                case '\'' -> sb.append("&apos;");
                default   -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
