package com.eneml.ajs.discussion.internal.application;

import com.eneml.ajs.discussion.api.DiscussionLookup;
import com.eneml.ajs.discussion.api.DiscussionSummary;
import com.eneml.ajs.submission.api.SubmissionStage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DiscussionLookupAdapter implements DiscussionLookup {

    private final DiscussionService service;

    /** Bypasses participant filtering — call sites get every thread on the
     *  submission. Used by audit + admin surfaces, never by reviewer/author UI. */
    @Override
    public List<DiscussionSummary> listForSubmission(Long submissionId, SubmissionStage stage) {
        // Internal lookup that doesn't gate by viewer; we delegate to a
        // dedicated service method to keep the access boundary explicit.
        return service.listForSubmissionUnsafe(submissionId, stage);
    }

    @Override
    public List<DiscussionSummary> listForUser(Long userId) {
        return service.listForUser(userId);
    }
}
