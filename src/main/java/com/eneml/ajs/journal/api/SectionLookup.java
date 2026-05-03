package com.eneml.ajs.journal.api;

import java.util.List;
import java.util.Optional;

public interface SectionLookup {

    Optional<SectionSummary> findById(Long sectionId);

    Optional<SectionSummary> findByCode(String code);

    List<SectionSummary> listActive();
}
