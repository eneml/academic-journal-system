package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import com.eneml.ajs.scheduling.api.EditorialReminderDue;
import com.eneml.ajs.scheduling.api.EditorialStatsReportDue;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Translates monthly digest events into in-app notifications + emails.
 */
@Component
@RequiredArgsConstructor
class EditorialDigestListener {

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;
    private final EmailTemplateService emailTemplates;
    private final JournalLookup journalLookup;
    private final MailLinks mailLinks;

    @ApplicationModuleListener
    void on(EditorialReminderDue event) {
        UserSummary user = userDirectory.findById(event.recipientUserId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        MailVars vars = baseVars(user, journal)
                .put("editorial.dashboardUrl", mailLinks.editor("/editor/queue"));
        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.EDITORIAL_REMINDER.key(),
                user == null ? null : user.locale(),
                vars);
        notifications.create(new NotificationDraft(
                event.recipientUserId(),
                NotificationType.EDITORIAL_REMINDER,
                NotificationLevel.NORMAL,
                rendered.map(RenderedEmail::subject).orElse("Monthly editorial digest"),
                rendered.map(RenderedEmail::body).orElse("Open editorial work is waiting on your dashboard."),
                "editorial-digest",
                null,
                "/editor/queue",
                CanonicalEmailTemplateKey.EDITORIAL_REMINDER.key()));
    }

    @ApplicationModuleListener
    void on(EditorialStatsReportDue event) {
        UserSummary user = userDirectory.findById(event.recipientUserId()).orElse(null);
        JournalConfigSummary journal = journalLookup.getConfig();
        MailVars vars = baseVars(user, journal)
                .put("stats.submissionsYtd", event.submissionsYtd())
                .put("stats.articlesPublishedYtd", event.articlesPublishedYtd())
                .put("stats.acceptanceRatePct", event.acceptanceRatePct())
                .put("stats.activeReviewers", event.activeReviewers())
                .put("stats.totalDecisions", event.totalDecisions())
                .put("editorial.statsUrl", mailLinks.editor("/admin/stats"));
        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.EDITORIAL_STATISTICS_REPORT.key(),
                user == null ? null : user.locale(),
                vars);
        notifications.create(new NotificationDraft(
                event.recipientUserId(),
                NotificationType.EDITORIAL_STATS,
                NotificationLevel.NORMAL,
                rendered.map(RenderedEmail::subject).orElse("Monthly statistics report"),
                rendered.map(RenderedEmail::body).orElse("Year-to-date editorial KPIs."),
                "editorial-stats",
                null,
                "/admin/stats",
                CanonicalEmailTemplateKey.EDITORIAL_STATISTICS_REPORT.key()));
    }

    private MailVars baseVars(UserSummary recipient, JournalConfigSummary journal) {
        MailVars vars = MailVars.create();
        if (recipient != null) {
            vars
                    .put("recipient.givenName", recipient.givenName())
                    .put("recipient.familyName", recipient.familyName())
                    .put("recipient.fullName", recipient.fullName())
                    .put("recipient.email", recipient.email());
        }
        if (journal != null) {
            String name = pickJournalName(journal, recipient);
            vars.put("journal.name", name);
        }
        vars.put("journal.url", mailLinks.publicBase());
        return vars;
    }

    private static String pickJournalName(JournalConfigSummary journal, UserSummary recipient) {
        if (journal.name() == null || journal.name().isEmpty()) return "";
        if (recipient != null && recipient.locale() != null) {
            String byRecipient = journal.name().get(recipient.locale());
            if (byRecipient != null && !byRecipient.isBlank()) return byRecipient;
        }
        if (journal.defaultLocale() != null) {
            String byDefault = journal.name().get(journal.defaultLocale());
            if (byDefault != null && !byDefault.isBlank()) return byDefault;
        }
        return journal.name().values().stream().filter(v -> v != null && !v.isBlank()).findFirst().orElse("");
    }
}
