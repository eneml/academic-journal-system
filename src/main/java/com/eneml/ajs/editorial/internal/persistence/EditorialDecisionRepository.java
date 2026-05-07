package com.eneml.ajs.editorial.internal.persistence;

import com.eneml.ajs.editorial.internal.domain.EditorialDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface EditorialDecisionRepository extends JpaRepository<EditorialDecision, Long> {

    List<EditorialDecision> findBySubmissionIdOrderByDateDecided(Long submissionId);

    @Query(value = """
            SELECT decision_type AS t, COUNT(*) AS c
            FROM editorial_decision
            WHERE date_decided >= :since
            GROUP BY decision_type
            """,
            nativeQuery = true)
    List<Object[]> decisionsByType(@Param("since") Instant since);

    @Query(value = """
            SELECT EXTRACT(MONTH FROM date_decided)::int AS m, COUNT(*) AS c
            FROM editorial_decision
            WHERE EXTRACT(YEAR FROM date_decided) = :year
              AND decision_type IN (:types)
            GROUP BY m
            ORDER BY m
            """,
            nativeQuery = true)
    List<Object[]> monthlyDecisionCounts(
            @Param("year") int year,
            @Param("types") Collection<String> types);
}
