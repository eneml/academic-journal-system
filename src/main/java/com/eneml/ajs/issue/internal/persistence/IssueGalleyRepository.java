package com.eneml.ajs.issue.internal.persistence;

import com.eneml.ajs.issue.internal.domain.IssueGalley;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueGalleyRepository extends JpaRepository<IssueGalley, Long> {

    List<IssueGalley> findByIssueIdOrderBySeqAscIdAsc(Long issueId);

    void deleteByIssueId(Long issueId);
}
