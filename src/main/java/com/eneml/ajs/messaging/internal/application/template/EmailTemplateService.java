package com.eneml.ajs.messaging.internal.application.template;

import com.eneml.ajs.journal.api.JournalConfigSummary;
import com.eneml.ajs.journal.api.JournalLookup;
import com.eneml.ajs.messaging.internal.domain.EmailTemplate;
import com.eneml.ajs.messaging.internal.domain.EmailTemplateLocale;
import com.eneml.ajs.messaging.internal.persistence.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Resolves a (key, locale) pair through the locale fallback chain
 * {@code preferredLocale → journalDefault → "en"} and renders the result with
 * {@link MailRenderer}. When a key has no rows for any locale, returns
 * {@code Optional.empty()} so the calling listener can fall back to its
 * hardcoded behaviour and log a warning — that way ungated rollout doesn't
 * break workflow events while templates are still being seeded.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {

    private static final String FINAL_FALLBACK_LOCALE = "en";

    private final EmailTemplateRepository repository;
    private final MailRenderer renderer;
    private final JournalLookup journalLookup;

    @Transactional(readOnly = true)
    public Optional<RenderedEmail> render(String key, String preferredLocale, MailVars vars) {
        return repository.findByKey(key)
                .filter(EmailTemplate::isEnabled)
                .flatMap(t -> pickLocale(t, preferredLocale))
                .map(loc -> new RenderedEmail(
                        loc.getLocale(),
                        renderer.render(loc.getSubject(), vars.asFlatMap()),
                        renderer.render(loc.getBody(), vars.asFlatMap())));
    }

    private Optional<EmailTemplateLocale> pickLocale(EmailTemplate template, String preferred) {
        if (template.getLocales().isEmpty()) {
            return Optional.empty();
        }
        EmailTemplateLocale match = null;
        if (preferred != null && !preferred.isBlank()) {
            match = template.getLocales().get(preferred);
        }
        if (match == null) {
            String journalDefault = defaultLocale();
            match = template.getLocales().get(journalDefault);
        }
        if (match == null) {
            match = template.getLocales().get(FINAL_FALLBACK_LOCALE);
        }
        if (match == null) {
            // Last-ditch: any locale we have, deterministically picked.
            match = template.getLocales().values().stream()
                    .min((a, b) -> a.getLocale().compareTo(b.getLocale()))
                    .orElse(null);
        }
        return Optional.ofNullable(match);
    }

    private String defaultLocale() {
        try {
            JournalConfigSummary cfg = journalLookup.getConfig();
            if (cfg != null && cfg.defaultLocale() != null && !cfg.defaultLocale().isBlank()) {
                return cfg.defaultLocale();
            }
        } catch (RuntimeException e) {
            log.debug("journal config lookup failed; using {} fallback: {}",
                    FINAL_FALLBACK_LOCALE, e.getMessage());
        }
        return FINAL_FALLBACK_LOCALE;
    }
}
