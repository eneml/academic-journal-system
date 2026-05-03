package com.eneml.ajs.editorial.internal.engine;

/**
 * Carries the immutable inputs a {@link DecisionHandler} needs from the
 * caller: the actor, an optional review round id (for round-scoped
 * decisions), and a free-text summary the editor wrote.
 */
public record DecisionContext(
        Long actorUserId,
        Long reviewRoundId,
        String summary
) {
}
