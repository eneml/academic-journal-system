package com.eneml.ajs.dashboard.api;

import com.eneml.ajs.editorial.api.DecisionType;

/**
 * Single slice of the decision-outcome donut chart.
 *
 * @param type  enum-string of the editorial decision
 * @param count how many of these have been logged in the inspected window
 */
public record DecisionBreakdown(DecisionType type, long count) {
}
