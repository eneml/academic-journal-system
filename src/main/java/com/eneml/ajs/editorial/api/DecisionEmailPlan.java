package com.eneml.ajs.editorial.api;

import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;

/**
 * Single source of truth for "which email-template key fires for
 * decision type X, addressed to audience Y". Both the messaging
 * listener (auto-render) and the wizard preview (manual edit) consult
 * this map so the editor and the listener can never drift out of sync.
 *
 * <p>Today every decision targets the AUTHOR; we add more audiences
 * (REVIEWERS, OTHER_AUTHORS, …) the same way once those flows land.
 */
public final class DecisionEmailPlan {

    private static final Map<DecisionType, String> AUTHOR_KEYS =
            new EnumMap<>(DecisionType.class);

    static {
        AUTHOR_KEYS.put(DecisionType.ACCEPT, "decision.accept.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.SKIP_REVIEW, "decision.skipReview.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.DECLINE, "decision.decline.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.INITIAL_DECLINE, "decision.initialDecline.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.REQUEST_REVISIONS, "decision.requestRevisions.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.RESUBMIT_FOR_REVIEW, "decision.resubmit.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.NEW_REVIEW_ROUND, "decision.newReviewRound.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.CANCEL_REVIEW_ROUND, "decision.cancelReviewRound.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.SEND_TO_PRODUCTION, "decision.sendToProduction.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.BACK_FROM_PRODUCTION, "decision.backFromProduction.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.BACK_FROM_COPYEDITING, "decision.backFromCopyediting.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.EXTERNAL_REVIEW, "decision.generic.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.REVERT_DECLINE, "decision.revertDecline.notifyAuthor");
        AUTHOR_KEYS.put(DecisionType.REVERT_INITIAL_DECLINE, "decision.revertInitialDecline.notifyAuthor");
        // Recommendations are advisory and don't notify the author —
        // intentionally absent from this map. The deciding editor sees them
        // through the in-app feed but no auto-email is sent.
    }

    private DecisionEmailPlan() {}

    public static Optional<String> authorKeyFor(DecisionType type) {
        return Optional.ofNullable(AUTHOR_KEYS.get(type));
    }
}
