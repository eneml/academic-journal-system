package com.eneml.ajs.dashboard.api;

/**
 * One month on the submission-vs-decision trend chart.
 *
 * @param month        1..12
 * @param submissions  manuscripts whose date_submitted falls in this month
 * @param decisions    accept / decline / revisions decisions logged in this month
 */
public record MonthlyFlowPoint(int month, long submissions, long decisions) {
}
