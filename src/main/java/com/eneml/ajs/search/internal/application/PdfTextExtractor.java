package com.eneml.ajs.search.internal.application;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.InputStream;

/**
 * Pulls the plain text out of a PDF using PDFBox. Returns an empty
 * string on any extraction error so callers can persist gracefully
 * without a partial index update breaking the article's existing
 * tsvector.
 */
@Component
@Slf4j
class PdfTextExtractor {

    /** Max characters retained per article — guards against pathological inputs. */
    private static final int MAX_CHARS = 1_000_000;

    public String extract(InputStream stream) {
        if (stream == null) return "";
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(stream))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String raw = stripper.getText(doc);
            if (raw == null) return "";
            String collapsed = raw.replaceAll("\\s+", " ").trim();
            if (collapsed.length() > MAX_CHARS) {
                collapsed = collapsed.substring(0, MAX_CHARS);
            }
            return collapsed;
        } catch (Exception e) {
            log.warn("PDF extraction failed: {}", e.getMessage());
            return "";
        }
    }
}
