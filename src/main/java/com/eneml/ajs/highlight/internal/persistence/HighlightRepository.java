package com.eneml.ajs.highlight.internal.persistence;

import com.eneml.ajs.highlight.internal.domain.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    List<Highlight> findByEnabledTrueOrderBySortOrderAscIdAsc();

    List<Highlight> findAllByOrderBySortOrderAscIdAsc();
}
