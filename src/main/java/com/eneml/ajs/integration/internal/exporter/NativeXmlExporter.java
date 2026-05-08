package com.eneml.ajs.integration.internal.exporter;

import com.eneml.ajs.issue.api.IssueLookup;
import com.eneml.ajs.issue.api.IssueSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.journal.api.SectionLookup;
import com.eneml.ajs.journal.api.SectionSummary;
import com.eneml.ajs.publication.api.PublicationLookup;
import com.eneml.ajs.publication.api.PublicationStatus;
import com.eneml.ajs.publication.api.PublicationSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Streams a ZIP archive containing the journal's structured content as
 * a tree of XML files. Layout:
 *
 * <pre>
 *   manifest.xml                — journal config, generation timestamp, item count
 *   content/sections/{id}.xml   — every active section
 *   content/issues/{id}.xml     — every published issue
 *   content/publications/{id}.xml — every published article
 * </pre>
 *
 * Custom shape — not OJS native, not JATS. Goal is a complete editorial
 * snapshot the journal can grep through, diff between two timestamps,
 * or feed to an importer in another system.
 */
@Service
@RequiredArgsConstructor
public class NativeXmlExporter {

    private final JournalLookup journalLookup;
    private final SectionLookup sectionLookup;
    private final IssueLookup issueLookup;
    private final PublicationLookup publicationLookup;

    public void writeTo(OutputStream out) throws IOException {
        try (ZipOutputStream zip = new ZipOutputStream(out, StandardCharsets.UTF_8)) {
            JournalConfigSummary cfg = journalLookup.getConfig();
            List<SectionSummary> sections = sectionLookup.listActive();
            List<IssueSummary> issues = issueLookup.listPublished(Integer.MAX_VALUE);
            List<PublicationSummary> publications = publicationLookup.latestPublished(Integer.MAX_VALUE)
                    .stream()
                    .filter(p -> p.status() == PublicationStatus.PUBLISHED)
                    .toList();

            writeManifest(zip, cfg, sections, issues, publications);
            for (SectionSummary s : sections) writeSection(zip, s);
            for (IssueSummary i : issues) writeIssue(zip, i);
            for (PublicationSummary p : publications) writePublication(zip, p);
        }
    }

    private void writeManifest(ZipOutputStream zip, JournalConfigSummary cfg,
                                List<SectionSummary> sections, List<IssueSummary> issues,
                                List<PublicationSummary> publications) throws IOException {
        zip.putNextEntry(new ZipEntry("manifest.xml"));
        Writer w = wrapper(zip);
        w.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        w.write("<manifest generatedAt=\"" + Instant.now() + "\">\n");
        w.write("  <journal>\n");
        if (cfg != null) {
            for (Map.Entry<String, String> e : cfg.name().entrySet()) {
                w.write("    <name xml:lang=\"" + xml(e.getKey()) + "\">" + xml(e.getValue()) + "</name>\n");
            }
            if (cfg.issnPrint() != null)  w.write("    <issn type=\"print\">"  + xml(cfg.issnPrint())  + "</issn>\n");
            if (cfg.issnOnline() != null) w.write("    <issn type=\"online\">" + xml(cfg.issnOnline()) + "</issn>\n");
            if (cfg.contactEmail() != null) w.write("    <contact>" + xml(cfg.contactEmail()) + "</contact>\n");
        }
        w.write("  </journal>\n");
        w.write("  <counts sections=\"" + sections.size()
                + "\" issues=\"" + issues.size()
                + "\" publications=\"" + publications.size() + "\"/>\n");
        w.write("</manifest>\n");
        w.flush();
        zip.closeEntry();
    }

    private void writeSection(ZipOutputStream zip, SectionSummary s) throws IOException {
        zip.putNextEntry(new ZipEntry("content/sections/" + s.id() + ".xml"));
        Writer w = wrapper(zip);
        w.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        w.write("<section id=\"" + s.id() + "\" code=\"" + xml(s.code()) + "\">\n");
        if (s.title() != null) {
            for (Map.Entry<String, String> e : s.title().entrySet()) {
                w.write("  <title xml:lang=\"" + xml(e.getKey()) + "\">" + xml(e.getValue()) + "</title>\n");
            }
        }
        w.write("</section>\n");
        w.flush();
        zip.closeEntry();
    }

    private void writeIssue(ZipOutputStream zip, IssueSummary i) throws IOException {
        zip.putNextEntry(new ZipEntry("content/issues/" + i.id() + ".xml"));
        Writer w = wrapper(zip);
        w.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        w.write("<issue id=\"" + i.id() + "\" volume=\"" + i.volume() + "\" number=\"" + xml(i.number()) + "\" year=\"" + i.year() + "\">\n");
        if (i.title() != null) {
            for (Map.Entry<String, String> e : i.title().entrySet()) {
                w.write("  <title xml:lang=\"" + xml(e.getKey()) + "\">" + xml(e.getValue()) + "</title>\n");
            }
        }
        if (i.datePublished() != null) {
            w.write("  <published>" + i.datePublished() + "</published>\n");
        }
        w.write("</issue>\n");
        w.flush();
        zip.closeEntry();
    }

    private void writePublication(ZipOutputStream zip, PublicationSummary p) throws IOException {
        zip.putNextEntry(new ZipEntry("content/publications/" + p.id() + ".xml"));
        Writer w = wrapper(zip);
        w.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        w.write("<publication id=\"" + p.id()
                + "\" version=\"" + p.version()
                + "\" submissionId=\"" + p.submissionId()
                + "\" sectionId=\"" + p.sectionId() + "\""
                + (p.issueId() == null ? "" : " issueId=\"" + p.issueId() + "\"")
                + " urlPath=\"" + xml(p.urlPath()) + "\""
                + " locale=\"" + xml(p.locale()) + "\">\n");
        if (p.datePublished() != null) {
            w.write("  <published>" + p.datePublished() + "</published>\n");
        }
        if (p.title() != null) {
            for (Map.Entry<String, String> e : p.title().entrySet()) {
                w.write("  <title xml:lang=\"" + xml(e.getKey()) + "\">" + xml(e.getValue()) + "</title>\n");
            }
        }
        if (p.abstractText() != null) {
            for (Map.Entry<String, String> e : p.abstractText().entrySet()) {
                w.write("  <abstract xml:lang=\"" + xml(e.getKey()) + "\">" + xml(e.getValue()) + "</abstract>\n");
            }
        }
        if (p.keywords() != null) {
            for (String k : p.keywords()) {
                w.write("  <keyword>" + xml(k) + "</keyword>\n");
            }
        }
        w.write("</publication>\n");
        w.flush();
        zip.closeEntry();
    }

    private static Writer wrapper(OutputStream zip) {
        return new java.io.OutputStreamWriter(zip, StandardCharsets.UTF_8);
    }

    private static String xml(String s) {
        if (s == null) return "";
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&'  -> out.append("&amp;");
                case '<'  -> out.append("&lt;");
                case '>'  -> out.append("&gt;");
                case '"'  -> out.append("&quot;");
                case '\'' -> out.append("&apos;");
                default -> out.append(c);
            }
        }
        return out.toString();
    }
}
