package com.eneml.ajs.editorial.internal.web.dto;

import java.util.List;

/**
 * One pre-rendered email step the wizard offers the editor before they
 * commit the decision. {@code locale} tells the UI which body it's
 * looking at (the editor sees the locale of the first recipient and can
 * edit from there); {@code recipientUserIds} drives the To: list when the
 * editor commits.
 *
 * <p>If {@code templateConfigured} is false the system has no seeded copy
 * for this key/locale combo and the body is empty — the wizard prompts
 * the editor to write something or skip the step.
 */
public record DecisionEmailPreview(
        String stepId,
        String label,
        String templateKey,
        String locale,
        boolean templateConfigured,
        boolean canSkip,
        List<DecisionEmailRecipient> recipients,
        String subject,
        String body) {
}
