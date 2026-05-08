package com.eneml.ajs.messaging.internal.listener;

import com.eneml.ajs.invitation.api.InvitationCreated;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.messaging.internal.application.MailService;
import com.eneml.ajs.messaging.internal.application.template.CanonicalEmailTemplateKey;
import com.eneml.ajs.messaging.internal.application.template.EmailTemplateService;
import com.eneml.ajs.messaging.internal.application.template.MailVars;
import com.eneml.ajs.messaging.internal.application.template.RenderedEmail;
import lombok.RequiredArgsConstructor;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Sends the invitation mail to the recipient's email address. Direct
 * send (no in-app notification) because the recipient is not yet a user
 * of the journal.
 */
@Component
@RequiredArgsConstructor
class InvitationListener {

    private final EmailTemplateService emailTemplates;
    private final JournalLookup journalLookup;
    private final MailService mailService;
    private final MailLinks mailLinks;

    @ApplicationModuleListener
    void on(InvitationCreated event) {
        JournalConfigSummary journal = journalLookup.getConfig();
        String acceptUrl = mailLinks.editor("/invitations/accept?key=" + event.secret());
        String declineUrl = mailLinks.editor("/invitations/decline?key=" + event.secret());

        MailVars vars = MailVars.create()
                .put("invitation.type", event.type().name().toLowerCase().replace('_', ' '))
                .put("invitation.email", event.email())
                .put("invitation.acceptUrl", acceptUrl)
                .put("invitation.declineUrl", declineUrl)
                .put("invitation.expiresAt", event.expiresAt());
        if (journal != null) {
            vars.put("journal.name", pickJournalName(journal));
            vars.put("journal.url", mailLinks.publicBase());
        }

        Optional<RenderedEmail> rendered = emailTemplates.render(
                CanonicalEmailTemplateKey.INVITATION_CREATED.key(),
                journal == null ? null : journal.defaultLocale(),
                vars);
        String subject = rendered.map(RenderedEmail::subject).orElse(
                "You have been invited to " + (journal == null ? "the journal" : pickJournalName(journal)));
        String body = rendered.map(RenderedEmail::body).orElse(
                "Click to accept: " + acceptUrl);
        mailService.sendDirect(event.email(), subject, body, acceptUrl);
    }

    private static String pickJournalName(JournalConfigSummary journal) {
        if (journal.name() == null || journal.name().isEmpty()) return "the journal";
        if (journal.defaultLocale() != null) {
            String def = journal.name().get(journal.defaultLocale());
            if (def != null && !def.isBlank()) return def;
        }
        for (Map.Entry<String, String> e : journal.name().entrySet()) {
            if (e.getValue() != null && !e.getValue().isBlank()) return e.getValue();
        }
        return "the journal";
    }
}
