package com.eneml.ajs.editorial.internal.engine;

import java.util.List;

/**
 * Carries the immutable inputs a {@link DecisionHandler} needs from the
 * caller: the actor, an optional review round id (for round-scoped
 * decisions), and a free-text summary the editor wrote.
 *
 * <p>{@code emailOverrides} is non-null when the wizard composed
 * messages instead of relying on the templated default — the engine
 * fires {@code DecisionEmailRequested} per override and tells listeners
 * to skip the default render path.
 */
public record DecisionContext(
        Long actorUserId,
        Long reviewRoundId,
        String summary,
        List<EmailOverride> emailOverrides
) {

    public DecisionContext(Long actorUserId, Long reviewRoundId, String summary) {
        this(actorUserId, reviewRoundId, summary, List.of());
    }

    public boolean hasEmailOverrides() {
        return emailOverrides != null && !emailOverrides.isEmpty();
    }

    /**
     * One pre-rendered, editor-edited email the wizard wants delivered.
     * {@code recipientUserId} is the in-system user id; the messaging
     * module resolves it to a real address through {@link
     * com.eneml.ajs.identity.api.UserDirectoryService}.
     */
    public record EmailOverride(
            Long recipientUserId,
            String templateKey,
            String subject,
            String body) {
    }
}
