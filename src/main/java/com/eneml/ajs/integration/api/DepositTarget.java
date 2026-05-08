package com.eneml.ajs.integration.api;

/** External services this journal can push metadata to. */
public enum DepositTarget {
    /** CrossRef DOI deposit (POST to deposit.crossref.org/v1/deposits). */
    CROSSREF,
    /** ORCID work record push (PUT to api.orcid.org/v3/{id}/work). */
    ORCID,
    /** DOAJ article create (POST to doaj.org/api/articles). */
    DOAJ
}
