package com.eneml.ajs.review.internal.persistence;

import com.eneml.ajs.review.internal.domain.ReviewForm;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewFormRepository extends JpaRepository<ReviewForm, Long> {

    @EntityGraph(attributePaths = "elements")
    Optional<ReviewForm> findWithElementsById(Long id);

    Optional<ReviewForm> findByCode(String code);

    List<ReviewForm> findAllByOrderByCodeAsc();
}
