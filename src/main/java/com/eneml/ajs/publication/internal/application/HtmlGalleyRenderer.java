package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.GalleyLookup;
import com.eneml.ajs.publication.api.GalleySummary;
import com.eneml.ajs.shared.exception.NotFoundException;
import com.eneml.ajs.storage.api.FileStorageService;
import com.eneml.ajs.storage.api.StoredFileMetadata;
import com.eneml.ajs.submission.api.SubmissionFileSummary;
import com.eneml.ajs.submission.api.SubmissionFiles;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads an HTML galley's stored bytes, rewrites references to dependent
 * assets so the served page can pull images / CSS / JS through
 * presigned URLs, and returns the modified HTML as a string.
 *
 * <p>Reference rewriting handles {@code src="..."}, {@code href="..."},
 * and {@code url(...)} occurrences — anything matching the filename of
 * a dependent {@link SubmissionFileSummary} (a child whose
 * {@code parentSubmissionFileId} points at the galley's submission
 * file) is replaced with a short-lived presigned URL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HtmlGalleyRenderer {

    private static final Duration ASSET_TTL = Duration.ofHours(1);
    private static final long MAX_HTML_BYTES = 5 * 1024 * 1024L;

    private static final Pattern SRC_HREF = Pattern.compile(
            "(\\b(?:src|href)\\s*=\\s*)([\"'])([^\"']+)\\2",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CSS_URL = Pattern.compile(
            "url\\(\\s*([\"']?)([^)\"']+)\\1\\s*\\)",
            Pattern.CASE_INSENSITIVE);

    private final GalleyLookup galleyLookup;
    private final SubmissionFiles submissionFiles;
    private final FileStorageService storage;

    public String render(Long galleyId) {
        GalleySummary galley = galleyLookup.findById(galleyId)
                .orElseThrow(() -> NotFoundException.of("Galley", galleyId));
        if (galley.submissionFileId() == null) {
            throw NotFoundException.of("HTML galley file", galleyId);
        }

        SubmissionFileSummary parent = submissionFiles.findById(galley.submissionFileId())
                .orElseThrow(() -> NotFoundException.of("SubmissionFile", galley.submissionFileId()));
        Map<String, SubmissionFileSummary> dependentsByName = new LinkedHashMap<>();
        for (SubmissionFileSummary child : submissionFiles.findChildrenByParent(parent.id())) {
            StoredFileMetadata meta = storage.findById(child.storedFileId()).orElse(null);
            if (meta == null) continue;
            String filename = meta.originalFilename();
            if (filename == null || filename.isBlank()) continue;
            dependentsByName.put(filename, child);
        }

        String html = readBytes(parent.storedFileId());
        if (dependentsByName.isEmpty()) {
            return html;
        }

        // Cache resolved URLs per child so we don't presign the same file twice
        // when the HTML references it from multiple places.
        Map<Long, String> urlByChildId = new HashMap<>();

        StringBuffer out = new StringBuffer(html.length());
        Matcher m = SRC_HREF.matcher(html);
        while (m.find()) {
            String prefix = m.group(1);
            String quote = m.group(2);
            String original = m.group(3);
            String replacement = resolveAsset(original, dependentsByName, urlByChildId);
            String value = replacement != null ? replacement : original;
            m.appendReplacement(out,
                    Matcher.quoteReplacement(prefix + quote + value + quote));
        }
        m.appendTail(out);

        StringBuffer out2 = new StringBuffer(out.length());
        Matcher m2 = CSS_URL.matcher(out.toString());
        while (m2.find()) {
            String quote = m2.group(1);
            String original = m2.group(2);
            String replacement = resolveAsset(original, dependentsByName, urlByChildId);
            String value = replacement != null ? replacement : original;
            m2.appendReplacement(out2,
                    Matcher.quoteReplacement("url(" + quote + value + quote + ")"));
        }
        m2.appendTail(out2);
        return out2.toString();
    }

    private String resolveAsset(String reference,
                                 Map<String, SubmissionFileSummary> dependents,
                                 Map<Long, String> urlCache) {
        if (reference == null || reference.isBlank()) return null;
        String trimmed = reference.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")
                || trimmed.startsWith("data:") || trimmed.startsWith("//")
                || trimmed.startsWith("#") || trimmed.startsWith("mailto:")) {
            return null;
        }
        // Strip query string + fragment to match the bare filename.
        int q = trimmed.indexOf('?');
        if (q >= 0) trimmed = trimmed.substring(0, q);
        int h = trimmed.indexOf('#');
        if (h >= 0) trimmed = trimmed.substring(0, h);
        // Strip leading directory components — galleys typically live alongside
        // their assets, but some packages keep them under "images/" or similar.
        int slash = trimmed.lastIndexOf('/');
        String basename = slash >= 0 ? trimmed.substring(slash + 1) : trimmed;
        SubmissionFileSummary child = dependents.get(basename);
        if (child == null) return null;
        return urlCache.computeIfAbsent(child.id(),
                id -> storage.downloadUrl(child.storedFileId(), ASSET_TTL).toString());
    }

    private String readBytes(Long storedFileId) {
        try (InputStream in = storage.openInputStream(storedFileId)) {
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] tmp = new byte[8192];
            long total = 0;
            int n;
            while ((n = in.read(tmp)) != -1) {
                total += n;
                if (total > MAX_HTML_BYTES) {
                    throw new IllegalStateException(
                            "HTML galley exceeds %d bytes; refusing to render".formatted(MAX_HTML_BYTES));
                }
                buf.write(tmp, 0, n);
            }
            return buf.toString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("failed to read HTML galley body for storedFileId={}: {}",
                    storedFileId, e.getMessage());
            throw NotFoundException.of("StoredFile", storedFileId);
        }
    }

    /** Test hook — exposes the regex-driven rewriter against a literal input. */
    String rewriteHtml(String html, List<String> dependents,
                       java.util.function.Function<String, String> resolver) {
        Map<String, String> map = new LinkedHashMap<>();
        for (String name : dependents) map.put(name, resolver.apply(name));
        StringBuffer out = new StringBuffer(html.length());
        Matcher m = SRC_HREF.matcher(html);
        while (m.find()) {
            String prefix = m.group(1);
            String quote = m.group(2);
            String original = m.group(3);
            String r = lookup(original, map);
            m.appendReplacement(out,
                    Matcher.quoteReplacement(prefix + quote + (r != null ? r : original) + quote));
        }
        m.appendTail(out);
        return out.toString();
    }

    private String lookup(String reference, Map<String, String> map) {
        int slash = reference.lastIndexOf('/');
        String basename = slash >= 0 ? reference.substring(slash + 1) : reference;
        return map.get(basename);
    }
}
