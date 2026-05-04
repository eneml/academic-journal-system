package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.ConflictException;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Renders a CrossRef deposit XML envelope for a publication. Distinct
 * from {@link JatsGenerator} — CrossRef has its own schema (rooted at
 * {@code <doi_batch>}) which their deposit endpoint requires.
 *
 * <p>Schema: <a href="https://data.crossref.org/reports/help/schema_doc/4.4.2/schema_4_4_2.html">CrossRef 4.4.2</a>.
 */
@Service
@RequiredArgsConstructor
public class CrossRefDepositXmlGenerator {

    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;
    private final IssueLookup issueLookup;
    private final JournalLookup journalLookup;
    private final DoiLookup doiLookup;
    private final IntegrationProperties properties;

    public String generate(Long publicationId) {
        PublicationSummary pub = publicationLookup.findById(publicationId)
                .orElseThrow(() -> NotFoundException.of("Publication", publicationId));
        if (pub.doiId() == null) {
            throw new ConflictException("Publication %d has no DOI to deposit".formatted(publicationId));
        }
        DoiSummary doi = doiLookup.findById(pub.doiId())
                .orElseThrow(() -> NotFoundException.of("Doi", pub.doiId()));

        JournalConfigSummary config = journalLookup.getConfig();
        String locale = !pub.locale().isBlank() ? pub.locale() : config.defaultLocale();
        String journalTitle = pickLocale(config.name(), locale, config.defaultLocale());
        List<SubmissionAuthorSummary> authors = submissionLookup.authorsOf(pub.submissionId());
        Optional<IssueSummary> issue = pub.issueId() != null
                ? issueLookup.findById(pub.issueId())
                : Optional.empty();

        IntegrationProperties.CrossRef cfg = properties.crossref();
        String batchId = "ajs-" + UUID.randomUUID();
        long timestamp = System.currentTimeMillis();
        String depositorName = orDefault(cfg.depositorName(), journalTitle);
        String depositorEmail = orDefault(cfg.depositorEmail(),
                orDefault(config.contactEmail(), "noreply@example.org"));

        StringBuilder out = new StringBuilder(2048);
        out.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        out.append("<doi_batch xmlns=\"http://www.crossref.org/schema/4.4.2\" ")
           .append("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" ")
           .append("version=\"4.4.2\">\n");

        // ---------- head ----------
        out.append("  <head>\n");
        out.append("    <doi_batch_id>").append(batchId).append("</doi_batch_id>\n");
        out.append("    <timestamp>").append(timestamp).append("</timestamp>\n");
        out.append("    <depositor>\n");
        out.append("      <depositor_name>").append(escape(depositorName)).append("</depositor_name>\n");
        out.append("      <email_address>").append(escape(depositorEmail)).append("</email_address>\n");
        out.append("    </depositor>\n");
        out.append("    <registrant>").append(escape(journalTitle)).append("</registrant>\n");
        out.append("  </head>\n");

        // ---------- body ----------
        out.append("  <body>\n");
        out.append("    <journal>\n");

        // Journal metadata
        out.append("      <journal_metadata language=\"").append(escape(locale)).append("\">\n");
        out.append("        <full_title>").append(escape(journalTitle)).append("</full_title>\n");
        out.append("      </journal_metadata>\n");

        // Issue metadata (optional)
        issue.ifPresent(i -> {
            out.append("      <journal_issue>\n");
            if (i.year() != null || pub.datePublished() != null) {
                LocalDate date = pub.datePublished() != null
                        ? pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate()
                        : LocalDate.of(i.year() != null ? i.year() : LocalDate.now().getYear(), 1, 1);
                out.append("        <publication_date media_type=\"online\">\n");
                out.append("          <month>").append(date.getMonthValue()).append("</month>\n");
                out.append("          <day>").append(date.getDayOfMonth()).append("</day>\n");
                out.append("          <year>").append(date.getYear()).append("</year>\n");
                out.append("        </publication_date>\n");
            }
            if (i.volume() != null) {
                out.append("        <journal_volume>\n");
                out.append("          <volume>").append(i.volume()).append("</volume>\n");
                out.append("        </journal_volume>\n");
            }
            if (i.number() != null && !i.number().isBlank()) {
                out.append("        <issue>").append(escape(i.number())).append("</issue>\n");
            }
            out.append("      </journal_issue>\n");
        });

        // Article
        out.append("      <journal_article publication_type=\"full_text\" language=\"")
                .append(escape(locale)).append("\">\n");
        out.append("        <titles>\n");
        out.append("          <title>")
                .append(escape(pickLocale(pub.title(), locale, config.defaultLocale())))
                .append("</title>\n");
        out.append("        </titles>\n");

        if (!authors.isEmpty()) {
            out.append("        <contributors>\n");
            boolean first = true;
            for (SubmissionAuthorSummary a : authors) {
                renderAuthor(out, a, first);
                first = false;
            }
            out.append("        </contributors>\n");
        }

        if (pub.datePublished() != null) {
            LocalDate date = pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate();
            out.append("        <publication_date media_type=\"online\">\n");
            out.append("          <month>").append(date.getMonthValue()).append("</month>\n");
            out.append("          <day>").append(date.getDayOfMonth()).append("</day>\n");
            out.append("          <year>").append(date.getYear()).append("</year>\n");
            out.append("        </publication_date>\n");
        }

        out.append("        <doi_data>\n");
        out.append("          <doi>").append(escape(doi.doi())).append("</doi>\n");
        out.append("          <resource>").append(escape(landingUrl(pub))).append("</resource>\n");
        out.append("        </doi_data>\n");

        out.append("      </journal_article>\n");
        out.append("    </journal>\n");
        out.append("  </body>\n");
        out.append("</doi_batch>\n");
        return out.toString();
    }

    private void renderAuthor(StringBuilder out, SubmissionAuthorSummary a, boolean first) {
        out.append("          <person_name sequence=\"")
                .append(first ? "first" : "additional")
                .append("\" contributor_role=\"author\">\n");
        out.append("            <given_name>").append(escape(emptyIfNull(a.givenName()))).append("</given_name>\n");
        out.append("            <surname>").append(escape(emptyIfNull(a.familyName()))).append("</surname>\n");
        if (a.affiliation() != null && !a.affiliation().isBlank()) {
            out.append("            <affiliation>").append(escape(a.affiliation())).append("</affiliation>\n");
        }
        if (a.orcidId() != null && !a.orcidId().isBlank()) {
            out.append("            <ORCID authenticated=\"true\">")
                    .append(escape(normalizeOrcid(a.orcidId())))
                    .append("</ORCID>\n");
        }
        out.append("          </person_name>\n");
    }

    private String landingUrl(PublicationSummary pub) {
        String base = properties.publicBaseUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        String slug = pub.urlPath() != null && !pub.urlPath().isBlank()
                ? pub.urlPath()
                : String.valueOf(pub.id());
        return base + "/articles/" + slug;
    }

    private static String normalizeOrcid(String raw) {
        String s = raw.trim();
        if (s.startsWith("http://") || s.startsWith("https://")) return s;
        return "https://orcid.org/" + s;
    }

    private static String pickLocale(Map<String, String> values, String preferred, String fallback) {
        if (values == null || values.isEmpty()) return "";
        String v = values.get(preferred);
        if (v != null && !v.isBlank()) return v;
        v = values.get(fallback);
        if (v != null && !v.isBlank()) return v;
        return values.values().stream().filter(s -> s != null && !s.isBlank()).findFirst().orElse("");
    }

    private static String orDefault(String v, String fallback) {
        return v == null || v.isBlank() ? fallback : v;
    }

    private static String emptyIfNull(String s) {
        return s == null ? "" : s;
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
