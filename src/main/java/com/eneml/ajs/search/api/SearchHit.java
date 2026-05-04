package com.eneml.ajs.search.api;

import com.eneml.ajs.publication.api.PublicationSummary;

public record SearchHit(
        PublicationSummary publication,
        double score,
        String snippet
) {
}
