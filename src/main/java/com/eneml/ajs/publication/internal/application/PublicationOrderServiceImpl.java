package com.eneml.ajs.publication.internal.application;

import com.eneml.ajs.publication.api.PublicationOrderService;
import com.eneml.ajs.publication.internal.domain.Publication;
import com.eneml.ajs.publication.internal.persistence.PublicationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
class PublicationOrderServiceImpl implements PublicationOrderService {

    private final PublicationRepository publications;

    @Override
    @Transactional
    public void reorderInIssue(Long issueId, List<Long> orderedPublicationIds) {
        if (orderedPublicationIds == null || orderedPublicationIds.isEmpty()) return;

        var rows = publications.findAllById(orderedPublicationIds);
        if (rows.size() != orderedPublicationIds.size()) {
            throw new IllegalArgumentException(
                    "Not all publication ids exist; check the order list."
            );
        }
        for (var p : rows) {
            if (p.getIssueId() == null || !p.getIssueId().equals(issueId)) {
                throw new IllegalArgumentException(
                        "Publication " + p.getId() + " is not in issue " + issueId
                );
            }
        }
        Map<Long, Publication> byId = rows.stream()
                .collect(Collectors.toMap(Publication::getId, Function.identity()));

        for (int i = 0; i < orderedPublicationIds.size(); i++) {
            var p = byId.get(orderedPublicationIds.get(i));
            p.setDisplayOrder(i);
        }
        publications.saveAll(rows);
    }

    @Override
    @Transactional
    public void moveToSection(Long publicationId, Long targetSectionId) {
        var p = publications.findById(publicationId).orElseThrow(
                () -> new IllegalArgumentException("Publication " + publicationId + " not found")
        );
        if (p.getSectionId().equals(targetSectionId)) return;
        p.setSectionId(targetSectionId);
        // Append: max(displayOrder) + 1 in the target section, scoped to the same issue.
        if (p.getIssueId() != null) {
            int next = publications.findInIssueOrdered(p.getIssueId()).stream()
                    .filter(x -> x.getSectionId().equals(targetSectionId))
                    .mapToInt(Publication::getDisplayOrder)
                    .max()
                    .orElse(-1) + 1;
            p.setDisplayOrder(next);
        }
        publications.save(p);
    }
}
