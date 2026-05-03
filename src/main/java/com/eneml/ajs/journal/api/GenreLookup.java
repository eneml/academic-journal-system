package com.eneml.ajs.journal.api;

import java.util.List;
import java.util.Optional;

public interface GenreLookup {

    Optional<GenreSummary> findById(Long genreId);

    Optional<GenreSummary> findByCode(String code);

    List<GenreSummary> listEnabled();
}
