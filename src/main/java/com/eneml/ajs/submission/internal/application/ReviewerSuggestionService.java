package com.eneml.ajs.submission.internal.application;

import com.eneml.ajs.submission.api.ReviewerSuggestionSummary;
import com.eneml.ajs.submission.internal.domain.ReviewerSuggestion;
import com.eneml.ajs.submission.internal.persistence.ReviewerSuggestionRepository;
import com.eneml.ajs.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewerSuggestionService {

    private final ReviewerSuggestionRepository repository;

    @Transactional(readOnly = true)
    public List<ReviewerSuggestionSummary> listFor(Long submissionId) {
        return repository.findBySubmissionIdOrderByCreatedAtAsc(submissionId).stream()
                .map(ReviewerSuggestionService::toSummary)
                .toList();
    }

    @Transactional
    public ReviewerSuggestionSummary add(Long submissionId,
                                          String givenName,
                                          String familyName,
                                          String email,
                                          String orcidId,
                                          String affiliation,
                                          String suggestionReason,
                                          Long existingUserId) {
        ReviewerSuggestion s = new ReviewerSuggestion();
        s.setSubmissionId(submissionId);
        s.setGivenName(givenName);
        s.setFamilyName(familyName);
        s.setEmail(email);
        s.setOrcidId(orcidId);
        s.setAffiliation(affiliation);
        s.setSuggestionReason(suggestionReason);
        s.setExistingUserId(existingUserId);
        return toSummary(repository.save(s));
    }

    @Transactional
    public ReviewerSuggestionSummary update(Long submissionId,
                                             Long suggestionId,
                                             String givenName,
                                             String familyName,
                                             String email,
                                             String orcidId,
                                             String affiliation,
                                             String suggestionReason) {
        ReviewerSuggestion s = load(submissionId, suggestionId);
        s.setGivenName(givenName);
        s.setFamilyName(familyName);
        s.setEmail(email);
        s.setOrcidId(orcidId);
        s.setAffiliation(affiliation);
        s.setSuggestionReason(suggestionReason);
        return toSummary(s);
    }

    @Transactional
    public ReviewerSuggestionSummary approve(Long submissionId,
                                              Long suggestionId,
                                              Long approverUserId) {
        ReviewerSuggestion s = load(submissionId, suggestionId);
        s.setApprovedAt(Instant.now());
        s.setApprovedByUserId(approverUserId);
        return toSummary(s);
    }

    @Transactional
    public void delete(Long submissionId, Long suggestionId) {
        ReviewerSuggestion s = load(submissionId, suggestionId);
        repository.delete(s);
    }

    private ReviewerSuggestion load(Long submissionId, Long suggestionId) {
        ReviewerSuggestion s = repository.findById(suggestionId)
                .orElseThrow(() -> new NotFoundException("reviewer suggestion not found: " + suggestionId));
        if (!s.getSubmissionId().equals(submissionId)) {
            throw new NotFoundException("reviewer suggestion not found: " + suggestionId);
        }
        return s;
    }

    static ReviewerSuggestionSummary toSummary(ReviewerSuggestion s) {
        return new ReviewerSuggestionSummary(
                s.getId(),
                s.getSubmissionId(),
                s.getGivenName(),
                s.getFamilyName(),
                s.getEmail(),
                s.getOrcidId(),
                s.getAffiliation(),
                s.getSuggestionReason(),
                s.getExistingUserId(),
                s.getApprovedAt(),
                s.getApprovedByUserId(),
                s.getCreatedAt());
    }
}
