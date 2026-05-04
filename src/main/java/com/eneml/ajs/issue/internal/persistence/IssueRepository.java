package com.eneml.ajs.issue.internal.persistence;

import com.eneml.ajs.issue.internal.domain.Issue;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByUrlPath(String urlPath);

    @Query("""
            SELECT i FROM Issue i
            WHERE i.published = true
            ORDER BY i.datePublished DESC
            """)
    List<Issue> findPublishedRecent(Pageable pageable);

    Optional<Issue> findFirstByPublishedTrueOrderByDatePublishedDesc();
}
