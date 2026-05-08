package com.eneml.ajs.publication.api;

public enum DoiStatus {
    NOT_REGISTERED,
    SUBMITTED,
    REGISTERED,
    ERROR,
    /**
     * The article has been edited after its last successful CrossRef
     * deposit; the live deposit no longer matches the article and the
     * record needs a re-deposit. Set by the weekly sweep.
     */
    STALE
}
