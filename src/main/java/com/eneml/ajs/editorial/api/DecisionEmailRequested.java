package com.eneml.ajs.editorial.api;

import java.time.Instant;

/**
 * Cross-module event fired by the editorial decision wizard when the
 * editor has composed an email override. Messaging listens to it,
 * persists a notification with the editor-supplied subject + body, and
 * the existing notification → mail pipeline takes care of delivery.
 */
public record DecisionEmailRequested(
        Long decisionId,
        Long submissionId,
        DecisionType decisionType,
        Long recipientUserId,
        String templateKey,
        String subject,
        String body,
        Instant occurredAt
) {

    public static DecisionEmailRequested of(Long decisionId,
                                            Long submissionId,
                                            DecisionType decisionType,
                                            Long recipientUserId,
                                            String templateKey,
                                            String subject,
                                            String body) {
        return new DecisionEmailRequested(decisionId, submissionId, decisionType, recipientUserId,
                templateKey, subject, body, Instant.now());
    }
}
