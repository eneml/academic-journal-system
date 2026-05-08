package com.eneml.ajs.messaging.internal.application;

import com.eneml.ajs.identity.api.UserDirectoryService;
import com.eneml.ajs.identity.api.UserSummary;
import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.messaging.api.NotificationLevel;
import com.eneml.ajs.messaging.internal.application.template.NotificationSubscriptionService;
import com.eneml.ajs.messaging.internal.domain.EmailLog;
import com.eneml.ajs.messaging.internal.domain.Notification;
import com.eneml.ajs.messaging.internal.persistence.EmailLogRepository;
import com.eneml.ajs.messaging.internal.persistence.NotificationRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

/**
 * Wraps {@link JavaMailSender} with a journal-aware Thymeleaf template
 * pass. Sending is best-effort: a transient SMTP failure logs and
 * returns rather than throwing, so a transactional listener doesn't
 * roll back its persistence work just because the mail server hiccuped.
 *
 * <p>The address is resolved from the recipient's userId via
 * {@link UserDirectoryService}; if the user has been deleted between
 * notification creation and email dispatch, we silently skip.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final UserDirectoryService userDirectory;
    private final JournalLookup journalLookup;
    private final NotificationRepository notificationRepository;
    private final NotificationSubscriptionService subscriptions;
    private final EmailLogRepository emailLogRepository;

    @Value("${app.email.from}")
    private String fromAddress;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.editorial-app-url}")
    private String editorialBaseUrl;

    public void sendForNotification(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId).orElse(null);
        if (n == null) {
            log.debug("notification {} not found; skipping email", notificationId);
            return;
        }
        // Only TASK-level notifications produce emails — TRIVIAL/NORMAL stay in-app
        // so we don't drown people with mail every time anything happens.
        if (n.getLevel() == NotificationLevel.TRIVIAL) {
            return;
        }
        // Per-user opt-out: if the user has muted this template key, the in-app
        // banner still shows but mail is suppressed. Notifications without a
        // template key (ad-hoc system messages) always send.
        if (n.getTemplateKey() != null
                && subscriptions.isBlocked(n.getUserId(), n.getTemplateKey())) {
            log.debug("notification {} skipped: user {} muted '{}'",
                    notificationId, n.getUserId(), n.getTemplateKey());
            emailLogRepository.save(EmailLog.skipped(n.getTemplateKey(), "(blocked)",
                    n.getTitle(), n.getUserId(), n.getId(), "user opted out"));
            return;
        }
        UserSummary recipient = userDirectory.findById(n.getUserId()).orElse(null);
        if (recipient == null || recipient.email() == null || recipient.email().isBlank()) {
            log.debug("notification {} has no deliverable recipient", notificationId);
            return;
        }

        JournalConfigSummary config = journalLookup.getConfig();
        String journalName = pickName(config);
        String subject = "[" + journalName + "] " + n.getTitle();

        Context ctx = new Context();
        ctx.setVariable("journalName", journalName);
        ctx.setVariable("subject", n.getTitle());
        ctx.setVariable("title", n.getTitle());
        ctx.setVariable("body", n.getBody());
        ctx.setVariable("actionUrl", buildActionUrl(n));
        String html = templateEngine.process("email/notification", ctx);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress, fromName + " — " + journalName);
            helper.setTo(recipient.email());
            helper.setSubject(subject);
            helper.setText(plainTextFor(n), html);
            mailSender.send(message);
            emailLogRepository.save(EmailLog.sent(n.getTemplateKey(), recipient.email(),
                    subject, n.getUserId(), n.getId()));
        } catch (MessagingException | MailException | java.io.UnsupportedEncodingException e) {
            log.warn("failed to deliver notification {} to {}: {}",
                    notificationId, recipient.email(), e.getMessage());
            emailLogRepository.save(EmailLog.failed(n.getTemplateKey(), recipient.email(),
                    subject, n.getUserId(), n.getId(), e.getMessage()));
        }
    }

    private static String pickName(JournalConfigSummary config) {
        if (config.name() == null || config.name().isEmpty()) return "Academic Journal";
        String def = config.name().get(config.defaultLocale());
        if (def != null && !def.isBlank()) return def;
        return config.name().values().iterator().next();
    }

    private String buildActionUrl(Notification n) {
        if (n.getHref() == null || n.getHref().isBlank()) return null;
        if (n.getHref().startsWith("http://") || n.getHref().startsWith("https://")) {
            return n.getHref();
        }
        String base = editorialBaseUrl.endsWith("/")
                ? editorialBaseUrl.substring(0, editorialBaseUrl.length() - 1)
                : editorialBaseUrl;
        String path = n.getHref().startsWith("/") ? n.getHref() : "/" + n.getHref();
        return base + path;
    }

    /**
     * Direct send for cases where there's no Notification row — e.g.
     * invitations to a non-user email address. The template is the same
     * Thymeleaf wrapper used for in-app notifications, fed with explicit
     * subject/title/body/actionUrl variables.
     */
    public void sendDirect(String toEmail, String subject, String body, String actionUrl) {
        sendDirect(toEmail, subject, body, actionUrl, null);
    }

    /**
     * Same as {@link #sendDirect(String, String, String, String)} but
     * tags the email_log row with a template key so the audit can group
     * by template family (e.g. all invitation.created emails).
     */
    public void sendDirect(String toEmail, String subject, String body, String actionUrl,
                           String templateKey) {
        if (toEmail == null || toEmail.isBlank()) return;
        JournalConfigSummary config = journalLookup.getConfig();
        String journalName = pickName(config);
        String fullSubject = "[" + journalName + "] " + subject;

        Context ctx = new Context();
        ctx.setVariable("journalName", journalName);
        ctx.setVariable("subject", subject);
        ctx.setVariable("title", subject);
        ctx.setVariable("body", body);
        ctx.setVariable("actionUrl", actionUrl);
        String html = templateEngine.process("email/notification", ctx);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress, fromName + " — " + journalName);
            helper.setTo(toEmail);
            helper.setSubject(fullSubject);
            StringBuilder plain = new StringBuilder();
            plain.append(subject).append("\n\n");
            if (body != null && !body.isBlank()) plain.append(body).append("\n\n");
            if (actionUrl != null && !actionUrl.isBlank()) plain.append("Open: ").append(actionUrl).append("\n");
            helper.setText(plain.toString(), html);
            mailSender.send(message);
            emailLogRepository.save(EmailLog.sent(templateKey, toEmail, fullSubject, null, null));
        } catch (MessagingException | MailException | java.io.UnsupportedEncodingException e) {
            log.warn("failed to deliver direct mail to {}: {}", toEmail, e.getMessage());
            emailLogRepository.save(EmailLog.failed(templateKey, toEmail, fullSubject,
                    null, null, e.getMessage()));
        }
    }

    private static String plainTextFor(Notification n) {
        StringBuilder sb = new StringBuilder();
        sb.append(n.getTitle()).append("\n\n");
        if (n.getBody() != null && !n.getBody().isBlank()) {
            sb.append(n.getBody()).append("\n\n");
        }
        if (n.getHref() != null && !n.getHref().isBlank()) {
            sb.append("Open: ").append(n.getHref()).append("\n");
        }
        return sb.toString();
    }
}
