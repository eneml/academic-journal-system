package com.eneml.ajs.metrics.api;

/**
 * Coarse classification of a galley file format for metrics rollups. The
 * caller derives this from the galley label (or filename extension) before
 * recording a download — the metrics module deliberately doesn't reach back
 * into publication::api to introspect the galley itself.
 */
public enum FormatKind {
    PDF,
    HTML,
    OTHER;

    /**
     * Best-effort classification from a free-form label like "PDF",
     * "Full text (HTML)", "Supplementary data", etc. Returns {@link #OTHER}
     * when the label is null/empty or doesn't mention a known format.
     */
    public static FormatKind classify(String label) {
        if (label == null) return OTHER;
        String s = label.toLowerCase();
        if (s.contains("pdf")) return PDF;
        if (s.contains("html") || s.contains("xml")) return HTML;
        return OTHER;
    }
}
