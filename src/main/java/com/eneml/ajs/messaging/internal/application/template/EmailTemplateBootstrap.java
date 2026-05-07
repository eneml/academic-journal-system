package com.eneml.ajs.messaging.internal.application.template;

import com.eneml.ajs.messaging.internal.domain.EmailTemplate;
import com.eneml.ajs.messaging.internal.persistence.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ensures every {@link CanonicalEmailTemplateKey} has a backing row in
 * {@code email_template} so the manager UI can list it. Idempotent — only
 * creates rows that don't already exist; never overwrites the
 * {@code description} or {@code enabled} flag once a row is in place, so
 * manual edits stick across restarts.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
class EmailTemplateBootstrap {

    @Bean
    ApplicationRunner ensureCanonicalEmailTemplates(EmailTemplateRepository repository) {
        return args -> {
            int created = 0;
            for (CanonicalEmailTemplateKey k : CanonicalEmailTemplateKey.values()) {
                if (repository.findByKey(k.key()).isEmpty()) {
                    EmailTemplate row = new EmailTemplate();
                    row.setKey(k.key());
                    row.setDescription(k.description());
                    row.setEnabled(true);
                    row.setCustom(false);
                    repository.save(row);
                    created++;
                }
            }
            if (created > 0) {
                log.info("email-templates: bootstrapped {} canonical rows", created);
            }
        };
    }
}
