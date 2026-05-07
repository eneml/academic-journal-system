package com.eneml.ajs.integration.internal.application;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.publication.api.DoiLookup;
import com.eneml.ajs.publication.api.DoiSummary;
import com.eneml.ajs.publication.api.PublicationSummary;
import com.eneml.ajs.submission.api.SubmissionAuthorSummary;
import com.eneml.ajs.submission.api.SubmissionLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Builds citation strings for a published article in the formats most
 * commonly requested by readers and reference-manager imports:
 *
 * <ul>
 *   <li>{@code BIBTEX}    — LaTeX/BibTeX entry, the de-facto standard for math/physics/CS.</li>
 *   <li>{@code RIS}       — RIS records, eaten by EndNote, Mendeley, Zotero.</li>
 *   <li>{@code ENDNOTE}   — EndNote tagged format (.enw).</li>
 *   <li>{@code APA}       — Plain-text APA 7th edition.</li>
 *   <li>{@code MLA}       — Plain-text MLA 9th edition.</li>
 *   <li>{@code CHICAGO}   — Plain-text Chicago author-date.</li>
 *   <li>{@code VANCOUVER} — Plain-text Vancouver / ICMJE.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class CitationFormatter {

    public enum Format { BIBTEX, RIS, ENDNOTE, APA, MLA, CHICAGO, VANCOUVER }

    private final SubmissionLookup submissionLookup;
    private final IssueLookup issueLookup;
    private final JournalLookup journalLookup;
    private final DoiLookup doiLookup;

    public String format(PublicationSummary pub, Format format) {
        JournalConfigSummary config = journalLookup.getConfig();
        String locale = !pub.locale().isBlank() ? pub.locale() : config.defaultLocale();
        String journalTitle = pickLocale(config.name(), locale, config.defaultLocale());
        String title = pickLocale(pub.title(), locale, config.defaultLocale());
        List<SubmissionAuthorSummary> authors = submissionLookup.authorsOf(pub.submissionId());
        Optional<IssueSummary> issue = pub.issueId() != null
                ? issueLookup.findById(pub.issueId())
                : Optional.empty();
        Optional<DoiSummary> doi = pub.doiId() != null
                ? doiLookup.findById(pub.doiId())
                : Optional.empty();
        Integer year = pub.datePublished() != null
                ? pub.datePublished().atZone(ZoneId.of("UTC")).getYear()
                : issue.map(IssueSummary::year).orElse(null);

        return switch (format) {
            case BIBTEX    -> bibtex(pub, title, authors, journalTitle, issue, doi, year);
            case RIS       -> ris(pub, title, authors, journalTitle, issue, doi, year);
            case ENDNOTE   -> endnote(pub, title, authors, journalTitle, issue, doi, year);
            case APA       -> apa(pub, title, authors, journalTitle, issue, doi, year);
            case MLA       -> mla(pub, title, authors, journalTitle, issue, doi, year);
            case CHICAGO   -> chicago(pub, title, authors, journalTitle, issue, doi, year);
            case VANCOUVER -> vancouver(pub, title, authors, journalTitle, issue, doi, year);
        };
    }

    private String bibtex(PublicationSummary pub, String title,
                          List<SubmissionAuthorSummary> authors, String journalTitle,
                          Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                          Integer year) {
        String key = bibtexKey(authors, year, pub.id());
        StringBuilder sb = new StringBuilder();
        sb.append("@article{").append(key).append(",\n");
        sb.append("  title = {").append(escapeBibtex(title)).append("},\n");
        if (!authors.isEmpty()) {
            sb.append("  author = {").append(authorsBibtex(authors)).append("},\n");
        }
        sb.append("  journal = {").append(escapeBibtex(journalTitle)).append("},\n");
        if (year != null) sb.append("  year = {").append(year).append("},\n");
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append("  volume = {").append(i.volume()).append("},\n");
            if (i.number() != null) sb.append("  number = {").append(escapeBibtex(i.number())).append("},\n");
        });
        if (pub.datePublished() != null) {
            LocalDate d = pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate();
            sb.append("  month = {").append(monthName(d.getMonthValue())).append("},\n");
        }
        doi.ifPresent(d -> sb.append("  doi = {").append(escapeBibtex(d.doi())).append("},\n"));
        sb.append("}\n");
        return sb.toString();
    }

    private String ris(PublicationSummary pub, String title,
                       List<SubmissionAuthorSummary> authors, String journalTitle,
                       Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                       Integer year) {
        StringBuilder sb = new StringBuilder();
        sb.append("TY  - JOUR\n");
        sb.append("TI  - ").append(safe(title)).append('\n');
        for (SubmissionAuthorSummary a : authors) {
            String name = (orEmpty(a.familyName()) + ", " + orEmpty(a.givenName())).trim();
            if (name.startsWith(",")) name = name.substring(1).trim();
            if (!name.isBlank()) sb.append("AU  - ").append(safe(name)).append('\n');
        }
        sb.append("JO  - ").append(safe(journalTitle)).append('\n');
        if (year != null) sb.append("PY  - ").append(year).append('\n');
        if (pub.datePublished() != null) {
            LocalDate d = pub.datePublished().atZone(ZoneId.of("UTC")).toLocalDate();
            sb.append("DA  - ").append(d).append('\n');
        }
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append("VL  - ").append(i.volume()).append('\n');
            if (i.number() != null) sb.append("IS  - ").append(safe(i.number())).append('\n');
        });
        doi.ifPresent(d -> sb.append("DO  - ").append(safe(d.doi())).append('\n'));
        if (pub.urlPath() != null && !pub.urlPath().isBlank()) {
            sb.append("UR  - /articles/").append(safe(pub.urlPath())).append('\n');
        }
        sb.append("ER  - \n");
        return sb.toString();
    }

    private String endnote(PublicationSummary pub, String title,
                           List<SubmissionAuthorSummary> authors, String journalTitle,
                           Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                           Integer year) {
        StringBuilder sb = new StringBuilder();
        sb.append("%0 Journal Article\n");
        sb.append("%T ").append(safe(title)).append('\n');
        for (SubmissionAuthorSummary a : authors) {
            String name = (orEmpty(a.familyName()) + ", " + orEmpty(a.givenName())).trim();
            if (name.startsWith(",")) name = name.substring(1).trim();
            if (!name.isBlank()) sb.append("%A ").append(safe(name)).append('\n');
        }
        sb.append("%J ").append(safe(journalTitle)).append('\n');
        if (year != null) sb.append("%D ").append(year).append('\n');
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append("%V ").append(i.volume()).append('\n');
            if (i.number() != null) sb.append("%N ").append(safe(i.number())).append('\n');
        });
        doi.ifPresent(d -> sb.append("%R ").append(safe(d.doi())).append('\n'));
        return sb.toString();
    }

    private String apa(PublicationSummary pub, String title,
                       List<SubmissionAuthorSummary> authors, String journalTitle,
                       Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                       Integer year) {
        StringBuilder sb = new StringBuilder();
        if (!authors.isEmpty()) {
            sb.append(authorsApa(authors));
            if (!sb.toString().endsWith(".")) sb.append('.');
            sb.append(' ');
        }
        if (year != null) sb.append('(').append(year).append("). ");
        sb.append(title.trim());
        if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) sb.append('.');
        sb.append(' ');
        sb.append("*").append(journalTitle).append("*");
        issue.ifPresent(i -> {
            if (i.volume() != null) {
                sb.append(", *").append(i.volume()).append("*");
                if (i.number() != null) sb.append("(").append(i.number()).append(")");
            }
        });
        sb.append(". ");
        doi.ifPresent(d -> sb.append("https://doi.org/").append(d.doi()));
        return sb.toString().trim() + "\n";
    }

    private String mla(PublicationSummary pub, String title,
                       List<SubmissionAuthorSummary> authors, String journalTitle,
                       Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                       Integer year) {
        StringBuilder sb = new StringBuilder();
        if (!authors.isEmpty()) {
            sb.append(authorsMla(authors)).append(". ");
        }
        sb.append('"').append(title.trim());
        if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) sb.append('.');
        sb.append("\" ");
        sb.append(journalTitle);
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append(", vol. ").append(i.volume());
            if (i.number() != null) sb.append(", no. ").append(safe(i.number()));
        });
        if (year != null) sb.append(", ").append(year);
        sb.append('.');
        doi.ifPresent(d -> sb.append(" https://doi.org/").append(d.doi()));
        return sb.toString().trim() + "\n";
    }

    private String chicago(PublicationSummary pub, String title,
                           List<SubmissionAuthorSummary> authors, String journalTitle,
                           Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                           Integer year) {
        StringBuilder sb = new StringBuilder();
        if (!authors.isEmpty()) {
            sb.append(authorsChicago(authors)).append('.');
            if (year != null) sb.append(' ').append(year).append('.');
        }
        sb.append(' ');
        sb.append('"').append(title.trim());
        if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) sb.append('.');
        sb.append("\" *").append(journalTitle).append("*");
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append(' ').append(i.volume());
            if (i.number() != null) sb.append(", no. ").append(safe(i.number()));
        });
        if (year != null) sb.append(" (").append(year).append(')');
        sb.append('.');
        doi.ifPresent(d -> sb.append(" https://doi.org/").append(d.doi()));
        return sb.toString().trim() + "\n";
    }

    private String vancouver(PublicationSummary pub, String title,
                             List<SubmissionAuthorSummary> authors, String journalTitle,
                             Optional<IssueSummary> issue, Optional<DoiSummary> doi,
                             Integer year) {
        StringBuilder sb = new StringBuilder();
        if (!authors.isEmpty()) {
            sb.append(authorsVancouver(authors)).append(". ");
        }
        sb.append(title.trim());
        if (!title.endsWith(".") && !title.endsWith("?") && !title.endsWith("!")) sb.append('.');
        sb.append(' ').append(journalTitle).append('.');
        if (year != null) sb.append(' ').append(year).append(';');
        issue.ifPresent(i -> {
            if (i.volume() != null) sb.append(i.volume());
            if (i.number() != null) sb.append('(').append(safe(i.number())).append(')');
        });
        sb.append('.');
        doi.ifPresent(d -> sb.append(" doi:").append(d.doi()));
        return sb.toString().trim() + "\n";
    }

    // ---------- helpers ----------

    private static String bibtexKey(List<SubmissionAuthorSummary> authors, Integer year, Long id) {
        String surname = authors.stream()
                .findFirst()
                .map(SubmissionAuthorSummary::familyName)
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.replaceAll("[^A-Za-z0-9]", "").toLowerCase())
                .orElse("anon");
        return surname + (year == null ? "" : year) + "_" + id;
    }

    private static String authorsBibtex(List<SubmissionAuthorSummary> authors) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < authors.size(); i++) {
            SubmissionAuthorSummary a = authors.get(i);
            if (i > 0) sb.append(" and ");
            // BibTeX: "Family, Given"
            String family = orEmpty(a.familyName()).trim();
            String given = orEmpty(a.givenName()).trim();
            if (!family.isBlank() && !given.isBlank()) {
                sb.append(escapeBibtex(family)).append(", ").append(escapeBibtex(given));
            } else if (!family.isBlank()) {
                sb.append(escapeBibtex(family));
            } else {
                sb.append(escapeBibtex(given));
            }
        }
        return sb.toString();
    }

    private static String authorsApa(List<SubmissionAuthorSummary> authors) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < authors.size(); i++) {
            SubmissionAuthorSummary a = authors.get(i);
            String family = orEmpty(a.familyName()).trim();
            String given = orEmpty(a.givenName()).trim();
            String initials = given.isBlank()
                    ? ""
                    : java.util.Arrays.stream(given.split("\\s+"))
                            .map(s -> s.isBlank() ? "" : s.charAt(0) + ".")
                            .reduce("", (acc, s) -> (acc + " " + s).trim());
            String formatted = family.isBlank() ? initials : (family + ", " + initials).trim();
            if (formatted.endsWith(",")) formatted = formatted.substring(0, formatted.length() - 1);
            if (i > 0) {
                if (i == authors.size() - 1) sb.append(", & ");
                else sb.append(", ");
            }
            sb.append(formatted);
        }
        return sb.toString();
    }

    private static String authorsMla(List<SubmissionAuthorSummary> authors) {
        // First author "Family, Given"; subsequent "Given Family"; ", and " before last.
        if (authors.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        SubmissionAuthorSummary first = authors.get(0);
        String firstFam = orEmpty(first.familyName()).trim();
        String firstGiv = orEmpty(first.givenName()).trim();
        sb.append(firstFam.isBlank() ? firstGiv : firstFam);
        if (!firstFam.isBlank() && !firstGiv.isBlank()) sb.append(", ").append(firstGiv);
        for (int i = 1; i < authors.size(); i++) {
            SubmissionAuthorSummary a = authors.get(i);
            String fam = orEmpty(a.familyName()).trim();
            String giv = orEmpty(a.givenName()).trim();
            if (i == authors.size() - 1) sb.append(", and ");
            else sb.append(", ");
            if (giv.isBlank()) sb.append(fam);
            else if (fam.isBlank()) sb.append(giv);
            else sb.append(giv).append(' ').append(fam);
        }
        return sb.toString();
    }

    private static String authorsChicago(List<SubmissionAuthorSummary> authors) {
        // Same as MLA in author-date convention.
        return authorsMla(authors);
    }

    private static String authorsVancouver(List<SubmissionAuthorSummary> authors) {
        // "Family GI" comma-separated; up to 6 authors, then "et al" (ICMJE).
        StringBuilder sb = new StringBuilder();
        int max = Math.min(authors.size(), 6);
        for (int i = 0; i < max; i++) {
            SubmissionAuthorSummary a = authors.get(i);
            String fam = orEmpty(a.familyName()).trim();
            String giv = orEmpty(a.givenName()).trim();
            String initials = giv.isBlank()
                    ? ""
                    : java.util.Arrays.stream(giv.split("\\s+"))
                            .filter(s -> !s.isBlank())
                            .map(s -> String.valueOf(s.charAt(0)))
                            .reduce("", String::concat);
            String entry = fam.isBlank() ? initials : (fam + (initials.isBlank() ? "" : " " + initials));
            if (i > 0) sb.append(", ");
            sb.append(entry);
        }
        if (authors.size() > 6) sb.append(", et al");
        return sb.toString();
    }

    private static String pickLocale(Map<String, String> values, String preferred, String fallback) {
        if (values == null || values.isEmpty()) return "";
        String v = values.get(preferred);
        if (v != null && !v.isBlank()) return v;
        v = values.get(fallback);
        if (v != null && !v.isBlank()) return v;
        return values.values().stream().filter(s -> s != null && !s.isBlank()).findFirst().orElse("");
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String safe(String s) {
        if (s == null) return "";
        // RIS records are line-based; strip CR/LF inside fields.
        return s.replace("\r", " ").replace("\n", " ").trim();
    }

    private static String escapeBibtex(String s) {
        if (s == null) return "";
        // Quote braces and backslashes; the rest is fine inside a {…} group.
        return s.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}");
    }

    private static String monthName(int m) {
        return switch (m) {
            case 1  -> "jan";  case 2  -> "feb";  case 3  -> "mar";  case 4  -> "apr";
            case 5  -> "may";  case 6  -> "jun";  case 7  -> "jul";  case 8  -> "aug";
            case 9  -> "sep";  case 10 -> "oct";  case 11 -> "nov";  case 12 -> "dec";
            default -> "";
        };
    }
}
