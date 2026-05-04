package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.identity.api.Role;
import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.api.NotificationType;
import com.eneml.ajs.messaging.internal.application.NotificationDraft;
import com.eneml.ajs.messaging.internal.application.NotificationService;
import com.eneml.ajs.submission.api.SubmissionSubmitted;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class SubmissionEventsListener {

    private final NotificationService notifications;
    private final UserDirectoryService userDirectory;

    @ApplicationModuleListener
    void on(SubmissionSubmitted event) {
        String title = "New submission for review";
        String body = "A new manuscript needs editorial triage.";
        for (var editor : userDirectory.findActiveWithRole(Role.EDITOR)) {
            notifications.create(new NotificationDraft(
                    editor.id(),
                    NotificationType.SUBMISSION_SUBMITTED,
                    NotificationLevel.TASK,
                    title,
                    body,
                    "submission",
                    event.submissionId(),
                    "/editor/submissions/" + event.submissionId()));
        }
    }
}
