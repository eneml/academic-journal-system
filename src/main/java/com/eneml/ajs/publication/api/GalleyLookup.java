package com.eneml.ajs.publication.api;

import java.util.List;
import java.util.Optional;

public interface GalleyLookup {

    List<GalleySummary> galleysOfPublication(Long publicationId);

    List<GalleySummary> approvedGalleysOfPublication(Long publicationId);

    Optional<GalleySummary> findById(Long galleyId);
}
