package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.api.GalleyLookup;
import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Renders a published {@link com.eneml.ajs.publication.api.PublicationSummary}
 * into a JATS 1.3 article XML document. The output is suitable for CrossRef
 * deposit (after wrapping in their deposit envelope) and for archival in
 * services like PubMed Central.
 */
@Service
@RequiredArgsConstructor
public class JatsGenerator {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final PublicationLookup publicationLookup;
    private final SubmissionLookup submissionLookup;
    private final IssueLookup issueLookup;
    private final JournalLookup journalLookup;
    private final SectionLookup sectionLookup;
    private final GalleyLookup galleyLookup;
    private final DoiLookup doiLookup;

    /**
     * Build a complete JATS XML document for a publication.
     *
     * @throws NotFoundException if the publication does not exist
     */
    public String generate(Long publicationId) {
        PublicationSummary pub = publicationLookup.findById(publicationId)
                .orElseThrow(() -> NotFoundException.of("Publication", publicationId));
        return generate(pub);
    }

    public String generate(PublicationSummary pub) {
        JournalConfigSummary config = journalLookup.getConfig();
        String locale = !pub.locale().isBlank() ? pub.locale() : config.defaultLocale();

        List<SubmissionAuthorSummary> authors = submissionLookup.authorsOf(pub.submissionId());
        Optional<IssueSummary> issue = pub.issueId() != null
                ? issueLookup.findById(pub.issueId())
                : Optional.empty();
        Optional<SectionSummary> section = pub.sectionId() != null
                ? sectionLookup.findById(pub.sectionId())
                : Optional.empty();
        Optional<DoiSummary> doi = pub.doiId() != null ? doiLookup.findById(pub.doiId()) : Optional.empty();
        List<GalleySummary> galleys = galleyLookup.approvedGalleysOfPublication(pub.id());

        StringBuilder out = new StringBuilder(2048);
        out.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        out.append("<!DOCTYPE article PUBLIC \"-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3 20210610//EN\" ")
           .append("\"https://jats.nlm.nih.gov/archiving/1.3/JATS-archivearticle1-3.dtd\">\n");
        out.append("<article article-type=\"research-article\" xml:lang=\"")
           .append(escape(locale)).append("\" ")
           .append("xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n");

        // ---------- front ----------
        out.append("  <front>\n");
        renderJournalMeta(out, config, locale);
        renderArticleMeta(out, pub, authors, issue, section, doi, galleys, locale, config);
        out.append("  </front>\n");

        // ---------- body (placeholder; full text lives in the galley file) ----------
        out.append("  <body>\n");
        out.append("    <sec>\n");
        out.append("      <title>Full text</title>\n");
        out.append("      <p>The full text of this article is available as a galley file.</p>\n");
        out.append("    </sec>\n");
        out.append("  </body>\n");

        out.append("</article>\n");
        return out.toString();
    }

    private void renderJournalMeta(StringBuilder out, JournalConfigSummary config, String locale) {
        String journalTitle = pickLocale(config.name(), locale, config.defaultLocale());
        out.append("    <journal-meta>\n");
        out.append("      <journal-title-group>\n");
        out.append("        <journal-title>").append(escape(journalTitle)).append("</journal-title>\n");
        out.append("      </journal-title-group>\n");
        // ISSNs — print + electronic when configured. JATS requires pub-type
        // attribute to disambiguate; either or both may be absent for
        // online-only / unpublished-yet journals.
        if (config.issnPrint() != null && !config.issnPrint().isBlank()) {
            out.append("      <issn pub-type=\"ppub\">")
               .append(escape(config.issnPrint())).append("</issn>\n");
        }
        if (config.issnOnline() != null && !config.issnOnline().isBlank()) {
            out.append("      <issn pub-type=\"epub\">")
               .append(escape(config.issnOnline())).append("</issn>\n");
        }
        if (config.contactEmail() != null && !config.contactEmail().isBlank()) {
            out.append("      <publisher>\n");
            out.append("        <publisher-name>").append(escape(journalTitle)).append("</publisher-name>\n");
            out.append("      </publisher>\n");
        }
        out.append("    </journal-meta>\n");
    }

    private void renderArticleMeta(
            StringBuilder out,
            PublicationSummary pub,
            List<SubmissionAuthorSummary> authors,
            Optional<IssueSummary> issue,
            Optional<SectionSummary> section,
            Optional<DoiSummary> doi,
            List<GalleySummary> galleys,
            String locale,
            JournalConfigSummary config
    ) {
        out.append("    <article-meta>\n");

        // Identifiers (DOI, internal id)
        doi.ifPresent(d ->
                out.append("      <article-id pub-id-type=\"doi\">")
                        .append(escape(d.doi())).append("</article-id>\n"));
        out.append("      <article-id pub-id-type=\"publisher-id\">")
                .append(pub.id()).append("</article-id>\n");

        // Section heading
        section.ifPresent(s -> {
            String sectionTitle = pickLocale(s.title(), locale, config.defaultLocale());
            if (!sectionTitle.isBlank()) {
                out.append("      <article-categories>\n");
                out.append("        <subj-group subj-group-type=\"heading\">\n");
                out.append("          <subject>").append(escape(sectionTitle)).append("</subject>\n");
                out.append("        </subj-group>\n");
                out.append("      </article-categories>\n");
            }
        });

        // Title
        String title = pickLocale(pub.title(), locale, config.defaultLocale());
        out.append("      <title-group>\n");
        out.append("        <article-title>").append(escape(title)).append("</article-title>\n");
        out.append("      </title-group>\n");

        // Authors
        if (!authors.isEmpty()) {
            out.append("      <contrib-group>\n");
            for (SubmissionAuthorSummary a : authors) {
                renderAuthor(out, a);
            }
            out.append("      </contrib-group>\n");
        }

        // Pub-date
        if (pub.datePublished() != null) {
            LocalDate date = pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate();
            out.append("      <pub-date publication-format=\"electronic\" date-type=\"pub\" iso-8601-date=\"")
                    .append(DATE.format(date)).append("\">\n");
            out.append("        <day>").append(date.getDayOfMonth()).append("</day>\n");
            out.append("        <month>").append(date.getMonthValue()).append("</month>\n");
            out.append("        <year>").append(date.getYear()).append("</year>\n");
            out.append("      </pub-date>\n");
        }

        // Volume / issue
        issue.ifPresent(i -> {
            if (i.volume() != null) {
                out.append("      <volume>").append(i.volume()).append("</volume>\n");
            }
            if (i.number() != null && !i.number().isBlank()) {
                out.append("      <issue>").append(escape(i.number())).append("</issue>\n");
            }
        });

        // Abstract
        String abs = pickLocale(pub.abstractText(), locale, config.defaultLocale());
        if (!abs.isBlank()) {
            out.append("      <abstract>\n");
            out.append("        <p>").append(escape(abs)).append("</p>\n");
            out.append("      </abstract>\n");
        }

        // Keywords
        if (pub.keywords() != null && !pub.keywords().isEmpty()) {
            out.append("      <kwd-group xml:lang=\"").append(escape(locale)).append("\">\n");
            for (String kw : pub.keywords()) {
                out.append("        <kwd>").append(escape(kw)).append("</kwd>\n");
            }
            out.append("      </kwd-group>\n");
        }

        // Self-uri pointers — one per approved galley
        for (GalleySummary g : galleys) {
            String href = g.remoteUrl() != null && !g.remoteUrl().isBlank()
                    ? g.remoteUrl()
                    : ("/api/v1/storage/" + g.submissionFileId());
            String label = pickLocale(g.label(), locale, config.defaultLocale());
            out.append("      <self-uri xlink:href=\"").append(escape(href)).append("\"");
            if (!label.isBlank()) {
                out.append(" content-type=\"").append(escape(label)).append("\"");
            }
            out.append("/>\n");
        }

        out.append("    </article-meta>\n");
    }

    private void renderAuthor(StringBuilder out, SubmissionAuthorSummary author) {
        out.append("        <contrib contrib-type=\"author\"");
        if (author.corresponding()) {
            out.append(" corresp=\"yes\"");
        }
        out.append(">\n");
        if (author.orcidId() != null && !author.orcidId().isBlank()) {
            out.append("          <contrib-id contrib-id-type=\"orcid\" authenticated=\"true\">")
                    .append(escape(normalizeOrcid(author.orcidId())))
                    .append("</contrib-id>\n");
        }
        out.append("          <name>\n");
        out.append("            <surname>").append(escape(emptyIfNull(author.familyName()))).append("</surname>\n");
        out.append("            <given-names>").append(escape(emptyIfNull(author.givenName()))).append("</given-names>\n");
        out.append("          </name>\n");
        if (author.affiliation() != null && !author.affiliation().isBlank()) {
            out.append("          <aff>").append(escape(author.affiliation())).append("</aff>\n");
        }
        if (author.email() != null && !author.email().isBlank() && author.corresponding()) {
            out.append("          <email>").append(escape(author.email())).append("</email>\n");
        }
        out.append("        </contrib>\n");
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
