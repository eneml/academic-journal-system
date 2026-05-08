package com.eneml.ajs.scheduling.internal.job;

import com.eneml.ajs.dashboard.api.DashboardLookup;
import com.eneml.ajs.dashboard.api.StatsOverview;
import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.scheduling.api.EditorialReminderDue;
import com.eneml.ajs.scheduling.api.EditorialStatsReportDue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Monthly digest pass — fires on the 1st of every month at 09:00 server
 * local time. Editors and section editors get a "you have open editorial
 * work" reminder; admins additionally get a year-to-date KPI report.
 *
 * <p>Both events go through messaging::ReviewEventsListener-style
 * listeners that translate them into rendered emails.
 */
@Component
@RequiredArgsConstructor
@Slf4j
class EditorialDigestJob {

    private final UserDirectoryService userDirectory;
    private final DashboardLookup dashboard;
    private final ApplicationEventPublisher events;

    @Scheduled(cron = "0 0 9 1 * *")
    public void run() {
        Set<UserSummary> editors = new LinkedHashSet<>();
        editors.addAll(userDirectory.findActiveWithRole(Role.EDITOR));
        editors.addAll(userDirectory.findActiveWithRole(Role.SECTION_EDITOR));
        editors.addAll(userDirectory.findActiveWithRole(Role.ADMIN));
        for (UserSummary u : editors) {
            events.publishEvent(EditorialReminderDue.of(u.id()));
        }

        StatsOverview stats = dashboard.overview();
        for (UserSummary admin : userDirectory.findActiveWithRole(Role.ADMIN)) {
            events.publishEvent(EditorialStatsReportDue.of(
                    admin.id(),
                    stats.submissionsYtd(),
                    stats.articlesPublishedYtd(),
                    stats.acceptanceRatePct(),
                    stats.activeReviewers(),
                    stats.totalDecisions()));
        }
        log.info("editorial digest dispatched: {} reminders + stats report",
                editors.size());
    }
}
